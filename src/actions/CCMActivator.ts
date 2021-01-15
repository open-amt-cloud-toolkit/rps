/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: Activate AMT in client control mode
 * Author : Madhavi Losetty
 **********************************************************************/

import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { SignatureHelper } from '../utils/SignatureHelper'
import { ClientMsg, ClientAction } from '../RCS.Config'
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
      const clientObj = this.clientManager.getClientObject(clientId)
      const wsmanResponse = message.payload

      if (!wsmanResponse) {
        throw new RPSError(`Device ${clientObj.uuid} activation failed : Missing/invalid WSMan response payload.`)
      }

      if (wsmanResponse.AMT_GeneralSettings !== undefined) {
        const response = wsmanResponse.AMT_GeneralSettings.response
        // Validate Digest Realm
        if (!this.validator.isDigestRealmValid(response.DigestRealm)) {
          throw new RPSError(`Device ${clientObj.uuid} activation failed : Not a valid digest realm.`)
        }
        clientObj.ClientData.payload.digestRealm = response.DigestRealm
        this.clientManager.setClientObject(clientObj)
      } else if (wsmanResponse.Header.Method === 'Setup') {
        if (wsmanResponse.Body.ReturnValue !== 0) {
          throw new RPSError(`Device ${clientObj.uuid} activation failed : Error while activating the AMT device in client mode.`)
        } else {
          this.logger.debug(`Device ${clientObj.uuid} activated in client mode.`)
          clientObj.ciraconfig.status = 'activated in client mode.'

          if (this.amtwsman.cache[clientId]) {
            this.amtwsman.cache[clientId].wsman.comm.setupCommunication.getUsername = (): string => { return AMTUserName }
            this.amtwsman.cache[clientId].wsman.comm.setupCommunication.getPassword = (): string => { return clientObj.amtPassword }
          }
          // return this.responseMsg.get(clientId, null, 'success', 'success', `Device ${clientObj.uuid} ${clientObj.ciraconfig.status}.`)
          clientObj.action = ClientAction.NETWORKCONFIG
          this.clientManager.setClientObject(clientObj)
          await this.networkConfigurator.execute(message, clientId)
        }
      }
      if (clientObj.action === ClientAction.CLIENTCTLMODE) {
        const amtPassword: string = await this.configurator.profileManager.getAmtPassword(clientObj.ClientData.payload.profile.ProfileName)
        clientObj.amtPassword = amtPassword
        this.clientManager.setClientObject(clientObj)
        if (this.configurator?.amtDeviceRepository) {
          await this.configurator.amtDeviceRepository.insert(new AMTDeviceDTO(clientObj.uuid,
            clientObj.uuid,
            EnvReader.GlobalEnvConfig.mpsusername,
            EnvReader.GlobalEnvConfig.mpspass,
            EnvReader.GlobalEnvConfig.amtusername,
            amtPassword,
            null))
        } else {
          this.logger.error('unable to write device')
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
}
