/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import ClientResponseMsg from '../utils/ClientResponseMsg.js'
import { Environment } from '../utils/Environment.js'
import { devices } from '../devices.js'
import { type EnterpriseAssistantMessage, enterpriseAssistantSocket, promises } from '../WSEnterpriseAssistantListener.js'
import { GATEWAY_TIMEOUT_ERROR, UNEXPECTED_PARSE_ERROR, EA_TIMEOUT_ERROR } from '../utils/constants.js'
import Logger from '../Logger.js'

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
  if (clientObj.ClientSocket) {
    clientObj.ClientSocket.send(clientMsgStr)
    return await clientObj.pendingPromise
  }
  invokeWsmanLogger.warn('No client socket')
  return clientObj.reject
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
        timeout(Environment.Config.delay_timer * 1000)
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
const invokeEnterpriseAssistantCallInternal = async (context: any): Promise<EnterpriseAssistantMessage> => {
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

const eaTimeout = (ms): any => new Promise((resolve, reject) => {
  setTimeout(() => {
    reject(new EA_TIMEOUT_ERROR())
  }, ms)
})

const invokeEnterpriseAssistantCall = async (context: any): Promise<EnterpriseAssistantMessage> => {
  const result = await Promise.race([
    invokeEnterpriseAssistantCallInternal(context),
    eaTimeout(Environment.Config.delay_timer * 1000)
  ])
  return result
}

export { invokeWsmanCall, invokeEnterpriseAssistantCall, invokeEnterpriseAssistantCallInternal, invokeWsmanCallInternal }
