/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { createMachine, interpret, assign, sendTo } from 'xstate'
import { HttpHandler } from '../HttpHandler'
import Logger from '../Logger'
import ClientResponseMsg from '../utils/ClientResponseMsg'
import { Configurator } from '../Configurator'
import { devices } from '../WebSocketListener'
import { AMTPassword } from './amtPassword'
import { Error } from './error'
import { SyncIP } from './syncIP'
import { TimeSync } from './timeMachine'
import { SyncHostName } from './syncHostName'

export interface MaintenanceContext {
  message: any
  xmlMessage: string
  errorMessage: string
  statusMessage: string
  clientId: string
  httpHandler: HttpHandler
  status: 'success' | 'error' | ''
}

export interface MaintenanceEvent {
  type: 'SYNCTIME' | 'ONFAILED' | 'ON_SYNCIP_FAILED' | 'SYNCIP' | 'CHANGEPASSWORD' | 'SYNCHOSTNAME'
  clientId: string
  data?: any
}

export class Maintenance {
  configurator = new Configurator()
  amt: AMT.Messages
  logger = new Logger('Maintenance')
  timeSync: TimeSync = new TimeSync()
  amtPassword: AMTPassword = new AMTPassword()
  ipSync: SyncIP = new SyncIP()
  syncHostName: SyncHostName = new SyncHostName()
  error: Error = new Error()
  machine =
    createMachine<MaintenanceContext, MaintenanceEvent>({
      predictableActionArguments: true,
      preserveActionOrder: true,
      initial: 'PROVISIONED',
      context: {
        clientId: '',
        status: 'success',
        message: null,
        httpHandler: new HttpHandler(),
        xmlMessage: '',
        errorMessage: '',
        statusMessage: ''
      },
      states: {
        PROVISIONED: {
          on: {
            SYNCTIME: {
              actions: [assign({ clientId: (context, event) => event.clientId }), 'Reset Unauth Count'],
              target: 'SYNC_TIME'
            },
            CHANGEPASSWORD: {
              actions: [assign({
                clientId: (context, event) => event.clientId,
                message: (context, event) => event.data
              }), 'Reset Unauth Count'],
              target: 'CHANGE_PASSWORD'
            },
            SYNCIP: {
              actions: [assign({
                clientId: (context, event) => event.clientId,
                message: (context, event) => event.data
              }), 'Reset Unauth Count'],
              target: 'SYNC_IP_ADDRESS'
            },
            SYNCHOSTNAME: {
              actions: [assign({
                clientId: (context, event) => event.clientId,
                message: (context, event) => event.data
              })],
              target: 'SYNC_HOST_NAME'
            }
          }
        },
        SYNC_TIME: {
          entry: sendTo('time-machine', { type: 'TIMETRAVEL' }),
          invoke: {
            src: this.timeSync.machine,
            id: 'time-machine',
            data: {
              clientId: (context, event) => context.clientId
            },
            onDone: {
              actions: assign({ statusMessage: (context, event) => 'Time Synchronized' }),
              target: 'SUCCESS'
            },
            onError: 'ERROR'
          }
        },
        CHANGE_PASSWORD: {
          entry: sendTo('change-amt-password', { type: 'CHANGEPASSWORD' }),
          invoke: {
            src: this.amtPassword.machine,
            id: 'change-amt-password',
            data: {
              unauthCount: (context, event) => context.unauthCount,
              amtPassword: (context, event) => context.message,
              httpHandler: (context, event) => context.httpHandler,
              clientId: (context, event) => context.clientId
            },
            onDone: {
              actions: assign({ statusMessage: (context, event) => 'AMT Password Changed' }),
              target: 'SUCCESS'
            }
          },
          on: {
            ONFAILED: 'FAILURE'
          }
        },
        SYNC_IP_ADDRESS: {
          entry: sendTo('sync-ip-address', { type: 'SYNC_IP' }),
          invoke: {
            src: this.ipSync.machine,
            id: 'sync-ip-address',
            data: {
              unauthCount: (context, event) => context.unauthCount,
              ipConfiguration: (context, event) => context.message,
              httpHandler: (context, event) => context.httpHandler,
              clientId: (context, event) => context.clientId
            },
            onDone: {
              actions: assign({ statusMessage: (context, event) => 'IP Address Synchronized' }),
              target: 'SUCCESS'
            }
          },
          on: {
            ON_SYNCIP_FAILED: 'FAILURE'
          }
        },
        SYNC_HOST_NAME: {
          entry: sendTo('sync-hostname', { type: 'SYNCHOSTNAME' }),
          invoke: {
            data: {
              unauthCount: (context, event) => context.unauthCount,
              hostnameInfo: (context, event) => context.message,
              httpHandler: (context, event) => context.httpHandler,
              clientId: (context, event) => context.clientId
            },
            src: this.syncHostName.machine,
            id: 'sync-hostname',
            onDone: {
              actions: assign({ statusMessage: (context, event) => 'hostname updated' }),
              target: 'SUCCESS'
            },
            onError: 'ERROR'
          }
        },
        ERROR: {
          entry: sendTo('error-machine', { type: 'PARSE' }),
          invoke: {
            src: this.error.machine,
            id: 'error-machine',
            data: {
              unauthCount: (context, event) => context.unauthCount,
              message: (context, event) => event.data,
              clientId: (context, event) => context.clientId
            },
            onDone: 'SYNC_TIME' // To do: Need to test as it might not require anymore.
          },
          on: {
            ONFAILED: 'FAILURE'
          }
        },
        FAILURE: {
          entry: [
            assign({ status: (context, event) => 'error', errorMessage: (context, event) => event.data }),
            'Update Configuration Status',
            'Send Message to Device'
          ],
          type: 'final'
        },
        SUCCESS: {
          entry: ['Update Configuration Status', 'Send Message to Device'],
          type: 'final'
        }
      }
    }, {
      actions: {
        'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 },
        'Send Message to Device': (context, event) => { this.sendMessageToDevice(context, event) },
        'Update Configuration Status': this.updateConfigurationStatus.bind(this)
      }
    })

  constructor () {
    this.amt = new AMT.Messages()
  }

  service = interpret(this.machine).onTransition((state) => {
    console.log(`Current state of Maintenance State Machine: ${JSON.stringify(state.value)}`)
  }).onChange((data) => {
    console.log('ONCHANGE:')
    console.log(data)
  }).onDone((data) => {
    console.log('ONDONE:')
    console.log(data)
  })

  updateConfigurationStatus (context: MaintenanceContext): void {
    if (context.status === 'success') {
      devices[context.clientId].status.Status = context.statusMessage
    } else if (context.status === 'error') {
      devices[context.clientId].status.Status = context.errorMessage !== '' ? context.errorMessage : 'Failed'
    }
  }

  sendMessageToDevice (context: MaintenanceContext, event): void {
    const { clientId, status } = context
    const message = event?.data
    const clientObj = devices[clientId]
    let method: 'failed' | 'success' | 'ok' | 'heartbeat' = 'success' // TODO: Get rid of redundant data (i.e. Method and Status)
    if (status === 'success') {
      method = 'success'
    } else if (status === 'error') {
      clientObj.status.Status = message
      method = 'failed'
    }
    const responseMessage = ClientResponseMsg.get(clientId, null, status as any, method, JSON.stringify(clientObj.status))
    devices[clientId].ClientSocket.send(JSON.stringify(responseMessage))
  }
}
