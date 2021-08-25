/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 * Description: Helps to validate the client data
 **********************************************************************/

import { IClientMessageParser } from '../interfaces/IClientMessageParser'
import { ClientMsg, Payload, ClientMethods } from '../RCS.Config'
import { NodeForge } from '../NodeForge'
import { RPSError } from './RPSError'

export class ClientMsgJsonParser implements IClientMessageParser {
  nodeForge: NodeForge
  constructor (private readonly _nodeForge: NodeForge) {
    this.nodeForge = _nodeForge
  }

  /**
   * @description Parse client message and check for mandatory information
   * @param {WebSocket.Data} message the message coming in over the websocket connection
   * @returns {ClientMsg} returns ClientMsg object if client message is valid
   */
  parse (message: string): ClientMsg {
    let msg: ClientMsg = null
    // Parse and convert the message
    const clientMsg: ClientMsg = JSON.parse(message)
    msg = this.convertClientMsg(clientMsg)
    return msg
  }

  /**
   * @description Convert the message received from client to local object ClientMsg
   * @param {ClientMsg} message
   * @returns {ClientMsg}
   */
  convertClientMsg (message: ClientMsg): ClientMsg {
    if (message.payload) {
      let payload: any = this.nodeForge.decode64(message.payload)
      if (message.method !== ClientMethods.RESPONSE) {
        payload = this.parsePayload(payload)
      }
      message.payload = payload
    }
    return message
  }

  /**
   * @description Convert the payload received from client
   * @param {string} payloadstring
   * @returns {Payload}
   */
  parsePayload (payloadstring: string): Payload {
    let payload: Payload = null
    try {
      payload = JSON.parse(payloadstring)
    } catch (error) {
      throw new RPSError(`Failed to parse client message payload. ${error.message}`)
    }
    if (payload.client && payload.ver && payload.build && payload.uuid) {
      if (Array.isArray(payload.uuid)) {
        payload.uuid = this.getUUID(payload.uuid)
      }
    } else {
      throw new RPSError('Invalid payload from client')
    }
    return payload
  }

  zeroLeftPad (str: string, len: number): string {
    if (len == null && typeof len !== 'number') {
      return null
    }
    if (str == null) str = '' // If null, this is to generate zero leftpad string
    let zlp = ''
    for (let i = 0; i < len - str.length; i++) {
      zlp += '0'
    }
    return zlp + str
  }

  getUUID (uuid: any): any {
    uuid = Buffer.from(uuid)
    const guid = [
      this.zeroLeftPad(uuid.readUInt32LE(0).toString(16), 8),
      this.zeroLeftPad(uuid.readUInt16LE(4).toString(16), 4),
      this.zeroLeftPad(uuid.readUInt16LE(6).toString(16), 4),
      this.zeroLeftPad(uuid.readUInt16BE(8).toString(16), 4),
      this.zeroLeftPad(uuid.slice(10).toString('hex').toLowerCase(), 12)].join('-')

    return guid
  }
}
