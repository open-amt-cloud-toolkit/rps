/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Environment } from '../../utils/Environment'
import { HttpHandler } from '../../HttpHandler'
import ClientResponseMsg from '../../utils/ClientResponseMsg'
import { devices } from '../../WebSocketListener'
import { GatewayTimeoutError, UnexpectedParseError } from '../../utils/constants'
import { v4 as uuid } from 'uuid'
import { coalesceMessage, HttpResponseError, invokeWsmanCall, isDigestRealmValid } from './common'
import { config } from '../../test/helper/Config'
import { type HttpZResponseModel, parse } from 'http-z'
import { response401 } from '../../test/helper/AMTMessages'

Environment.Config = config

const clientId = uuid()
const HttpUnauthorizedError = new HttpResponseError('Unauthorized', 401)
const xmlMessage = '<?xml version="1.0" encoding="UTF-8"?><a:Envelope><a:Body>Test Content</a:Envelope>'
let sendSpy
let responseMessageSpy: jest.SpyInstance
let wrapItSpy: jest.SpyInstance
let wsmanRsp: any
beforeEach(() => {
  Environment.Config.delay_timer = 1
  devices[clientId] = {
    ClientSocket: {
      send: jest.fn()
    },
    connectionParams: {
      guid: clientId,
      port: 16992,
      digestChallenge: null
    },
    unauthCount: 0
  } as any

  wrapItSpy = jest.spyOn(HttpHandler.prototype, 'wrapIt')
  responseMessageSpy = jest.spyOn(ClientResponseMsg, 'get')
  sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send').mockReturnValue()
  wsmanRsp = {
    Envelope: {
      Body: {
        ReturnValue: 0,
        Data: 123
      }
    }
  }
})

const delayedReject = function (value): null {
  setTimeout(() => { devices[clientId].reject(value) },
    Environment.Config.delay_timer * 1000 * 0.55)
  return null
}

const delayedResolve = function (value): null {
  setTimeout(() => { devices[clientId].resolve(value) },
    Environment.Config.delay_timer * 1000 * 0.55)
  return null
}

it('should send a WSMan message once with successful reply', async () => {
  sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedResolve(wsmanRsp))
  await expect(invokeWsmanCall(clientId, xmlMessage, 2)).resolves.toEqual(wsmanRsp.Envelope.Body)
  expect(wrapItSpy).toHaveBeenCalled()
  expect(responseMessageSpy).toHaveBeenCalled()
  expect(sendSpy).toHaveBeenCalledTimes(1)
  expect(devices[clientId].pendingPromise).toBeDefined()
})
it('should successfully resolve after one UnexpectedParseError', async () => {
  sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()))
    .mockImplementationOnce(delayedResolve(wsmanRsp))
  await expect(invokeWsmanCall(clientId, xmlMessage, 2)).resolves.toEqual(wsmanRsp.Envelope.Body)
  expect(sendSpy).toHaveBeenCalledTimes(2)
})
it('should successfully resolve after two UnexpectedParseError', async () => {
  sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()))
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()))
    .mockImplementationOnce(delayedResolve(wsmanRsp))
  await expect(invokeWsmanCall(clientId, xmlMessage, 2)).resolves.toEqual(wsmanRsp.Envelope.Body)
  expect(sendSpy).toHaveBeenCalledTimes(3)
})
it('should try three times on UnexpectedParseError', async () => {
  sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()))
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()))
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()))
  await expect(invokeWsmanCall(clientId, xmlMessage, 2)).rejects.toBeInstanceOf(UnexpectedParseError)
  expect(sendSpy).toHaveBeenCalledTimes(3)
})
it('should try authentication three times on 401 Unauthorized', async () => {
  const httpRsp401 = parse(response401) as HttpZResponseModel
  const expectedToThrow = new HttpResponseError('Unauthorized', 401)
  sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedReject(httpRsp401))
    .mockImplementationOnce(delayedReject(httpRsp401))
    .mockImplementationOnce(delayedReject(httpRsp401))
  await expect(invokeWsmanCall(clientId, xmlMessage)).rejects.toEqual(expectedToThrow)
  expect(sendSpy).toHaveBeenCalledTimes(3)
})
it('should not retry by default on new UnexpectedParseError()', async () => {
  sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()))
  await expect(invokeWsmanCall(clientId, xmlMessage)).rejects.toBeInstanceOf(UnexpectedParseError)
  expect(sendSpy).toHaveBeenCalledTimes(1)
})
it('should not retry when error is not new UnexpectedParseError()', async () => {
  const unauthorizedResponse = {
    statusCode: 401,
    statusMessage: 'Unauthorized'
  }
  sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()))
    .mockImplementationOnce(delayedReject(unauthorizedResponse))
  await expect(invokeWsmanCall(clientId, xmlMessage, 2)).rejects.toEqual(HttpUnauthorizedError)
  expect(sendSpy).toHaveBeenCalledTimes(2)
})
it('should timeout on no reponse', async () => {
  await expect(invokeWsmanCall(clientId, xmlMessage, 2)).rejects.toBeInstanceOf(GatewayTimeoutError)
})
it('should fail if parsed xml is malformed', async () => {
  delete wsmanRsp.Envelope
  sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedResolve(wsmanRsp))
  await expect(invokeWsmanCall(clientId, xmlMessage)).rejects.toBeInstanceOf(UnexpectedParseError)
  expect(wrapItSpy).toHaveBeenCalled()
  expect(responseMessageSpy).toHaveBeenCalled()
})
it('should rethrow same error it catches if error object has no statusCode', async () => {
  const noStatusCodeErr = new Error('just a plain, regular, boring error')
  sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedReject(noStatusCodeErr))
  await expect(invokeWsmanCall(clientId, xmlMessage)).rejects.toEqual(noStatusCodeErr)
  expect(wrapItSpy).toHaveBeenCalled()
  expect(responseMessageSpy).toHaveBeenCalled()
})
it('should return false if digest realm is null', () => {
  expect(isDigestRealmValid(null)).toBeFalsy()
})
it('should return coalesced error message', () => {
  const prefix = 'test error'
  const anyErr = {
    statusCode: 400,
    statusMessage: 'Bad Request'
  }
  const msg = coalesceMessage(prefix, anyErr)
  expect(msg).toBeTruthy()
  expect(msg).toContain(prefix)
  expect(msg).toContain('Bad Request')
  expect(msg).toContain('400')
})
