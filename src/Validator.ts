/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 * Description: Helps to validate the client data
 **********************************************************************/
import * as WebSocket from 'ws'

import { IValidator } from './interfaces/IValidator'
import { ILogger } from './interfaces/ILogger'
import { ClientMsg, ClientAction, Payload, ClientMethods, ClientObject } from './models/RCS.Config'
import { IConfigurator } from './interfaces/IConfigurator'
import { IClientManager } from './interfaces/IClientManager'
import { IClientMessageParser } from './interfaces/IClientMessageParser'
import { ClientMsgJsonParser } from './utils/ClientMsgJsonParser'
import { RPSError } from './utils/RPSError'
import { CommandParser } from './CommandParser'
import { VersionChecker } from './VersionChecker'
import { AMTUserName } from './utils/constants'
import { EnvReader } from './utils/EnvReader'
import got from 'got'
import { AMTConfiguration, AMTDeviceDTO } from './models'
export class Validator implements IValidator {
  jsonParser: IClientMessageParser

  constructor (
    private readonly logger: ILogger,
    private readonly configurator: IConfigurator,
    private readonly clientManager: IClientManager
  ) {
    this.jsonParser = new ClientMsgJsonParser()
  }

  /**
   * @description Parse client message and check for mandatory information
   * @param {WebSocket.Data} message the message coming in over the websocket connection
   * @param {string} clientId Id to keep track of connections
   * @returns {ClientMsg} returns ClientMsg object if client message is valid. Otherwise returns null.
   */
  parseClientMsg (message: WebSocket.Data, clientId: string): ClientMsg {
    let msg: ClientMsg = null
    try {
      // Parse and convert the message
      if (typeof message === 'string') {
        msg = this.jsonParser.parse(message, clientId)

        if (msg?.protocolVersion) {
          if (VersionChecker.isCompatible(msg.protocolVersion)) {
            this.logger.silly(`protocol version supported: ${msg.protocolVersion}`)
          } else {
            throw new RPSError(`protocol version NOT supported: ${msg.protocolVersion}`)
          }
        }

        if (msg.method !== ClientMethods.RESPONSE && msg.method !== ClientMethods.HEARTBEAT) {
          msg = CommandParser.parse(msg)
        }
      }
    } catch (error) {
      this.logger.error(`${clientId}: Failed to parse client message`)
      throw error
    }
    return msg
  }

  /**
   * @description Validate the client message only if action is not acmactivate-success or ccmactivate-success
   * @param {ClientMsg} msg
   * @param {string} clientId
   * @returns {RCSMessage}
   */
  async validateActivationMsg (msg: ClientMsg, clientId: string): Promise<void> {
    let clientObj = this.clientManager.getClientObject(clientId)
    const payload: Payload = this.verifyPayload(msg, clientId)
    // Check version and build compatibility
    this.verifyAMTVersion(payload, 'activation')
    // Check for password
    if (!payload.password) {
      throw new RPSError(`Device ${payload.uuid} activation failed. Missing password.`)
    }
    // Check for client requested action and profile activation
    const profile: AMTConfiguration = await this.configurator.profileManager.getAmtProfile(payload.profile)
    if (!profile) {
      throw new RPSError(`Device ${payload.uuid} activation failed. ${payload.profile} does not match list of available AMT profiles.`)
    }
    payload.profile = profile
    // Store the client message
    clientObj.uuid = payload.uuid
    if (profile.activation === ClientAction.ADMINCTLMODE) {
      clientObj.action = ClientAction.ADMINCTLMODE
    } else if (profile.activation === ClientAction.CLIENTCTLMODE) {
      clientObj.action = ClientAction.CLIENTCTLMODE
    }
    msg.payload = payload
    clientObj.ClientData = msg
    this.clientManager.setClientObject(clientObj)
    // Check for the current activation mode on AMT
    await this.verifyCurrentModeForActivation(msg, profile, clientId)
    clientObj = this.clientManager.getClientObject(clientId)
    if (!clientObj.action) {
      throw new RPSError(`Device ${payload.uuid} activation failed. Failed to get activation mode for the profile :${payload.profile}`)
    }
    // Validate client message to configure ACM message
    if (clientObj.action === ClientAction.ADMINCTLMODE) {
      await this.verifyActivationMsgForACM(payload)
    }
  }

