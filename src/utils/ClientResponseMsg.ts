/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ClientMsg } from '../models/RCS.Config'
import { ServiceVersion, ProtocolVersion } from './constants'

export default {
  /**
 * @description builds response message to client
 * @param {string} payload
 * @param {string} clientId Id to keep track of connections
 * @returns {ClientMsg} returns message which is sent to client
 */
  get (clientId: string, payload: string, method: 'error' | 'wsman' | 'success' | 'heartbeat_request', status: 'failed' | 'success' | 'ok' | 'heartbeat', message: string = ''): ClientMsg {
    const msg: ClientMsg = {
      method,
      apiKey: 'xxxxx',
      appVersion: ServiceVersion,
      protocolVersion: ProtocolVersion,
      status,
      message,
      payload
    }

    if (method === 'heartbeat_request') {
      msg.payload = ''
    } else if (method !== 'error' && method !== 'success') {
      msg.payload = Buffer.from(payload).toString('base64')
    }

    return msg
  }
}
