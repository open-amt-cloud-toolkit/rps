/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import ClientResponseMsg from '../utils/ClientResponseMsg'
import { devices } from '../WebSocketListener'
import { type EnterpriseAssistantMessage, enterpriseAssistantSocket, promises } from '../WSEnterpriseAssistantListener'
import { UNEXPECTED_PARSE_ERROR } from '../utils/constants'
import Logger from '../Logger'

const invokeWsmanLogger = new Logger('invokeWsmanCall')

/**
 * If retries is more than 0, will resend the message
 * if the response cannot be parsed.
 *
 * @param context
 * @param retries <optional> ADDITIONAL times to send the message.
 * If you want to try a total of 3 times, retries should equal 2
 */
const invokeWsmanCall = async (context: any, retries = 0): Promise<any> => {
  let { message, clientId, xmlMessage, httpHandler } = context
  const clientObj = devices[clientId]
  message = httpHandler.wrapIt(xmlMessage, clientObj.connectionParams)
  const clientMsg = ClientResponseMsg.get(clientId, message, 'wsman', 'ok')
  const clientMsgStr = JSON.stringify(clientMsg)
  clientObj.pendingPromise = new Promise<any>((resolve, reject) => {
    clientObj.resolve = resolve
    clientObj.reject = reject
  }).catch(async function (err) {
    if (retries > 0 && err.statusCode === UNEXPECTED_PARSE_ERROR.statusCode) {
      invokeWsmanLogger.warn(`UNEXPECTED_PARSE_ERROR - retrying original: ${xmlMessage}`)
      return await invokeWsmanCall(context, retries - 1)
    }
    throw err
  })
  clientObj.ClientSocket.send(clientMsgStr)
  return await clientObj.pendingPromise
}

const invokeEnterpriseAssistantCall = async (context: any): Promise<EnterpriseAssistantMessage> => {
  const { clientId, message } = context
  enterpriseAssistantSocket.send(JSON.stringify(message))
  if (promises[clientId] == null) {
    promises[clientId] = {} as any
  }
  promises[clientId].pendingPromise = new Promise<any>((resolve, reject) => {
    promises[clientId].resolve = resolve
    promises[clientId].reject = reject
  })
  return await promises[clientId].pendingPromise
}

export { invokeWsmanCall, invokeEnterpriseAssistantCall }
