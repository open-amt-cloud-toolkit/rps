/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: Deactivate AMT from ACM or CCM
 * Author : Brian Osburn
 **********************************************************************/

import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { ClientMsg, ClientObject } from '../models/RCS.Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { WSManProcessor } from '../WSManProcessor'
import { IClientManager } from '../interfaces/IClientManager'
import { RPSError } from '../utils/RPSError'
import { AMTDeviceDTO } from '../repositories/dto/AmtDeviceDTO'
import { IConfigurator } from '../interfaces/IConfigurator'
import { EnvReader } from '../utils/EnvReader'
import got from 'got'
import { MqttProvider } from '../utils/MqttProvider'
import { HttpHandler } from '../HttpHandler'
import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
export class Deactivator implements IExecutor {
  amt: AMT.Messages
  constructor (
    private readonly logger: ILogger,
    private readonly responseMsg: ClientResponseMsg,
    private readonly amtwsman: WSManProcessor,
    private readonly clientManager: IClientManager,
    readonly configurator?: IConfigurator
  ) {
    this.amt = new AMT.Messages()
  }

  /**
   * @description Create configuration message to deactivate AMT from ACM or CCM
   * @param {any} message valid client message
   * @param {string} clientId Id to keep track of connections
   * @returns {RCSMessage} message to sent to client
   */
  async execute (message: any, clientId: string, httpHandler?: HttpHandler): Promise<ClientMsg> {
    let clientObj: ClientObject
    try {
      clientObj = this.clientManager.getClientObject(clientId)

      const wsmanResponse = message.payload

      if (!wsmanResponse) {
        throw new RPSError(`Device ${clientObj.uuid} deactivate failed : Missing/invalid WSMan response payload.`)
      }

      switch (wsmanResponse.statusCode) {
        case 401: {
          const messageId = (clientObj.messageId++).toString()
          const xmlRequestBody = this.amt.SetupAndConfigurationService(AMT.Methods.UNPROVISION, messageId, null, 2)
          const data = httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
          return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
        }
        case 200: {
          this.logger.debug(`Deleting secret from vault for ${clientObj.uuid}`)
          await this.configurator.amtDeviceRepository.delete(new AMTDeviceDTO(clientObj.uuid, null, null, null, null, null, null))
          this.logger.debug(`Deleting metadata from mps for ${clientObj.uuid}`)
          /* unregister device metadata with MPS */
          try {
            await got(`${EnvReader.GlobalEnvConfig.mpsServer}/api/v1/devices/${clientObj.uuid}`, {
              method: 'DELETE'
            })
          } catch (err) {
            MqttProvider.publishEvent('fail', ['Deactivator'], 'unable to removed metadata with MPS', clientObj.uuid)
            this.logger.error('unable to removed metadata with MPS', err)
          }
          MqttProvider.publishEvent('success', ['Deactivator'], 'Device deactivated', clientObj.uuid)
          clientObj.status.Status = 'Deactivated'
          return this.responseMsg.get(clientId, null, 'success', 'success', JSON.stringify(clientObj.status))
        }
        default: {
          throw new RPSError(`Device ${clientObj.uuid} deactivation failed`)
        }
      }
    } catch (error) {
      this.logger.error(`${clientId} : Failed to deactivate: ${error}`)
      if (error instanceof RPSError) {
        clientObj.status.Status = error.message
      } else {
        clientObj.status.Status = 'Failed'
      }
      MqttProvider.publishEvent('fail', ['Deactivator'], 'Failed to deactivate', clientObj.uuid)
      return this.responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify(clientObj.status))
    }
  }
}
