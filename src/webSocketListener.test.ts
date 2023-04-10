/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type WebSocketConfig, type ClientMsg } from './models/RCS.Config'
import { devices, WebSocketListener } from './WebSocketListener'
import Logger from './Logger'
import { type ILogger } from './interfaces/ILogger'
import WebSocket from 'ws'

const wsConfig: WebSocketConfig = {
  WebSocketPort: 8080
}

describe('Websocket Listener', () => {
  const log: ILogger = new Logger('WebSocketListener')
  let server: WebSocketListener
  let isConnected: boolean
  let onSpy: jest.SpyInstance
  let clientid: string
  beforeEach(() => {
    clientid = 'abcd'
    devices[clientid] = {} as any
    const mockWebSocket: any = {
      on: jest.fn(),
      close: jest.fn()
    }
    devices[clientid].ClientSocket = mockWebSocket
    const stub = {
      processData: jest.fn()
    } as any
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

  it('Should remove client from devices on disconnect', () => {
    server.onClientDisconnected(clientid)
    expect(devices[clientid]).toBeUndefined()
  })

  it('Should initialize device on connect', () => {
    const mockWebSocket = {
      on: jest.fn()
    }
    const webSocketMock = jest.spyOn(mockWebSocket, 'on')
    server.onClientConnected(mockWebSocket as any)
    expect(webSocketMock).toHaveBeenCalledTimes(3)
    expect(Object.keys(devices).length).toBe(2)
  })

  it('Should log on error', () => {
    const error: Error = {
      name: 'abc',
      message: 'abcd'
    }
    const loggerSpy = jest.spyOn(server.logger, 'error')
    server.onError(error, clientid)
    expect(loggerSpy).toHaveBeenCalled()
  })

  it('Should process client message and send response', async () => {
    const clientMsg: ClientMsg = {
      method: 'myMethod',
      apiKey: 'abcd',
      appVersion: '1.0',
      protocolVersion: '2.0',
      status: '200',
      message: 'success',
      payload: null,
      tenantId: ''
    }
    const sendMessage = jest.spyOn(server, 'sendMessage')
    const processMessageSpy = jest.spyOn(server.dataProcessor, 'processData').mockResolvedValue(clientMsg)
    const message: WebSocket.Data = 'abcd'
    await server.onMessageReceived(message, clientid)
    expect(sendMessage).toHaveBeenCalledTimes(1)
    expect(processMessageSpy).toHaveBeenCalled()
  })
  it('Should generate error when maximum message length exceeded', async () => {
    const loggerSpy = jest.spyOn(server.logger, 'error')
    const message: WebSocket.Data = 'X'.repeat(1024 * 10 * 10 + 1)
    await server.onMessageReceived(message as any, clientid)
    expect(loggerSpy).toHaveBeenCalled()
    expect(loggerSpy).toHaveBeenCalledWith('Incoming message exceeds allowed length')
  })

  it('Should generate error when not a string', async () => {
    const loggerSpy = jest.spyOn(server.logger, 'error')
    const message: WebSocket.Data = Buffer.from('break the code')
    await server.onMessageReceived(message, clientid)
    expect(loggerSpy).toHaveBeenCalled()
    expect(loggerSpy).toHaveBeenCalledWith('Incoming message exceeds allowed length')
  })
  it('Should process client message and not respond when no response to send', async () => {
    const sendMessage = jest.spyOn(server, 'sendMessage')
    const processMessageSpy = jest.spyOn(server.dataProcessor, 'processData').mockResolvedValue(null)
    const message: WebSocket.Data = 'abcd'
    await server.onMessageReceived(message, clientid)
    expect(processMessageSpy).toHaveBeenCalled()
    expect(sendMessage).not.toHaveBeenCalled()
  })
  it('Should send message if client is defined in devices list', () => {
    clientid = 'test'
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
    clientid = 'test'
    const message: ClientMsg = {} as any
    server.sendMessage(message, clientid)
  })
})
