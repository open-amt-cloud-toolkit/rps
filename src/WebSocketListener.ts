/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 * Description: Simple Websocket server
 **********************************************************************/
import * as WebSocket from 'ws'
import { v4 as uuid } from 'uuid'

import { ClientMsg, ClientObject, WebSocketConfig } from './models/RCS.Config'
import { IWebSocketListener } from './interfaces/IWebSocketListener'
import { IDataProcessor } from './interfaces/IDataProcessor'
import { ILogger } from './interfaces/ILogger'
const devices: {[key: string]: ClientObject} = {}
export { devices }
export class WebSocketListener implements IWebSocketListener {
  dataProcessor: IDataProcessor
  wsServer: WebSocket.Server
  wsConfig: WebSocketConfig
  logger: ILogger

  constructor (logger: ILogger, wsConfig: WebSocketConfig, dataProcessor: IDataProcessor) {
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
    devices[clientId] = { ClientId: clientId, ClientSocket: ws, ciraconfig: {}, network: {}, status: {}, tls: {}, activationStatus: {}, unauthCount: 0, messageId: 0 }

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
    try {
      // this.logger.debug(`Message from client ${clientId}: ${JSON.stringify(message, null, "\t")}`);
      let responseMsg: ClientMsg
      if (this.dataProcessor) {
        responseMsg = await this.dataProcessor.processData(message, clientId)
        if (responseMsg) {
          this.onSendMessage(responseMsg, clientId)
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
  onSendMessage (message: ClientMsg, clientId: string): void {
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
