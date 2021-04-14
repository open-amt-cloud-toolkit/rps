/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: Activate AMT in client control mode
 * Author : Madhavi Losetty
 **********************************************************************/

import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { SignatureHelper } from '../utils/SignatureHelper'
import { ClientMsg, ClientAction, ClientObject } from '../RCS.Config'
import { IConfigurator } from '../interfaces/IConfigurator'
import { AMTDeviceDTO } from '../repositories/dto/AmtDeviceDTO'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { WSManProcessor } from '../WSManProcessor'
import { IClientManager } from '../interfaces/IClientManager'
import { RPSError } from '../utils/RPSError'
import { IValidator } from '../interfaces/IValidator'
import { EnvReader } from '../utils/EnvReader'
import { NetworkConfigurator } from './NetworkConfigurator'
import { AMTUserName } from './../utils/constants'
import got from 'got'

export class CCMActivator implements IExecutor {
  constructor (
    private readonly logger: ILogger,
    private readonly configurator: IConfigurator,
    private readonly responseMsg: ClientResponseMsg,
    private readonly amtwsman: WSManProcessor,
    private readonly clientManager: IClientManager,
    private readonly validator: IValidator,
    private readonly networkConfigurator: NetworkConfigurator
  ) { }

  /**
   * @description activate AMT in client control mode
   * @param {any} message valid client message
   * @param {string} clientId Id to keep track of connections
   * @returns {ClientMsg} message to sent to client
   */
  async execute (message: any, clientId: string): Promise<ClientMsg> {
    try {
      const clientObj: ClientObject = this.clientManager.getClientObject(clientId)
      const wsmanResponse = message.payload
      if (clientObj.action === ClientAction.CLIENTCTLMODE && !clientObj.activationStatus && !wsmanResponse) {
        throw new RPSError(`Device ${clientObj.uuid} activation failed : Missing/invalid WSMan response payload.`)
      } else if (clientObj.action === ClientAction.CLIENTCTLMODE && clientObj.activationStatus) {
        const msg = await this.waitAfterActivation(clientId, clientObj, message)
        return msg
      }

      if (wsmanResponse.AMT_GeneralSettings != null) {
        const response = wsmanResponse.AMT_GeneralSettings.response
        // Validate Digest Realm
        if (!this.validator.isDigestRealmValid(response.DigestRealm)) {
          throw new RPSError(`Device ${clientObj.uuid} activation failed : Not a valid digest realm.`)
        }
        clientObj.ClientData.payload.digestRealm = response.DigestRealm
        clientObj.hostname = clientObj.ClientData.payload.hostname
        this.clientManager.setClientObject(clientObj)
      } else if (wsmanResponse.Header.Method === 'Setup') {
        if (wsmanResponse.Body.ReturnValue !== 0) {
          throw new RPSError(`Device ${clientObj.uuid} activation failed : Error while activating the AMT device in client mode.`)
        } else {
          this.logger.debug(`Device ${clientObj.uuid} activated in client mode.`)
          clientObj.ciraconfig.status = 'activated in client mode.'
          clientObj.activationStatus = true
          this.clientManager.setClientObject(clientObj)

          const msg = await this.waitAfterActivation(clientId, clientObj, message)
          return msg
        }
      }
      if (clientObj.action === ClientAction.CLIENTCTLMODE && !clientObj.activationStatus) {
        const amtPassword: string = await this.configurator.profileManager.getAmtPassword(clientObj.ClientData.payload.profile.profileName)
        clientObj.amtPassword = amtPassword
        this.clientManager.setClientObject(clientObj)
        if (this.configurator?.amtDeviceRepository) {
          await this.configurator.amtDeviceRepository.insert(new AMTDeviceDTO(clientObj.uuid,
            clientObj.hostname,
            EnvReader.GlobalEnvConfig.mpsusername,
            EnvReader.GlobalEnvConfig.mpspass,
            EnvReader.GlobalEnvConfig.amtusername,
            amtPassword,
            null))
        } else {
          this.logger.error('unable to write device')
        }
        /* Register device metadata with MPS */
        try {
          // TODO: performance: avoid second call to db from ~line 77
          const profile = await this.configurator.profileManager.getAmtProfile(clientObj.ClientData.payload.profile.profileName)
          let tags = []
          if (profile?.tags != null) {
            tags = profile.tags
          }
          await got(`${EnvReader.GlobalEnvConfig.mpsServer}/metadata`, {
            method: 'POST',
            json: {
              guid: clientObj.uuid,
              hostname: clientObj.hostname,
              tags: tags
            }
          })
        } catch (err) {
          this.logger.warn('unable to register metadata with MPS', err)
        }
        const data: string = `${AMTUserName}:${clientObj.ClientData.payload.digestRealm}:${amtPassword}`
        const password = SignatureHelper.createMd5Hash(data)

        await this.amtwsman.setupCCM(clientId, password)
      }
    } catch (error) {
      this.logger.error(
        `${clientId} : Failed to activate in client control mode : ${error}`
      )
      if (error instanceof RPSError) {
        return this.responseMsg.get(clientId, null, 'error', 'failed', error.message)
      } else {
        return this.responseMsg.get(clientId, null, 'error', 'failed', ' Failed to activate in client control mode')
      }
    }
  }

  async waitAfterActivation (clientId: string, clientObj: ClientObject, message: any): Promise<ClientMsg> {
    this.logger.info(`waiting for ${EnvReader.GlobalEnvConfig.delayTimer} seconds after activation`)
    if (clientObj.delayEndTime == null) {
      const endTime: Date = new Date()
      clientObj.delayEndTime = endTime.setSeconds(endTime.getSeconds() + EnvReader.GlobalEnvConfig.delayTimer)
      this.clientManager.setClientObject(clientObj)
      this.logger.info(`Delay end time : ${clientObj.delayEndTime}`)
    }
    const currentTime = new Date().getTime()
    if (currentTime >= clientObj.delayEndTime) {
      this.logger.info(`Current Time: ${currentTime} Delay end time : ${clientObj.delayEndTime}`)
      if (this.amtwsman.cache[clientId]) {
        this.amtwsman.cache[clientId].wsman.comm.setupCommunication.getUsername = (): string => { return AMTUserName }
        this.amtwsman.cache[clientId].wsman.comm.setupCommunication.getPassword = (): string => { return clientObj.amtPassword }
      }
      clientObj.action = ClientAction.NETWORKCONFIG
      this.clientManager.setClientObject(clientObj)
      await this.networkConfigurator.execute(null, clientId)
    } else {
      this.logger.info(`Current Time: ${currentTime} Delay end time : ${clientObj.delayEndTime}`)
      return this.responseMsg.get(clientId, null, 'heartbeat_request', 'heartbeat', '')
    }
  }
}
