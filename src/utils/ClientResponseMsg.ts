import { ClientMsg } from '../RCS.Config'
import { INodeForge } from '../interfaces/INodeForge'
import { AppVersion, ProtocolVersion } from './constants'
import Logger from '../Logger'

export class ClientResponseMsg {
  log = Logger
  nodeForge: INodeForge

  constructor (nodeForge: INodeForge) {
    this.nodeForge = nodeForge
  }

  /**
 * @description builds response message to client
 * @param {string} payload
 * @param {string} clientId Id to keep track of connections
 * @returns {ClientMsg} returns message which is sent to client
 */
  get (clientId: string, payload: string, method: string, status: string, message: string): ClientMsg {
    let msg: ClientMsg
    try {
      if (method === 'error') {
        msg = { method: method, apiKey: 'xxxxx', appVersion: AppVersion, protocolVersion: ProtocolVersion, status: status, message: message, payload: payload }
      } else if (method === 'heartbeat_request') {
        msg = { method: method, apiKey: 'xxxxx', appVersion: AppVersion, protocolVersion: ProtocolVersion, status: status, message: message, payload: '' }
      } else if (method === 'success') {
        msg = { method: method, apiKey: 'xxxxx', appVersion: AppVersion, protocolVersion: ProtocolVersion, status: status, message: message, payload: payload }
      } else {
        msg = { method: method, apiKey: 'xxxxx', appVersion: AppVersion, protocolVersion: ProtocolVersion, status: status, message: message, payload: this.nodeForge.encode64(payload) }
      }
    } catch (error) {
      this.log.error(`${clientId} : Failed to create the error message`, error)
    }
    return msg
  };
}
