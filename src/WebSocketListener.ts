/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import * as WebSocket from 'ws'
import { v4 as uuid } from 'uuid'

import { ClientMsg, ClientObject, WebSocketConfig } from './models/RCS.Config'
import { ILogger } from './interfaces/ILogger'
import { DataProcessor } from './DataProcessor'
const devices: Record<string, ClientObject> = {}
const maxMessageSize = 1024 * 10
export { devices }
export class WebSocketListener {
  dataProcessor: DataProcessor
  wsServer: WebSocket.Server
  wsConfig: WebSocketConfig
  logger: ILogger

  constructor (logger: ILogger, wsConfig: WebSocketConfig, dataProcessor: DataProcessor) {
    this.logger = logger
    this.wsConfig = wsConfig
    this.dataProcessor = dataProcessor
  }

  /**
   * @description Creates a WebSocket server based on config info
   */
  connect (): boolean {
    try {
      this.wsServer = new WebSocket.Server({ port: this.wsConfig.WebSocketPort })
      this.wsServer.on('connection', this.onClientConnected)
      this.logger.info(`RPS Microservice socket listening on port: ${this.wsConfig.WebSocketPort} ...!`)
      return true
    } catch (error) {
      this.logger.error(`Failed to start WebSocket server : ${error}`)
      return false
    }
  }

  /**
   * @description Called on connection event of WebSocket Server
   * @param {WebSocket} ws  websocket object
   */
  onClientConnected = (ws: WebSocket): void => {
    const clientId = uuid()
    devices[clientId] = { ClientId: clientId, ClientSocket: ws, ciraconfig: {}, network: { count: 0 }, status: {}, tls: {}, activationStatus: false, unauthCount: 0, messageId: 0 }

    ws.on('message', async (data: WebSocket.Data, isBinary: boolean) => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const message = isBinary ? data : data.toString()
      await this.onMessageReceived(message, clientId)
    })
    ws.on('close', this.onClientDisconnected.bind(this, clientId))
    ws.on('error', (error) => {
      this.onError(error, clientId)
    })
    this.logger.debug(`client : ${clientId} Connection accepted.`)
  }

  /**
   * @description Called on close event of WebSocket Server
   * @param {string} clientId Index of the connected client
   */
  onClientDisconnected (clientId: string): void {
    delete devices[clientId]
    this.logger.debug(`Connection ended for client : ${clientId}`)
  }

  /**
   * @description Called on error event of WebSocket Server
   * @param {Error} error Websocket error
   * @param {string} clientId
   */
  onError (error: Error, clientId: string): void {
    this.logger.error(`${clientId} : ${error.message}`)
  }

  /**
   * @description Called on message event of WebSocket Server
   * @param {Number} index Index of the connected client
   * @param {WSMessage} message Received from the client
   */
  async onMessageReceived (message: WebSocket.Data, clientId: string): Promise<void> {
    let messageLength
    if (typeof message === 'string') {
      messageLength = Buffer.from(message).length
    } else {
      messageLength = maxMessageSize + 1
    }
    if (messageLength > maxMessageSize) {
      this.logger.error('Incoming message exceeds allowed length')
      devices[clientId].ClientSocket.close()
    }
    try {
      // this.logger.debug(`Message from client ${clientId}: ${JSON.stringify(message, null, "\t")}`);
      let responseMsg: ClientMsg
      if (this.dataProcessor) {
        responseMsg = await this.dataProcessor.processData(message, clientId)
        if (responseMsg) {
          this.sendMessage(responseMsg, clientId)
        }
      }
    } catch (error) {
      this.logger.error(`Failed to process message received from client: ${error}`)
    }
  }

  /**
   * @external sendMessage
   * @description sends a message to the connected client
   * @param {string} clientId Index of the connected client
   * @param {ClientMsg} message Message to be sent to client
   */
  sendMessage (message: ClientMsg, clientId: string): void {
    try {
      this.logger.debug(`${clientId} : response message sent to device: ${JSON.stringify(message, null, '\t')}`)
      if (devices[clientId] != null) {
        devices[clientId].ClientSocket.send(JSON.stringify(message))
      }
    } catch (error) {
      this.logger.error(`Failed to send message to AMT: ${error}`)
    }
  }
}
