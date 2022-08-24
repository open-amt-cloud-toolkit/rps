import { ClientMsg } from '../models/RCS.Config'
import { ILogger } from '../interfaces/ILogger'
import { AppVersion, ProtocolVersion } from './constants'
import Logger from '../Logger'

export class ClientResponseMsg {
  logger: ILogger

  constructor (logger = new Logger('ClientResponseMsg')) {
    this.logger = logger
  }

  /**
 * @description builds response message to client
 * @param {string} payload
 * @param {string} clientId Id to keep track of connections
 * @returns {ClientMsg} returns message which is sent to client
 */
  get (clientId: string, payload: string, method: 'error' | 'wsman' | 'success' | 'heartbeat_request', status: 'failed' | 'success' | 'ok' | 'heartbeat', message: string = ''): ClientMsg {
    const msg: ClientMsg = {
      method: method,
      apiKey: 'xxxxx',
      appVersion: AppVersion,
      protocolVersion: ProtocolVersion,
      status: status,
      message: message,
      payload: payload
    }
    try {
      if (method === 'heartbeat_request') {
        msg.payload = ''
      } else if (method !== 'error' && method !== 'success') {
        msg.payload = Buffer.from(payload).toString('base64')
      }
    } catch (error) {
      this.logger.error(`${clientId} : Failed to create the message`, error)
    }
    return msg
  }
}
