/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Environment } from '../utils/Environment.js'
import { HttpHandler } from '../HttpHandler.js'
import Logger from '../Logger.js'
import ClientResponseMsg from '../utils/ClientResponseMsg.js'
import { devices } from '../WebSocketListener.js'
import { GATEWAY_TIMEOUT_ERROR, UNEXPECTED_PARSE_ERROR, EA_TIMEOUT_ERROR } from '../utils/constants.js'
import { v4 as uuid } from 'uuid'
import * as enterpriseAssistantListener from '../WSEnterpriseAssistantListener.js'
import * as common from './common.js'
import { config } from '../test/helper/Config.js'
Environment.Config = config
describe('Common', () => {
  const clientId = uuid()
  let sendSpy
  let responseMessageSpy: jest.SpyInstance
  let wrapItSpy: jest.SpyInstance
  let enterpriseAssistantSocketSendSpy: jest.SpyInstance
  const context = {
    message: '',
    clientId,
    xmlMessage: '<?xml version="1.0" encoding="UTF-8"?><a:Envelope>Test Content</a:Envelope>',
    httpHandler: new HttpHandler()
  }
  beforeEach(() => {
    jest.useFakeTimers()
    devices[clientId] = {
      ClientSocket: {
        send: jest.fn()
      },
      connectionParams: {
        guid: clientId,
        port: 16992,
        digestChallenge: null
      }
    } as any

    wrapItSpy = jest.spyOn(context.httpHandler, 'wrapIt')
    responseMessageSpy = jest.spyOn(ClientResponseMsg, 'get')
    sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send').mockReturnValue()
    const x = new enterpriseAssistantListener.WSEnterpriseAssistantListener(new Logger('test'))
    x.onClientConnected({
      send: jest.fn(),
      on: jest.fn()
    } as any)
    enterpriseAssistantSocketSendSpy = jest.spyOn(enterpriseAssistantListener.enterpriseAssistantSocket, 'send').mockImplementation(() => ({} as any))
  })

  afterEach(() => {
    jest.runAllTicks()
    jest.useRealTimers()
  })

  it('should send a WSMan message once with successful reply', async () => {
    const expected = '123'
    const wsmanPromise = common.invokeWsmanCall(context, 2)
    expect(wrapItSpy).toHaveBeenCalled()
    expect(responseMessageSpy).toHaveBeenCalled()
    expect(sendSpy).toHaveBeenCalledTimes(1)
    expect(devices[clientId].pendingPromise).toBeDefined()
    devices[clientId].resolve(expected)
    await expect(wsmanPromise).resolves.toEqual(expected)
  })
  it('should successfully resolve after one UNEXPECTED_PARSE_ERROR', async () => {
    const expected = '123'
    let invokeWsmanCallInternalCallCount = 0
    sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send')
    sendSpy.mockImplementation(async (context) => {
      invokeWsmanCallInternalCallCount++
      if (invokeWsmanCallInternalCallCount === 1) {
        devices[clientId].reject(new UNEXPECTED_PARSE_ERROR())
      } else {
        devices[clientId].resolve(expected)
      }
    })
    const wsmanPromise = common.invokeWsmanCall(context, 2)
    await expect(wsmanPromise).resolves.toEqual(expected)
    expect(sendSpy).toHaveBeenCalledTimes(2)
  })
  it('should successfully resolve after two UNEXPECTED_PARSE_ERROR', async () => {
    const expected = '123'
    let invokeWsmanCallInternalCallCount = 0

    sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send')
    sendSpy.mockImplementation(async (context) => {
      invokeWsmanCallInternalCallCount++
      if (invokeWsmanCallInternalCallCount <= 2) {
        devices[clientId].reject(new UNEXPECTED_PARSE_ERROR())
      } else {
        devices[clientId].resolve(expected)
      }
    })
    const wsmanPromise = common.invokeWsmanCall(context, 2)
    await expect(wsmanPromise).resolves.toEqual(expected)
    expect(sendSpy).toHaveBeenCalledTimes(3)
  })

  it('should try three times on UNEXPECTED_PARSE_ERROR', async () => {
    const expected = '123'
    let invokeWsmanCallInternalCallCount = 0
    sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send')
    sendSpy.mockImplementation(async (context) => {
      invokeWsmanCallInternalCallCount++
      if (invokeWsmanCallInternalCallCount <= 3) {
        devices[clientId].reject(new UNEXPECTED_PARSE_ERROR())
      } else {
        devices[clientId].resolve(expected)
      }
    })
    const wsmanPromise = common.invokeWsmanCall(context, 2)
    await expect(wsmanPromise).rejects.toBeInstanceOf(UNEXPECTED_PARSE_ERROR)
    expect(sendSpy).toHaveBeenCalledTimes(3)
  })

  it('should not retry by default on UNEXPECTED_PARSE_ERROR', async () => {
    const wsmanPromise = common.invokeWsmanCall(context)
    expect(sendSpy).toHaveBeenCalledTimes(1)
    devices[clientId].reject(new UNEXPECTED_PARSE_ERROR())
    expect(sendSpy).toHaveBeenCalledTimes(1)
    await expect(wsmanPromise).rejects.toBeInstanceOf(UNEXPECTED_PARSE_ERROR)
  })
  it('should not retry when error is not UNEXPECTED_PARSE_ERROR', async () => {
    const expected = {
      statusCode: 401,
      statusMessage: 'Unauthorized'
    }
    let invokeWsmanCallInternalCallCount = 0
    sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send')
    sendSpy.mockImplementation(async (context) => {
      invokeWsmanCallInternalCallCount++
      if (invokeWsmanCallInternalCallCount <= 1) {
        devices[clientId].reject(new UNEXPECTED_PARSE_ERROR())
      } else {
        devices[clientId].reject(expected)
      }
    })
    const wsmanPromise = common.invokeWsmanCall(context, 2)
    await expect(wsmanPromise).rejects.toEqual(expected)
    expect(sendSpy).toHaveBeenCalledTimes(2)
  })
  it('should send an enterprise-assistant message', async () => {
    void common.invokeEnterpriseAssistantCallInternal(context)

    expect(enterpriseAssistantSocketSendSpy).toHaveBeenCalled()
    expect(enterpriseAssistantListener.promises[clientId].pendingPromise).toBeDefined()
    expect(enterpriseAssistantListener.promises[clientId].resolve).toBeDefined()
    expect(enterpriseAssistantListener.promises[clientId].reject).toBeDefined()
  })

  it('should timeout on no response from AMT', async () => {
    try {
      const x = common.invokeWsmanCall(context)
      jest.advanceTimersByTime(Environment.Config.delay_timer * 1000)
      await x
    } catch (err) {
      expect(err).toBeInstanceOf(GATEWAY_TIMEOUT_ERROR)
    }
  })

  it('should timeout on no response from EA', async () => {
    try {
      const x = common.invokeEnterpriseAssistantCall(context)
      jest.advanceTimersByTime(Environment.Config.delay_timer * 1000)
      await x
    } catch (err) {
      expect(err).toBeInstanceOf(EA_TIMEOUT_ERROR)
    }
  })
})
