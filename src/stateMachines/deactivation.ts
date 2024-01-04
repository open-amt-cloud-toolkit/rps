/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine, interpret, sendTo } from 'xstate'
import { Configurator } from '../Configurator.js'
import { HttpHandler } from '../HttpHandler.js'
import Logger from '../Logger.js'
import ClientResponseMsg from '../utils/ClientResponseMsg.js'
import { Environment } from '../utils/Environment.js'
import { devices } from '../WebSocketListener.js'
import { Error } from './error.js'
import got from 'got'
import { invokeWsmanCall } from './common.js'

export interface DeactivationContext {
  message: any
  unauthCount: number
  clientId: string
  status: 'success' | 'error'
  xmlMessage: string
  errorMessage: string
  statusMessage: string
  httpHandler: HttpHandler
  tenantId: string
}

interface DeactivationEvent {
  type: 'UNPROVISION' | 'ONFAILED'
  clientId: string
  tenantId: string
  data: any
}
export class Deactivation {
  configurator: Configurator
  amt: AMT.Messages
  logger: Logger
  error: Error = new Error()
  machine =
    createMachine<DeactivationContext, DeactivationEvent>({
      predictableActionArguments: true,
      preserveActionOrder: true,
      context: {
        message: '',
        clientId: '',
        status: 'success',
        unauthCount: 0,
        xmlMessage: '',
        errorMessage: '',
        statusMessage: '',
        tenantId: '',
        httpHandler: new HttpHandler()
      },
      id: 'Deactivation Machine',
      initial: 'PROVISIONED',
      states: {
        PROVISIONED: {
          on: {
            UNPROVISION: {
              actions: [assign({ clientId: (context: DeactivationContext, event) => event.clientId, tenantId: (context: DeactivationContext, event) => event.tenantId }), 'Reset Unauth Count'],
              target: 'UNPROVISIONING'
            }
          }
        },
        UNPROVISIONING: {
          invoke: {
            src: this.invokeUnprovision.bind(this),
            id: 'send-unprovision-message',
            onDone: 'REMOVE_DEVICE_FROM_SECRET_PROVIDER',
            onError: 'ERROR'
          }
        },
        REMOVE_DEVICE_FROM_SECRET_PROVIDER: {
          invoke: {
            src: this.removeDeviceFromSecretProvider.bind(this),
            id: 'remove-device-from-secret-provider',
            onDone: 'REMOVE_DEVICE_FROM_MPS',
            onError: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'REMOVE_DEVICE_FROM_SECRET_PROVIDER_FAILURE'
            }
          }
        },
        REMOVE_DEVICE_FROM_SECRET_PROVIDER_FAILURE: {
          always: [
            {
              cond: 'isNotFound',
              target: 'REMOVE_DEVICE_FROM_MPS'
            }, {
              actions: assign({ errorMessage: (context, event) => 'Failed to remove device from secret provider' }),
              target: 'FAILED'
            }
          ]
        },
        REMOVE_DEVICE_FROM_MPS: {
          invoke: {
            src: this.removeDeviceFromMPS.bind(this),
            id: 'remove-device-from-mps',
            onDone: 'UNPROVISIONED',
            onError: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'REMOVE_DEVICE_FROM_MPS_FAILURE'
            }
          }
        },
        REMOVE_DEVICE_FROM_MPS_FAILURE: {
          always: [
            {
              cond: 'isNotFound',
              target: 'UNPROVISIONED'
            }, {
              actions: assign({ statusMessage: (context, event) => 'Deactivated. MPS Unavailable.' }),
              target: 'UNPROVISIONED'
            }
          ]
        },
        UNPROVISIONED: {
          type: 'final',
          entry: [assign({ status: (context: DeactivationContext, event) => 'success' }), 'Send Message to Device']
        },
        ERROR: {
          invoke: {
            id: 'error-machine',
            src: this.error.machine,
            data: {
              unauthCount: (context: DeactivationContext, event) => context.unauthCount,
              message: (context: DeactivationContext, event) => event.data,
              clientId: (context: DeactivationContext, event) => context.clientId
            },
            onDone: [{
              target: 'UNPROVISIONING'
            }],
            onError: 'FAILED'
          },
          entry: sendTo('error-machine', { type: 'PARSE' }),
          on: {
            ONFAILED: {
              actions: assign({ errorMessage: (context, event) => event.data }),
              target: 'FAILED'
            }
          }
        },
        FAILED: {
          entry: [assign({ status: (context: DeactivationContext, event) => 'error' }), 'Send Message to Device'],
          type: 'final'
        }
      }
    }, {
      actions: {
        'Reset Unauth Count': (context: DeactivationContext, event) => { devices[context.clientId].unauthCount = 0 },
        'Send Message to Device': this.sendMessageToDevice.bind(this)
      },
      guards: {
        isNotFound: (context, event) => {
          const { message } = context
          if (message.toString().includes('HTTPError: Response code 404')) {
            return true
          }
          return false
        }
      }
    })

  service = interpret(this.machine).onTransition((state) => {
    console.log(`Current state of Deactivation State Machine: ${JSON.stringify(state.value)}`)
  }).onDone((data) => {
    console.log('ONDONE:')
    console.log(data)
  })

  constructor () {
    this.configurator = new Configurator()
    this.amt = new AMT.Messages()
    this.logger = new Logger('Deactivation State Machine')
  }

  async removeDeviceFromSecretProvider (context: DeactivationContext): Promise<boolean> {
    return await this.configurator.secretsManager.deleteSecretAtPath(`devices/${devices[context.clientId].uuid}`)
  }

  async removeDeviceFromMPS (context: DeactivationContext): Promise<any> {
    return await got(`${Environment.Config.mps_server}/api/v1/devices/${devices[context.clientId].uuid}?tenantId=${context.tenantId}`, {
      method: 'DELETE'
    })
  }

  async invokeUnprovision (context: DeactivationContext): Promise<any> {
    context.xmlMessage = this.amt.SetupAndConfigurationService.Unprovision(1)
    return await invokeWsmanCall(context)
  }

  sendMessageToDevice (context: DeactivationContext, event: DeactivationEvent): void {
    const { clientId, status } = context
    const clientObj = devices[clientId]
    let method: 'failed' | 'success' | 'ok' | 'heartbeat' = 'success' // TODO: Get rid of redundant data (i.e. Method and Status)
    if (status === 'success') {
      clientObj.status.Status = context.statusMessage !== '' ? context.statusMessage : 'Deactivated'
      method = 'success'
    } else if (status === 'error') {
      clientObj.status.Status = context.errorMessage !== '' ? context.errorMessage : 'Failed'
      method = 'failed'
    }
    const responseMessage = ClientResponseMsg.get(clientId, null, status, method, JSON.stringify(clientObj.status))
    devices[clientId].ClientSocket.send(JSON.stringify(responseMessage))
  }
}
