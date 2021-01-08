/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: Deactivate AMT from ACM or CCM
 * Author : Brian Osburn
 **********************************************************************/

import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { ClientMsg } from '../RCS.Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { WSManProcessor } from '../WSManProcessor'
import { IClientManager } from '../interfaces/IClientManager'
import { RPSError } from '../utils/RPSError'
import { AMTDeviceDTO } from '../repositories/dto/AmtDeviceDTO'
import { IConfigurator } from '../interfaces/IConfigurator'

export class Deactivator implements IExecutor {
  constructor (
    private logger: ILogger,
    private responseMsg: ClientResponseMsg,
    private amtwsman: WSManProcessor,
    private clientManager: IClientManager,
    private configurator?: IConfigurator
  ) {}

  /**
   * @description Create configuration message to deactivate AMT from ACM or CCM
   * @param {any} message valid client message
   * @param {string} clientId Id to keep track of connections
   * @returns {RCSMessage} message to sent to client
   */
  async execute (message: any, clientId: string): Promise<ClientMsg> {
    try {
      this.logger.debug(`deactivator execute message received: ${JSON.stringify(message, null, '\t')}`)

      const clientObj = this.clientManager.getClientObject(clientId)

      const wsmanResponse = message.payload

      if (!wsmanResponse) {
        throw new RPSError(`Device ${clientObj.uuid} deactivate failed : Missing/invalid WSMan response payload.`)
      }

      if (wsmanResponse.Header.Method === 'Unprovision') {
        if (wsmanResponse.Body.ReturnValue !== 0) {
          throw new RPSError(`Device ${clientObj.uuid} deactivation failed`)
        } else {
          this.logger.debug(`Deleting secret from vault for ${clientObj.uuid}`)
          await this.configurator.amtDeviceRepository.delete(new AMTDeviceDTO(clientObj.uuid, null, null, null, null, null))
          return this.responseMsg.get(clientId, null, 'success', 'success', `Device ${clientObj.uuid} deactivated`)
        }
      } else {
        clientObj.ClientData.payload = wsmanResponse
        this.clientManager.setClientObject(clientObj)
        await this.amtwsman.deactivateACM(clientId)
      }
    } catch (error) {
      this.logger.error(
        `${clientId} : Failed to deactivate: ${error}`
      )
      if (error instanceof RPSError) {
        return this.responseMsg.get(clientId, null, 'error', 'failed', error.message)
      } else {
        return this.responseMsg.get(clientId, null, 'error', 'failed', 'failed to deactivate')
      }
    }
  }
}
