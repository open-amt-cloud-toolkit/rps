/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpHandler } from '../HttpHandler'
import ClientResponseMsg from '../utils/ClientResponseMsg'
import { devices } from '../WebSocketListener'
import { invokeWsmanCall } from './common'
import { UNEXPECTED_PARSE_ERROR } from '../utils/constants'
import { v4 as uuid } from 'uuid'

describe('Common', () => {
  const clientId = uuid()
  let sendSpy
  let responseMessageSpy: jest.SpyInstance
  let wrapItSpy: jest.SpyInstance
  const context = {
    message: '',
    clientId,
    xmlMessage: '<?xml version="1.0" encoding="UTF-8"?><a:Envelope>Test Content</a:Envelope>',
    httpHandler: new HttpHandler()
  }
  beforeEach(() => {
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
  })
  it('should send a WSMan message once with successful reply', async () => {
    const expected = '123'
    const wsmanPromise = invokeWsmanCall(context, 2)
    expect(wrapItSpy).toHaveBeenCalled()
    expect(responseMessageSpy).toHaveBeenCalled()
    expect(sendSpy).toHaveBeenCalledTimes(1)
    expect(devices[clientId].pendingPromise).toBeDefined()
    devices[clientId].resolve(expected)
    await expect(wsmanPromise).resolves.toEqual(expected)
  })
  it('should successfully resolve after one UNEXPECTED_PARSE_ERROR', async () => {
    const expected = '123'
    const wsmanPromise = invokeWsmanCall(context, 2)
    await devices[clientId].reject(UNEXPECTED_PARSE_ERROR)
    devices[clientId].resolve(expected)
    await expect(wsmanPromise).resolves.toEqual(expected)
    expect(sendSpy).toHaveBeenCalledTimes(2)
  })
  it('should successfully resolve after two UNEXPECTED_PARSE_ERROR', async () => {
    const expected = '123'
    const wsmanPromise = invokeWsmanCall(context, 2)
    await devices[clientId].reject(UNEXPECTED_PARSE_ERROR)
    await devices[clientId].reject(UNEXPECTED_PARSE_ERROR)
    await devices[clientId].resolve(expected)
    await expect(wsmanPromise).resolves.toEqual(expected)
    expect(sendSpy).toHaveBeenCalledTimes(3)
  })
  it('should try three times on UNEXPECTED_PARSE_ERROR', async () => {
    const wsmanPromise = invokeWsmanCall(context, 2)
    expect(sendSpy).toHaveBeenCalledTimes(1)
    await devices[clientId].reject(UNEXPECTED_PARSE_ERROR)
    expect(sendSpy).toHaveBeenCalledTimes(2)
    await devices[clientId].reject(UNEXPECTED_PARSE_ERROR)
    expect(sendSpy).toHaveBeenCalledTimes(3)
    devices[clientId].reject(UNEXPECTED_PARSE_ERROR)
    expect(sendSpy).toHaveBeenCalledTimes(3)
    await expect(wsmanPromise).rejects.toEqual(UNEXPECTED_PARSE_ERROR)
  })
  it('should not retry by default on UNEXPECTED_PARSE_ERROR', async () => {
    const wsmanPromise = invokeWsmanCall(context)
    expect(sendSpy).toHaveBeenCalledTimes(1)
    await devices[clientId].reject(UNEXPECTED_PARSE_ERROR)
    expect(sendSpy).toHaveBeenCalledTimes(1)
    await expect(wsmanPromise).rejects.toEqual(UNEXPECTED_PARSE_ERROR)
  })
  it('should not retry when error is not UNEXPECTED_PARSE_ERROR', async () => {
    const expected = {
      statusCode: 401,
      statusMessage: 'Unauthorized'
    }
    const wsmanPromise = invokeWsmanCall(context, 2)
    await devices[clientId].reject(UNEXPECTED_PARSE_ERROR)
    await devices[clientId].reject(expected)
    await expect(wsmanPromise).rejects.toEqual(expected)
    expect(sendSpy).toHaveBeenCalledTimes(2)
  })
})
