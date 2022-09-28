import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { createMachine, interpret, send, assign } from 'xstate'
import { HttpHandler } from '../HttpHandler'
import Logger from '../Logger'
import ClientResponseMsg from '../utils/ClientResponseMsg'

import { devices } from '../WebSocketListener'
import { Error } from './error'
import { TimeSync } from './timeMachine'
import { invokeWsmanCall } from './common'
import { WiredConfiguration } from './wiredConfiguration'

export interface MaintenanceContext {
  message: any
  xmlMessage: string
  errorMessage: string
  statusMessage: string
  clientId: string
  httpHandler: HttpHandler
  status: 'success' | 'error' | ''
  generalSettings?: AMT.Models.GeneralSettings
  targetAfterError: string
}

interface MaintenanceEvent {
  type: 'SYNCCLOCK' | 'SYNCNETWORK' | 'ONFAILED'
  clientId: string
  data?: any
}/*  */

export class Maintenance {
  amt: AMT.Messages
  logger: Logger
  timeSync: TimeSync = new TimeSync()
  error: Error = new Error()
  wiredConfiguration: WiredConfiguration = new WiredConfiguration()
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
        statusMessage: '',
        targetAfterError: null
      },
      states: {
        PROVISIONED: {
          on: {
            SYNCCLOCK: {
              actions: [assign({ clientId: (context, event) => event.clientId }), 'Reset Unauth Count'],
              target: 'SYNC_TIME'
            },
            SYNCNETWORK: {
              actions: [assign({ clientId: (context, event) => event.clientId }), 'Reset Unauth Count'],
              target: 'GET_GENERAL_SETTINGS'
            }
          }
        },
        SYNC_TIME: {
          entry: send({ type: 'TIMETRAVEL' }, { to: 'time-machine' }),
          invoke: {
            src: this.timeSync.machine,
            id: 'time-machine',
            data: {
              clientId: (context, event) => context.clientId
            },
            onDone: 'SUCCESS',
            onError: {
              actions: assign({ message: (context, event) => event.data, targetAfterError: (context, event) => 'SYNC_TIME' }),
              target: 'ERROR'
            }
          }
        },
        GET_GENERAL_SETTINGS: {
          invoke: {
            src: this.getGeneralSettings.bind(this),
            id: 'send-generalsettings',
            onDone: {
              actions: [assign({ generalSettings: (context, event) => event.data.Envelope.Body.AMT_GeneralSettings }), 'Reset Unauth Count'],
              target: 'WIRED_CONFIGURATION'
            },
            onError: {
              actions: assign({ message: (context, event) => event.data, targetAfterError: (context, event) => 'GET_GENERAL_SETTINGS' }),
              target: 'ERROR'
            }
          }
        },
        WIRED_CONFIGURATION: {
          entry: send({ type: 'WIRED_CONFIGURATION' }, { to: 'wired-network-configuration-machine' }),
          invoke: {
            src: this.wiredConfiguration.machine,
            id: 'wired-network-configuration-machine',
            data: {
              amtProfile: (context, event) => context.profile,
              generalSettings: (context, event) => context.generalSettings,
              clientId: (context, event) => context.clientId,
              httpHandler: (context, _) => context.httpHandler,
              amt: (context, event) => context.amt,
              cim: (context, event) => context.cim
            },
            onDone: 'FEATURES_CONFIGURATION'
          },
          on: {
            ONFAILED: 'FAILED'
          }
        },
        ERROR: {
          entry: send({ type: 'PARSE' }, { to: 'error-machine' }),
          invoke: {
            src: this.error.machine,
            id: 'error-machine',
            data: {
              unauthCount: (context, event) => context.unauthCount,
              message: (context, event) => event.data,
              clientId: (context, event) => context.clientId
            },
            onDone: 'NEXT_STATE' // To do: Need to test as it might not require anymore.
          },
          on: {
            ONFAILED: 'FAILURE'
          }
        },
        NEXT_STATE: {
          always: [
            {
              cond: 'isGeneralSettings',
              target: 'GET_GENERAL_SETTINGS'
            }, {
              cond: 'isSyncTime',
              target: 'SYNC_TIME'
            }]
        },
        FAILURE: {
          entry: [assign({ status: (context, event) => 'error' }), 'Update Configuration Status', 'Send Message to Device'],
          type: 'final'
        },
        SUCCESS: {
          entry: [assign({ statusMessage: (context, event) => 'Time Synchronized' }), 'Update Configuration Status', 'Send Message to Device'],
          type: 'final'
        }
      }
    }, {
      actions: {
        'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 },
        'Send Message to Device': (context, event) => this.sendMessageToDevice(context, event),
        'Update Configuration Status': this.updateConfigurationStatus.bind(this)
      },
      guards: {
        isGeneralSettings: (context, event) => context.targetAfterError === 'GET_GENERAL_SETTINGS',
        isSyncTime: (context, event) => context.targetAfterError === 'SYNC_TIME'
      }
    })

  constructor() {
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

  async getGeneralSettings(context): Promise<any> {
    context.xmlMessage = context.amt.GeneralSettings(AMT.Methods.GET)
    return await invokeWsmanCall(context)
  }

  updateConfigurationStatus(context: MaintenanceContext): void {
    if (context.status === 'success') {
      devices[context.clientId].status.Status = context.statusMessage
    } else if (context.status === 'error') {
      devices[context.clientId].status.Status = context.errorMessage !== '' ? context.errorMessage : 'Failed'
    }
  }

  sendMessageToDevice(context: MaintenanceContext, event): void {
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
