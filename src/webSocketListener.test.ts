/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { WebSocketConfig, ClientMsg } from './models/RCS.Config'
import { devices, WebSocketListener } from './WebSocketListener'
import Logger from './Logger'
import { ILogger } from './interfaces/ILogger'
import * as WebSocket from 'ws'

const wsConfig: WebSocketConfig = {
  WebSocketPort: 8080
}

describe('Websocket Listener', () => {
  const log: ILogger = new Logger('WebSocketListener')
  let server: WebSocketListener
  let isConnected: boolean
  let onSpy: jest.SpyInstance
  beforeEach(() => {
    const stub = {
      processData: jest.fn()
    }
    const serverStub = {
      on: jest.fn()
    } as any
    onSpy = jest.spyOn(serverStub, 'on')
    jest.spyOn(WebSocket, 'Server').mockReturnValue(serverStub)
    server = new WebSocketListener(log, wsConfig, stub)
  })
  it('should start WebSocket server', () => {
    isConnected = server.connect()
    expect(isConnected).toEqual(true)
  })

  it('should NOT start WebSocket server when exception ', () => {
    jest.spyOn(WebSocket, 'Server').mockReturnValue(null)
    const ret = server.connect()
    expect(onSpy).toHaveBeenCalledTimes(0)
    expect(ret).toEqual(false)
  })

  it('Should remove client from devices on disconnect', async () => {
    const clientid = 'abcd'
    devices[clientid] = {} as any
    await server.onClientDisconnected(clientid)
    expect(devices[clientid]).toBeUndefined()
  })

  it('Should initialize device on connect', async () => {
    const mockWebSocket = {
      on: jest.fn()
    }
    const webSocketMock = jest.spyOn(mockWebSocket, 'on')
    await server.onClientConnected(mockWebSocket as any)
    expect(webSocketMock).toHaveBeenCalledTimes(3)
    expect(Object.keys(devices).length).toBe(1)
  })

  it('Should log on error', async () => {
    const clientid = 'abcd'
    const error: Error = {
      name: 'abc',
      message: 'abcd'
    }
    const loggerSpy = jest.spyOn(server.logger, 'error')
    await server.onError(error, clientid)
    expect(loggerSpy).toHaveBeenCalled()
  })

  it('Should process client message and send response', async () => {
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
    const sendMessage = jest.spyOn(server, 'sendMessage')
    const processMessageSpy = jest.spyOn(server.dataProcessor, 'processData').mockResolvedValue(clientMsg)
    const message: WebSocket.Data = 'abcd'
    await server.onMessageReceived(message, clientid)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(processMessageSpy).toHaveBeenCalled()
  })
  it('Should process client message and not respond when no response to send', async () => {
    const clientid = 'abcd'
    const sendMessage = jest.spyOn(server, 'sendMessage')
    const processMessageSpy = jest.spyOn(server.dataProcessor, 'processData').mockResolvedValue(null)
    const message: WebSocket.Data = 'abcd'
    await server.onMessageReceived(message, clientid)
    expect(processMessageSpy).toHaveBeenCalled()
    expect(sendMessage).not.toHaveBeenCalled()
  })
  it('Should send message if client is defined in devices list', () => {
    const clientid = 'test'
    devices[clientid] = {
      ClientSocket: {
        send: jest.fn()
      }
    } as any
    const spy = jest.spyOn(devices[clientid].ClientSocket, 'send')
    const message: ClientMsg = {} as any
    server.sendMessage(message, clientid)
    expect(spy).toHaveBeenCalled()
  })

  it('Should NOT send message if client is not defined in devices list', () => {
    const clientid = 'test'
    const message: ClientMsg = {} as any
    server.sendMessage(message, clientid)
  })
})
