/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { WebSocketServer, type WebSocket, type Data } from 'ws'
import { type ILogger } from './interfaces/ILogger.js'
import { type DataProcessor } from './DataProcessor.js'

const promises: Record<string, { resolve: any, reject: any, pendingPromise: Promise<EnterpriseAssistantMessage> }> = {}

let enterpriseAssistantSocket: WebSocket
export { promises, enterpriseAssistantSocket }
export class WSEnterpriseAssistantListener {
  dataProcessor: DataProcessor
  wsServer: WebSocketServer
  logger: ILogger

  constructor (logger: ILogger) {
    this.logger = logger
  }

  /**
   * @description Creates a WebSocket server based on config info
   */
  connect (wsServer = new WebSocketServer({ port: 8082 })): boolean {
    // TODO: tech debt - wsConfig is not being used
    try {
      this.wsServer = wsServer
      this.wsServer.on('connection', this.onClientConnected)
      this.logger.info('RPS Microservice socket listening on port: 8082 ...!')
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
  public onClientConnected = (ws: WebSocket): void => {
    enterpriseAssistantSocket = ws

    enterpriseAssistantSocket.on('message', async (data: Data, isBinary: boolean) => {
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      const message: string = data.toString()
      await this.onMessageReceived(message)
    })
    enterpriseAssistantSocket.on('close', (code, reason) => {
      this.logger.debug('Connection ended for enterprise assistant')
    })
    enterpriseAssistantSocket.on('error', this.onError.bind(this))
    this.logger.debug('client : Connection accepted.')
  }

  /**
   * @description Called on error event of WebSocket Server
   * @param {Error} error Websocket error
   */
  onError (error: Error): void {
    this.logger.error(`${error.message}`)
  }

  /**
   * @description Called on message event of WebSocket Server
   * @param {WSMessage} message Received from the client
   */
  async onMessageReceived (message: string): Promise<void> {
    try {
      const parsedMessage: EnterpriseAssistantMessage = JSON.parse(message)
      promises[parsedMessage.nodeid]?.resolve(parsedMessage)
    } catch (err) {
      this.logger.error(err)
    }
  }
}

export interface EnterpriseAssistantMessage {
  action: string // 'satellite'
  subaction: string // '802.1x-KeyPair-Response'
  satelliteFlags: number // 2
  nodeid: string // ''
  domain: string // 'domain.com'
  reqid: string // '1238u43573459843598'
  devname: string // 'WinDev2211Eval'
  authProtocol: number // 0
  osname: string // 'win11'
  icon: number // 1
  DERKey: string //
  keyInstanceId: string // 'Intel(r) AMT Key: Handle: 0'
  ver: string // ''
}
