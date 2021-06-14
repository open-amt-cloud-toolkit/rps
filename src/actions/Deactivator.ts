/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: Deactivate AMT from ACM or CCM
 * Author : Brian Osburn
 **********************************************************************/

import { IExecutor } from '../interfaces/IExecutor'
import Logger from '../Logger'
import { ClientMsg } from '../RCS.Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { WSManProcessor } from '../WSManProcessor'
import { IClientManager } from '../interfaces/IClientManager'
import { RPSError } from '../utils/RPSError'
import { AMTDeviceDTO } from '../repositories/dto/AmtDeviceDTO'
import { IConfigurator } from '../interfaces/IConfigurator'
import { EnvReader } from '../utils/EnvReader'
import got from 'got'

export class Deactivator implements IExecutor {
  private readonly log: Logger = new Logger('Deactivator')

  constructor (
    private readonly responseMsg: ClientResponseMsg,
    private readonly amtwsman: WSManProcessor,
    private readonly clientManager: IClientManager,
    private readonly configurator?: IConfigurator
  ) {}

  /**
   * @description Create configuration message to deactivate AMT from ACM or CCM
   * @param {any} message valid client message
   * @param {string} clientId Id to keep track of connections
   * @returns {RCSMessage} message to sent to client
   */
  async execute (message: any, clientId: string): Promise<ClientMsg> {
    try {
      this.log.debug(`deactivator execute message received: ${JSON.stringify(message, null, '\t')}`)

      const clientObj = this.clientManager.getClientObject(clientId)

      const wsmanResponse = message.payload

      if (!wsmanResponse) {
        throw new RPSError(`Device ${clientObj.uuid} deactivate failed : Missing/invalid WSMan response payload.`)
      }

      if (wsmanResponse.Header.Method === 'Unprovision') {
        if (wsmanResponse.Body.ReturnValue !== 0) {
          throw new RPSError(`Device ${clientObj.uuid} deactivation failed`)
        } else {
          this.log.debug(`Deleting secret from vault for ${clientObj.uuid}`)
          await this.configurator.amtDeviceRepository.delete(new AMTDeviceDTO(clientObj.uuid, null, null, null, null, null, null))
          this.log.debug(`Deleting metadata from mps for ${clientObj.uuid}`)

          /* unregister device metadata with MPS */
          try {
            await got(`${EnvReader.GlobalEnvConfig.mpsServer}/api/v1/devices/${clientObj.uuid}`, {
              method: 'DELETE'
            })
          } catch (err) {
            this.log.warn('unable to removed metadata with MPS', err)
          }

          return this.responseMsg.get(clientId, null, 'success', 'success', `Device ${clientObj.uuid} deactivated`)
        }
      } else {
        clientObj.ClientData.payload = wsmanResponse
        this.clientManager.setClientObject(clientObj)
        await this.amtwsman.deactivateACM(clientId)
      }
    } catch (error) {
      this.log.error(
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
