/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import ClientResponseMsg from '../../utils/ClientResponseMsg.js'
import { Environment } from '../../utils/Environment.js'
import { devices } from '../../devices.js'
import { GatewayTimeoutError, UNEXPECTED_PARSE_ERROR, UnexpectedParseError } from '../../utils/constants.js'
import Logger from '../../Logger.js'
import { HttpHandler } from '../../HttpHandler.js'
import { assign } from 'xstate'

export type EnumerationContext = string

export const UNEXPECTED_PARSE_ERROR_STATUS_CODE = 599
export const GATEWAY_TIMEOUT_STATUS_CODE = 504

export class HttpResponseError extends Error {
  statusCode: number

  constructor (message: string, statusCode: number) {
    super(message)
    this.name = this.constructor.name
    this.statusCode = statusCode
    Error.captureStackTrace(this, this.constructor)
  }
}

export function isDigestRealmValid (realm: string): boolean {
  const regex: RegExp = /[0-9A-Fa-f]{32}/g
  let isValidRealm: boolean = false
  let realmElements: any = {}
  if (realm?.startsWith('Digest:')) {
    realmElements = realm.split('Digest:')
    if (realmElements[1].length === 32 && regex.test(realmElements[1])) {
      isValidRealm = true
    }
  }
  return isValidRealm
}

export function coalesceMessage (prefixMsg: string, err: any): string {
  let msg = prefixMsg
  if (err.statusCode) {
    msg = `${msg} ${err.statusCode}`
    if (err.statusMessage) {
      msg = `${msg} ${err.statusMessage}`
    }
  }
  if (err.message) {
    msg = `${msg} ${err.message}`
  }
  return msg
}

const invokeWsmanLogger = new Logger('invokeWsmanCall')
const httpHandler = new HttpHandler()

export const invokeWsmanCall = async <T> (clientId: string, wsmanXml: string, retries: number = 0): Promise<T> => {
  const clientObj = devices[clientId]
  const wrapped = httpHandler.wrapIt(wsmanXml, clientObj.connectionParams)
  const clientMsg = ClientResponseMsg.get(clientId, wrapped, 'wsman', 'ok')
  const clientMsgStr = JSON.stringify(clientMsg)
  let timeoutId
  clientObj.pendingPromise = new Promise<any>((resolve, reject) => {
    clientObj.resolve = resolve
    clientObj.reject = reject
    timeoutId = setTimeout(reject, Environment.Config.delay_timer * 1000, new GatewayTimeoutError())
    clientObj.ClientSocket.send(clientMsgStr)
  })
    .then((rsp) => {
      clearTimeout(timeoutId)
      clientObj.unauthCount = 0
      // these are still wrapped up xml messages, so strip those off
      if (!rsp.Envelope?.Body) {
        throw new UnexpectedParseError()
      }
      return (rsp.Envelope.Body)
    })
    .catch(async (err) => {
      clearTimeout(timeoutId)
      if (!err.statusCode) {
        throw err
      }
      if (err.statusCode === UNEXPECTED_PARSE_ERROR_STATUS_CODE && retries > 0) {
        invokeWsmanLogger.warn(`UNEXPECTED_PARSE_ERROR - retrying original: ${wsmanXml}`)
        return await invokeWsmanCall(clientId, wsmanXml, retries - 1)
      } else if (err.statusCode === 401 && clientObj.unauthCount < 2) {
        const found = err.headers?.find(item => item.name === 'Www-Authenticate')
        if (found != null) {
          clientObj.connectionParams.digestChallenge = httpHandler.parseAuthenticateResponseHeader(found.value)
          clientObj.unauthCount++
          return await invokeWsmanCall(clientId, wsmanXml, retries)
        }
      }
      clientObj.unauthCount = 0
      let errToThrow
      switch (err.statusCode) {
        case UNEXPECTED_PARSE_ERROR_STATUS_CODE:
        case GATEWAY_TIMEOUT_STATUS_CODE:
          errToThrow = err
          break
        default:
          errToThrow = new HttpResponseError(err.statusMessage, err.statusCode)
      }
      throw errToThrow
    })
  return await clientObj.pendingPromise
}

export interface CommonContext {
  clientId: string
  statusMessage: string
  parseErrorCount: number
}

export interface CommonMaintenanceContext extends CommonContext {
  taskName: string
}

export const commonContext: CommonContext = {
  clientId: '',
  statusMessage: '',
  parseErrorCount: 0
}

export const commonGuards = {
  shoudRetryOnParseError: (context, event) =>
    context.parseErrorCount < 3 &&
    event.data instanceof UNEXPECTED_PARSE_ERROR
}

export const commonActions = {
  incrementParseErrorCount: assign({ parseErrorCount: (context: CommonContext) => context.parseErrorCount + 1 }),
  resetParseErrorCount: assign({ parseErrorCount: 0 })
}