  /**
 * @description Validate the client message only if action is not acmactivate-success or ccmactivate-success
 * @param {ClientMsg} msg
 * @param {string} clientId
 * @returns {RCSMessage}
 */
  async validateDeactivationMsg (msg: ClientMsg, clientId: string): Promise<void> {
    const clientObj = this.clientManager.getClientObject(clientId)
    const payload: Payload = this.verifyPayload(msg, clientId)
    // Check for the current mode
    if (payload.currentMode >= 0) {
      switch (payload.currentMode) {
        case 0: {
          throw new RPSError(`Device ${payload.uuid} is in pre-provisioning mode.`)
        }
        case 1: {
          clientObj.action = ClientAction.DEACTIVATE
          this.logger.debug(`Device ${payload.uuid} is in client control mode.`)
          break
        }
        case 2: {
          clientObj.action = ClientAction.DEACTIVATE
          this.logger.debug(`Device ${payload.uuid} is in admin control mode.`)
          break
        }
        default: {
          throw new RPSError(`Device ${payload.uuid} deactivation failed. It is in unknown mode: ${payload.currentMode}.`)
        }
      }
    }
    // Check version and build compatibility
    this.verifyAMTVersion(payload, 'deactivation')
    // Check for forced deactivation request
    if (msg.payload.force) {
      this.logger.debug('bypassing password check')
    } else {
      await this.verifyDevicePassword(payload)
    }
    // Store the client message
    clientObj.uuid = payload.uuid
    msg.payload = payload
    clientObj.ClientData = msg
    this.clientManager.setClientObject(clientObj)
  }

  /**
   * @description Validate realm of client message
   * @param {string} realm
   * @param {string} clientId
   * @returns {boolean}
   */
  isDigestRealmValid (realm: string): boolean {
    const regex: RegExp = /[0-9A-Fa-f]{32}/g
    let isValidRealm: boolean = false
    let realmElements: any = {}
    if (realm?.startsWith('Digest:')) {
      realmElements = realm.split('Digest:')
      if (realmElements[1].length === 32 && regex.test(realmElements[1])) {
        isValidRealm = true
      }
    }
    return isValidRealm
  }

  async updateTags (uuid: string, profile: AMTConfiguration): Promise<void> {
    let tags = []
    if (profile?.tags.length > 0) {
      tags = profile.tags
      await got(`${EnvReader.GlobalEnvConfig.mpsServer}/api/v1/devices`, {
        method: 'PATCH',
        json: {
          guid: uuid,
          tags: tags
        }
      })
    }
  }

  async validateMaintenanceMsg (msg: ClientMsg, clientId: string): Promise<void> {
    const clientObj = this.clientManager.getClientObject(clientId)
    const payload: Payload = this.verifyPayload(msg, clientId)
    // Check for the current mode
    if (payload.currentMode > 0) {
      const mode = payload.currentMode === 1 ? 'client control mode' : 'admin control mode'
      clientObj.action = ClientAction.MAINTENANCE
      this.logger.debug(`Device ${payload.uuid} is in ${mode}.`)
    } else {
      throw new RPSError(`Device ${payload.uuid} is in pre-provisioning mode.`)
    }
    await this.verifyDevicePassword(payload)
    clientObj.ClientData = msg
    this.clientManager.setClientObject(clientObj)
  }

  async verifyDevicePassword (payload: Payload): Promise<void> {
    try {
      if (this.configurator?.amtDeviceRepository) {
        const amtDevice = await this.configurator.amtDeviceRepository.get(payload.uuid)

        if (amtDevice?.amtpass && payload.password && payload.password === amtDevice.amtpass) {
          this.logger.debug(`AMT password matches stored version for Device ${payload.uuid}`)
        } else {
          this.logger.error(`stored version for Device ${payload.uuid}`)
          throw new RPSError(`AMT password DOES NOT match stored version for Device ${payload.uuid}`)
        }
      } else {
        this.logger.error(`Device ${payload.uuid} secret provider not found`)
        throw new RPSError(`Device ${payload.uuid} secret provider not found`)
      }
    } catch (error) {
      this.logger.error(`AMT device secret provider exception: ${error}`)
      if (error instanceof RPSError) {
        throw new RPSError(`${error.message}`)
      } else {
        throw new Error('AMT device secret provider exception')
      }
    }
  }

  verifyPayload (msg: ClientMsg, clientId: string): Payload {
    if (!msg) {
      throw new RPSError(`${clientId} - Error while Validating the client message`)
    }
    if (!msg.payload.uuid) {
      throw new RPSError(`${clientId} - Missing uuid from payload`)
    }
    return msg.payload
  }

  async verifyActivationMsgForACM (payload: Payload): Promise<void> {
    if (!payload.certHashes) {
      throw new RPSError(`Device ${payload.uuid} activation failed. Missing certificate hashes from the device.`)
    }
    if (!payload.fqdn) {
      throw new RPSError(`Device ${payload.uuid} activation failed. Missing DNS Suffix.`)
    }
    if (!(await this.configurator.domainCredentialManager.doesDomainExist(payload.fqdn))) {
      throw new RPSError(`Device ${payload.uuid} activation failed. Specified AMT domain suffix: ${payload.fqdn} does not match list of available AMT domain suffixes.`)
    }
  }

