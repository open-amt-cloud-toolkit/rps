/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpHandler } from '../HttpHandler'
import { devices } from '../WebSocketListener'
import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { ClientMsg } from '../models/RCS.Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { synchronizeTime } from '../utils/maintenance/synchronizeTime'
import { MqttProvider } from '../utils/MqttProvider'
import { RPSError } from '../utils/RPSError'

export class Maintenance implements IExecutor {
  constructor (
    private readonly logger: ILogger,
    private readonly responseMsg: ClientResponseMsg
  ) { }

  async execute (message: any, clientId: string, httpHandler: HttpHandler): Promise<ClientMsg> {
    const clientObj = devices[clientId]
    const payload = clientObj.ClientData.payload
    try {
      switch (payload.task) {
        case 'synctime': {
          return await synchronizeTime(clientId, message, this.responseMsg, httpHandler)
        }
        default: {
          return this.responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify({ status: 'Not a supported maintenance task' }))
        }
      }
    } catch (error) {
      this.logger.error(`${clientId} : Failed to configure maintenance task-${payload.task}: ${error}`)
      MqttProvider.publishEvent('fail', ['Maintenance'], 'Failed', clientObj.uuid)
      let errorStatus
      if (error instanceof RPSError) {
        errorStatus = error.message
      } else {
        errorStatus = 'Failed'
      }
      return this.responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify({ status: errorStatus }))
    }
  }
}
