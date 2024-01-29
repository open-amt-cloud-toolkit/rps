/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Environment } from '../../utils/Environment.js'
import { HttpHandler } from '../../HttpHandler.js'
import ClientResponseMsg from '../../utils/ClientResponseMsg.js'
import { devices } from '../../devices.js'
import { GatewayTimeoutError, UnexpectedParseError } from '../../utils/constants.js'
import { randomUUID } from 'node:crypto'
import { coalesceMessage, HttpResponseError, invokeWsmanCall, isDigestRealmValid } from './common.js'
import { config } from '../../test/helper/Config.js'
import pkg, { type HttpZResponseModel } from 'http-z'
import { response401 } from '../../test/helper/AMTMessages.js'
import { jest } from '@jest/globals'
import { type SpyInstance, spyOn } from 'jest-mock'

Environment.Config = config

const clientId = randomUUID()
const HttpUnauthorizedError = new HttpResponseError('Unauthorized', 401)
const xmlMessage = '<?xml version="1.0" encoding="UTF-8"?><a:Envelope><a:Body>Test Content</a:Envelope>'
let sendSpy
let responseMessageSpy: SpyInstance<any>
let wrapItSpy: SpyInstance<any>
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

  wrapItSpy = spyOn(HttpHandler.prototype, 'wrapIt')
  responseMessageSpy = spyOn(ClientResponseMsg, 'get')
  sendSpy = spyOn(devices[clientId].ClientSocket, 'send').mockReturnValue()
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
  sendSpy = spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedResolve(wsmanRsp) as any)
  await expect(invokeWsmanCall(clientId, xmlMessage, 2)).resolves.toEqual(wsmanRsp.Envelope.Body)
  expect(wrapItSpy).toHaveBeenCalled()
  expect(responseMessageSpy).toHaveBeenCalled()
  expect(sendSpy).toHaveBeenCalledTimes(1)
  expect(devices[clientId].pendingPromise).toBeDefined()
})
it('should successfully resolve after one UnexpectedParseError', async () => {
  sendSpy = spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()) as any)
    .mockImplementationOnce(delayedResolve(wsmanRsp) as any)
  await expect(invokeWsmanCall(clientId, xmlMessage, 2)).resolves.toEqual(wsmanRsp.Envelope.Body)
  expect(sendSpy).toHaveBeenCalledTimes(2)
})
it('should successfully resolve after two UnexpectedParseError', async () => {
  sendSpy = spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()) as any)
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()) as any)
    .mockImplementationOnce(delayedResolve(wsmanRsp) as any)
  await expect(invokeWsmanCall(clientId, xmlMessage, 2)).resolves.toEqual(wsmanRsp.Envelope.Body)
  expect(sendSpy).toHaveBeenCalledTimes(3)
})
it('should try three times on UnexpectedParseError', async () => {
  sendSpy = spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()) as any)
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()) as any)
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()) as any)
  await expect(invokeWsmanCall(clientId, xmlMessage, 2)).rejects.toBeInstanceOf(UnexpectedParseError)
  expect(sendSpy).toHaveBeenCalledTimes(3)
})
it('should try authentication three times on 401 Unauthorized', async () => {
  const { parse } = pkg
  const httpRsp401 = parse(response401) as HttpZResponseModel
  const expectedToThrow = new HttpResponseError('Unauthorized', 401)
  sendSpy = spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedReject(httpRsp401) as any)
    .mockImplementationOnce(delayedReject(httpRsp401) as any)
    .mockImplementationOnce(delayedReject(httpRsp401) as any)
  await expect(invokeWsmanCall(clientId, xmlMessage)).rejects.toEqual(expectedToThrow)
  expect(sendSpy).toHaveBeenCalledTimes(3)
})
it('should not retry by default on new UnexpectedParseError()', async () => {
  sendSpy = spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()) as any)
  await expect(invokeWsmanCall(clientId, xmlMessage)).rejects.toBeInstanceOf(UnexpectedParseError)
  expect(sendSpy).toHaveBeenCalledTimes(1)
})
it('should not retry when error is not new UnexpectedParseError()', async () => {
  const unauthorizedResponse = {
    statusCode: 401,
    statusMessage: 'Unauthorized'
  }
  sendSpy = spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedReject(new UnexpectedParseError()) as any)
    .mockImplementationOnce(delayedReject(unauthorizedResponse) as any)
  await expect(invokeWsmanCall(clientId, xmlMessage, 2)).rejects.toEqual(HttpUnauthorizedError)
  expect(sendSpy).toHaveBeenCalledTimes(2)
})
it('should timeout on no reponse', async () => {
  await expect(invokeWsmanCall(clientId, xmlMessage, 2)).rejects.toBeInstanceOf(GatewayTimeoutError)
})
it('should fail if parsed xml is malformed', async () => {
  delete wsmanRsp.Envelope
  sendSpy = spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedResolve(wsmanRsp) as any)
  await expect(invokeWsmanCall(clientId, xmlMessage)).rejects.toBeInstanceOf(UnexpectedParseError)
  expect(wrapItSpy).toHaveBeenCalled()
  expect(responseMessageSpy).toHaveBeenCalled()
})
it('should rethrow same error it catches if error object has no statusCode', async () => {
  const noStatusCodeErr = new Error('just a plain, regular, boring error')
  sendSpy = spyOn(devices[clientId].ClientSocket, 'send')
    .mockImplementationOnce(delayedReject(noStatusCodeErr) as any)
  await expect(invokeWsmanCall(clientId, xmlMessage)).rejects.toEqual(noStatusCodeErr)
  expect(wrapItSpy).toHaveBeenCalled()
  expect(responseMessageSpy).toHaveBeenCalled()
})
it('should return false if digest realm is null', () => {
  expect(isDigestRealmValid(null as any)).toBeFalsy()
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
