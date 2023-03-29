/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import ClientResponseMsg from '../utils/ClientResponseMsg'
import { Environment } from '../utils/Environment'
import { devices } from '../WebSocketListener'
import { type EnterpriseAssistantMessage, enterpriseAssistantSocket, promises } from '../WSEnterpriseAssistantListener'
import { GATEWAY_TIMEOUT_ERROR, UNEXPECTED_PARSE_ERROR } from '../utils/constants'
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

const invokeWsmanCallInternal = async (context: any): Promise<any> => {
  let { message, clientId, xmlMessage, httpHandler } = context
  const clientObj = devices[clientId]
  message = httpHandler.wrapIt(xmlMessage, clientObj.connectionParams)
  const clientMsg = ClientResponseMsg.get(clientId, message, 'wsman', 'ok')
  const clientMsgStr = JSON.stringify(clientMsg)
  clientObj.pendingPromise = new Promise<any>((resolve, reject) => {
    clientObj.resolve = resolve
    clientObj.reject = reject
  })
  clientObj.ClientSocket.send(clientMsgStr)
  return await clientObj.pendingPromise
}

const timeout = (ms): any => new Promise((resolve, reject) => {
  setTimeout(() => {
    reject(new GATEWAY_TIMEOUT_ERROR())
  }, ms)
})

const invokeWsmanCall = async (context: any, maxRetries = 0): Promise<any> => {
  let retries = 0

  while (retries <= maxRetries) {
    try {
      const result = await Promise.race([
        invokeWsmanCallInternal(context),
        timeout(Environment.Config.delayTimer * 1000)
      ])
      return result
    } catch (error) {
      if (error instanceof UNEXPECTED_PARSE_ERROR && retries < maxRetries) {
        retries++
        invokeWsmanLogger.warn(`Retrying... Attempt ${retries}`)
      } else {
        throw error
      }
    }
  }
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

export { invokeWsmanCall, invokeEnterpriseAssistantCall, invokeWsmanCallInternal }
