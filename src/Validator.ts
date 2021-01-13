/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 * Description: Helps to validate the client data
 **********************************************************************/
import * as WebSocket from 'ws'

import { IValidator } from './interfaces/IValidator'
import { ILogger } from './interfaces/ILogger'
import { ClientMsg, ClientAction, Payload, ClientMethods } from './RCS.Config'
import { IConfigurator } from './interfaces/IConfigurator'
import { IClientManager } from './interfaces/IClientManager'
import { NodeForge } from './NodeForge'
import { IClientMessageParser } from './interfaces/IClientMessageParser'
import { ClientMsgJsonParser } from './utils/ClientMsgJsonParser'
import { RPSError } from './utils/RPSError'
import { CommandParser } from './CommandParser'
import { AMTDeviceDTO } from './repositories/dto/AmtDeviceDTO'
import { VersionChecker } from './VersionChecker'
import { AMTUserName } from './utils/constants'

export class Validator implements IValidator {
  jsonParser: IClientMessageParser

  constructor (
    private readonly logger: ILogger,
    private readonly configurator: IConfigurator,
    private readonly clientManager: IClientManager,
    private readonly nodeForge: NodeForge
  ) {
    this.jsonParser = new ClientMsgJsonParser(this.nodeForge)
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

        if (msg.method !== ClientMethods.RESPONSE) {
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
    let payload: Payload = null
    if (!msg) {
      throw new RPSError('Error while Validating the client message')
    }

    payload = msg.payload

    if (!payload.uuid) {
      throw new RPSError('Missing uuid from payload')
    }

    // Check version and build compatibility
    if (parseInt(payload.ver) > 7 && parseInt(payload.ver) < 12) {
      if (parseInt(payload.build) < 3000) {
        throw new RPSError(`Device ${payload.uuid} activation failed. Only version ${payload.ver} with build greater than 3000 can be remotely configured `)
      }
    } else if (parseInt(payload.ver) < 7) {
      throw new RPSError(`Device ${payload.uuid} activation failed. AMT version: ${payload.ver}. Version less than 7 cannot be remotely configured `)
    }

    // Check for password
    if (!payload.password) {
      throw new RPSError(`Device ${payload.uuid} activation failed. Missing password.`)
    }

    const clientObj = this.clientManager.getClientObject(clientId)

    // Check for client requested action and profile activation
    const profileExists = await this.configurator.profileManager.doesProfileExist(payload.profile)
    if (!profileExists) {
      throw new RPSError(`Device ${payload.uuid} activation failed. Specified AMT profile name does not match list of available AMT profiles.`)
    }

    const profile = await this.configurator.profileManager.getAmtProfile(payload.profile)
    payload.profile = profile

    if (profile.Activation === ClientAction.ADMINCTLMODE) {
      clientObj.action = ClientAction.ADMINCTLMODE
    } else if (profile.Activation === ClientAction.CLIENTCTLMODE) {
      clientObj.action = ClientAction.CLIENTCTLMODE
    }

    // Check for the current mode
    if (payload.currentMode > 0) {
      switch (payload.currentMode) {
        case 1: {
          if (profile.Activation === ClientAction.CLIENTCTLMODE) {
            this.logger.debug(`Device ${payload.uuid} already enabled in client mode.`)
            clientObj.ciraconfig.status = 'already enabled in client mode.'
            clientObj.action = payload.profile.NetworkConfigObject ? ClientAction.NETWORKCONFIG : ClientAction.CIRACONFIG
          } else {
            throw new RPSError(`Device ${payload.uuid} already enabled in client control mode.`)
          }
          break
        }
        case 2: {
          if (profile.Activation === ClientAction.ADMINCTLMODE) {
            this.logger.debug(`Device ${payload.uuid} already enabled in admin mode.`)
            clientObj.ciraconfig.status = 'already enabled in admin mode.'
            clientObj.action = payload.profile.NetworkConfigObject ? ClientAction.NETWORKCONFIG : ClientAction.CIRACONFIG
          } else {
            throw new RPSError(`Device ${payload.uuid} already enabled in admin control mode.`)
          }
          break
        }
        default: {
          throw new RPSError(`Device ${payload.uuid} activation failed. It is in unknown mode.`)
        }
      }
    } else this.logger.debug(`Device ${payload.uuid} is in pre-provisioning mode`)

    if (!clientObj.action) {
      throw new RPSError(`Device ${payload.uuid} activation failed. Failed to get activation mode for the profile :${payload.profile}`)
    }

    // Validate client message to configure ACM message
    if (clientObj.action === ClientAction.ADMINCTLMODE) {
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

    if (clientObj.action !== ClientAction.ADMINCTLMODE && clientObj.action !== ClientAction.CLIENTCTLMODE) {
      if (this.configurator?.amtDeviceRepository) {
        const amtDevice = await this.configurator.amtDeviceRepository.get(payload.uuid)
        if (amtDevice?.amtpass) {
          payload.username = AMTUserName
          payload.password = amtDevice.amtpass
          this.logger.info(`AMT password found for Device ${payload.uuid}`)
        } else {
          this.logger.error(`AMT device DOES NOT exists in repository ${payload.uuid}`)
          throw new RPSError(`AMT device DOES NOT exists in repository ${payload.uuid}`)
        }
      } else {
        this.logger.error(`Device ${payload.uuid} repository not found`)
        throw new RPSError(`Device ${payload.uuid} repository not found`)
      }
    }

    // Store the client message
    clientObj.uuid = payload.uuid
    msg.payload = payload
    clientObj.ClientData = msg
    this.clientManager.setClientObject(clientObj)
  }

  /**
 * @description Validate the client message only if action is not acmactivate-success or ccmactivate-success
 * @param {ClientMsg} msg
 * @param {string} clientId
 * @returns {RCSMessage}
 */
  async validateDeactivationMsg (msg: ClientMsg, clientId: string): Promise<void> {
    let payload: Payload = null
    if (!msg) {
      throw new RPSError('Error while Validating the client message')
    }

    const clientObj = this.clientManager.getClientObject(clientId)

    payload = msg.payload

    if (!payload.uuid) {
      throw new RPSError('Missing uuid from payload')
    }

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
    if (parseInt(payload.ver) > 7 && parseInt(payload.ver) < 12) {
      if (parseInt(payload.build) < 3000) {
        throw new RPSError(`Device ${payload.uuid} deactivation failed. Only version ${payload.ver} with build greater than 3000 can be remotely configured `)
      }
    } else if (parseInt(payload.ver) < 7) {
      throw new RPSError(`Device ${payload.uuid} deactivation failed. AMT version: ${payload.ver}. Version less than 7 cannot be remotely configured `)
    }

    if (msg.payload.force) {
      this.logger.debug('bypassing password check')
    } else {
      try {
        let amtDevice: AMTDeviceDTO
        if (this.configurator?.amtDeviceRepository) {
          amtDevice = await this.configurator.amtDeviceRepository.get(payload.uuid)

          if (amtDevice?.amtpass && payload.password && payload.password === amtDevice.amtpass) {
            this.logger.info(`AMT password matches stored version for Device ${payload.uuid}`)
          } else {
            this.logger.error(`
            stored version for Device ${payload.uuid}`)
            throw new RPSError(`AMT password DOES NOT match stored version for Device ${payload.uuid}`)
          }
        } else {
          this.logger.error(`Device ${payload.uuid} repository not found`)
          throw new RPSError(`Device ${payload.uuid} repository not found`)
        }
      } catch (error) {
        this.logger.error(`AMT device repo exception: ${error}`)
        if (error instanceof RPSError) {
          throw new RPSError(`${error}`)
        } else {
          throw new Error('AMT device repo exception')
        }
      }
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
}
