import { createMachine, sendParent } from 'xstate'
import { pure } from 'xstate/lib/actions'
import { HttpHandler } from '../HttpHandler'
import { devices } from '../WebSocketListener'
import { parseBody } from '../utils/parseWSManResponseBody'
import { HttpZResponseModel } from 'http-z'

const httpHandler = new HttpHandler()
export interface ErrorContext {
  message: HttpZResponseModel
  parsedMessage: any
  clientId: string
}

interface ErrorEvent {
  type: 'PARSE'
  clientId: string
}

export class Error {
  machine =

  /** @xstate-layout N4IgpgJg5mDOIC5RgE4oPYoLQFsCGAxgBYCWAdmAHQCiASrQPK3UAiAxAAoCCtAytYlAAHdLBIAXEujKCQAD0QBmAEwAOSgDYADAE5FGgKxqdqjQEYDAGhABPRKp2UdznQYAsy5fpWqzAXz9rVAxsfGJyKgBVADkuSIAVAAkmAEkALVY2WRExSWlZBQQdAHZ1RUUtZS13Yq1ig2LrOyLHOvKzNzcDA1Vq4o0AwJAydAg4WWDMXEJSChp6JlZs0QkpGSR5RCrFSmLFN0UdSp7So40mxDNis0o3FyNVfTda5QCgtCmw2ajYhOTadJLDY5Vb5DaFbTFShmKrHXRqXyNWz2Ny3e6PVQGGF1HRvcAfUIzCKUOJJVIZFjLXJrAqXZTmSj04r05TOerMxQXBAwjSMwzlDReNwaFy4oaTQnhOYAMS4KQAMqxSf9AZTgSs8utQIUYd1KKpiiUdB1lD1KqouRV1G4LB5DX09oo8RLplKqAAhLgsZgARUi1F48SpoK1mwQ5mUlEUZg0pS0Zi0IsUBh0lsOUZK1y0jwMdQ0XWdBNd30oMQA0tEGAB1aLBzW0hDKerQhpmXy5jSqDGW1xOXoI6OCizuQshYsROs08GXQ27faHY4GhyJrkwtFsswWYoHA2DPxAA */
  createMachine<ErrorContext, ErrorEvent>({
    preserveActionOrder: true,
    predictableActionArguments: true,
    context: { message: null, clientId: '', parsedMessage: null },
    id: 'error-machine',
    initial: 'ERRORED',
    states: {
      ERRORED: {
        on: {
          PARSE: [
            {
              cond: 'isUnauthorized',
              target: 'UNAUTHORIZED'
            },
            {
              cond: 'isBadRequest',
              target: 'BADREQUEST'
            },
            {
              target: 'UNKNOWN'
            }
          ]
        }
      },
      UNAUTHORIZED: {
        entry: 'addAuthorizationHeader',
        always: [
          {
            cond: 'isMaxRetries',
            target: 'AUTHORIZED'
          },
          {
            target: 'FAILEDAUTHORIZED'
          }
        ]
      },
      AUTHORIZED: {
        type: 'final'
      },
      FAILEDAUTHORIZED: {
        entry: 'respondUnauthorized'
      },
      BADREQUEST: {
        entry: ['parseError', 'respondBadRequest']
      },
      UNKNOWN: {
        entry: ['parseError', 'respondUnknown']
      }
    }
  }, {
    guards: {
      isMaxRetries: (context, event) => {
        return devices[context.clientId].unauthCount < 3
      },
      isBadRequest: (context, event) => {
        return context.message?.statusCode === 400
      },
      isUnauthorized: (context, event) => {
        return context.message?.statusCode === 401
      }
    },
    actions: {
      respondUnauthorized: pure((context) => {
        devices[context.clientId].unauthCount = 0
        return sendParent({ type: 'ONFAILED', data: 'Unable to authenticate with AMT. Exceeded Retry Attempts' })
      }),
      respondBadRequest: pure((context) => this.respondBadRequest(context)),
      respondUnknown: pure((context) => {
        devices[context.clientId].unauthCount = 0
        return sendParent({ type: 'ONFAILED', data: 'Unknown error has occured' })
      }),
      parseError: (context) => this.parseError(context),
      addAuthorizationHeader: (context) => this.addAuthorizationHeader(context)
    }
  })

  addAuthorizationHeader (context): void {
    const { message, clientId } = context
    const clientObj = devices[clientId]
    if (clientObj.unauthCount == null) {
      clientObj.unauthCount = 0
    }
    clientObj.unauthCount++
    const found = message.headers?.find(item => item.name === 'Www-Authenticate')
    if (found != null) {
      clientObj.connectionParams.digestChallenge = httpHandler.parseAuthenticateResponseHeader(found.value)
    }
  }

  respondBadRequest (context): any {
    devices[context.clientId].unauthCount = 0
    return sendParent({ type: 'ONFAILED', data: context.parsedMessage })
  }

  parseError (context): void {
    const xmlBody = parseBody(context.message)
    // pares WSMan xml response to json
    context.parsedMessage = httpHandler.parseXML(xmlBody)
  }
}
