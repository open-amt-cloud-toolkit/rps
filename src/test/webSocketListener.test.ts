/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { WebSocketConfig } from '../RCS.Config'
import { WebSocketListener } from '../WebSocketListener'
import { IClientManager } from '../interfaces/IClientManager'
import { ClientManager } from '../ClientManager'

const wsConfig: WebSocketConfig = {
  WebSocketPort: 8080
}

const clientManager: IClientManager = ClientManager.getInstance()
let server: WebSocketListener
let isConnect: boolean

describe('Check Websocket Listener', () => {
  it('Should start WebSocket server', async () => {
    server = new WebSocketListener(wsConfig, clientManager, null)
    isConnect = await server.connect()
    expect(isConnect).toEqual(true)
  })

  afterAll(() => {
    server.wsServer.close()
  })
})