  async verifyCurrentModeForActivation (msg: ClientMsg, profile: AMTConfiguration, clientId: string): Promise<void> {
    const clientObj = this.clientManager.getClientObject(clientId)
    switch (msg.payload.currentMode) {
      case 0: {
        this.logger.debug(`Device ${msg.payload.uuid} is in pre-provisioning mode`)
        break
      }
      case 1: {
        if (profile.activation !== ClientAction.CLIENTCTLMODE) {
          throw new RPSError(`Device ${msg.payload.uuid} already enabled in client control mode.`)
        }
        this.logger.debug(`Device ${msg.payload.uuid} already enabled in client mode.`)
        clientObj.status.Status = 'already enabled in client mode.'
        await this.setNextStepsForConfiguration(msg, clientObj, clientId)
        break
      }
      case 2: {
        if (profile.activation !== ClientAction.ADMINCTLMODE) {
          throw new RPSError(`Device ${msg.payload.uuid} already enabled in admin control mode.`)
        }
        this.logger.debug(`Device ${msg.payload.uuid} already enabled in admin mode.`)
        clientObj.status.Status = 'already enabled in admin mode.'
        await this.setNextStepsForConfiguration(msg, clientObj, clientId)
        break
      }
      default: {
        throw new RPSError(`Device ${msg.payload.uuid} activation failed. It is in unknown mode.`)
      }
    }
    this.clientManager.setClientObject(clientObj)
  }

  async getDeviceCredentials (msg: ClientMsg): Promise<AMTDeviceDTO> {
    if (!this.configurator?.amtDeviceRepository) {
      this.logger.error(`Device ${msg.payload.uuid} not found`)
      throw new RPSError(`Device ${msg.payload.uuid} not found`)
    }
    try {
      const amtDevice: AMTDeviceDTO = await this.configurator.amtDeviceRepository.get(msg.payload.uuid)
      if (amtDevice?.amtpass == null) {
        this.logger.error(`AMT device DOES NOT exists ${msg.payload.uuid}`)
        throw new RPSError(`AMT device DOES NOT exists ${msg.payload.uuid}`)
      }
      return amtDevice
    } catch (error) {
      this.logger.error(`AMT device DOES NOT exists ${msg.payload.uuid}`)
    }
    return null
  }

  async setNextStepsForConfiguration (msg: ClientMsg, clientObj: ClientObject, clientId: string): Promise<void> {
    let amtDevice: AMTDeviceDTO = null
    try {
      amtDevice = await this.getDeviceCredentials(msg)
    } catch (error) {
      this.logger.error(`AMT device DOES NOT exists ${msg.payload.uuid}`)
    }
    if (amtDevice?.amtpass) {
      if (amtDevice.amtpass !== msg.payload.password) {
        throw new RPSError(`AMT password DOES NOT match stored version for Device ${msg.payload.uuid}`)
      }
      msg.payload.username = AMTUserName
      msg.payload.password = amtDevice.amtpass
      this.logger.debug(`AMT password found for Device ${msg.payload.uuid}`)
      await this.updateTags(msg.payload.uuid, msg.payload.profile)
      if (clientObj.action === ClientAction.ADMINCTLMODE) {
        if (!amtDevice.mebxpass) {
          clientObj.activationStatus.activated = true
          clientObj.activationStatus.missingMebxPassword = true
          clientObj.amtPassword = amtDevice.amtpass
        } else {
          clientObj.action = ClientAction.NETWORKCONFIG
        }
      }
    } else {
      clientObj.activationStatus.activated = true
      clientObj.activationStatus.changePassword = true
      clientObj.activationStatus.missingMebxPassword = false
      msg.payload.username = AMTUserName
    }
    clientObj.ClientData = msg
    this.clientManager.setClientObject(clientObj)
  }

  verifyAMTVersion (payload: Payload, action: string): void {
    if (parseInt(payload.ver) >= 7 && parseInt(payload.ver) < 12) {
      if (parseInt(payload.build) < 3000) {
        throw new RPSError(`Device ${payload.uuid} ${action} failed. Only version ${payload.ver} with build greater than 3000 can be remotely configured `)
      }
    } else if (parseInt(payload.ver) < 7) {
      throw new RPSError(`Device ${payload.uuid} ${action} failed. AMT version: ${payload.ver}. Version less than 7 cannot be remotely configured `)
    }
  }
}
