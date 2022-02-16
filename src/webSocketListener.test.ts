/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { WebSocketConfig, ClientMsg } from './models/RCS.Config'
import { WebSocketListener } from './WebSocketListener'
import Logger from './Logger'
import { ILogger } from './interfaces/ILogger'
import * as WebSocket from 'ws'

const wsConfig: WebSocketConfig = {
  WebSocketPort: 8080
}

const log: ILogger = new Logger('WebSocketListener')
let server: WebSocketListener
let isConnect: boolean

describe('Check Websocket Listener', () => {
  it('Should start WebSocket server', async () => {
    const stub = {
      processData: jest.fn()
    }
    server = new WebSocketListener(log, wsConfig, stub)
    isConnect = await server.connect()
    expect(isConnect).toEqual(true)
  })
})

describe('connect method', () => {
  it('webserver client connection exception handling ', () => {
    const stub = {
      processData: jest.fn()
    }
    const server1: WebSocketListener = new WebSocketListener(log, wsConfig, stub)
    jest.spyOn(WebSocket, 'Server').mockReturnValue(null)
    const on = jest.spyOn(server.wsServer, 'on')
    const ret = server1.connect()
    expect(on).toHaveBeenCalledTimes(0)
    expect(ret).toEqual(false)
  })
})

describe('onClientDisconnected method', () => {
  it('remove Client on close event of WebSocket Server', async () => {
    const clientid = 'abcd'
    await server.onClientDisconnected(clientid)
  })
})

describe('onError method', () => {
  it('Test onError on error event of WebSocket Server', async () => {
    const clientid = 'abcd'
    const error: Error = {
      name: 'abc',
      message: 'abcd'
    }
    await server.onError(error, clientid)
  })
})

describe('onMessageReceived method', () => {
  it('Check if on message event of WebSocket Server calls onSendMessage', async () => {
    const clientid = 'abcd'
    const clientMsg: ClientMsg = {
      method: 'myMethod',
      apiKey: 'abcd',
      appVersion: '1.0',
      protocolVersion: '2.0',
      status: '200',
      message: 'success',
      payload: null
    }
    const onSendMessage = jest.spyOn(server, 'onSendMessage')
    jest.spyOn(server.dataProcessor, 'processData').mockResolvedValue(clientMsg)
    const message: WebSocket.Data = 'abcd'
    await server.onMessageReceived(message, clientid)
    expect(onSendMessage).toHaveBeenCalledTimes(1)
  })
  it('Check if on message event of WebSocket Server not called onSendMessage when processData return null', async () => {
    const clientid = 'abcd'
    const onSendMessage = jest.spyOn(server, 'onSendMessage')
    jest.spyOn(server.dataProcessor, 'processData').mockResolvedValue(null)
    const message: WebSocket.Data = 'abcd'
    await server.onMessageReceived(message, clientid)
    expect(onSendMessage).toHaveBeenCalledTimes(1)
  })
})

describe('onSendMessage method', () => {
  it('do not send message if invalid client index', () => {
    const clientid = 'test'
    const message: WebSocket.Data = 'test'
    server.onSendMessage(message, clientid)
  })
})

afterAll(() => {
  server.wsServer.close()
})
