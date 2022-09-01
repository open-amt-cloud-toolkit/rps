import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { createMachine, interpret, send, assign } from 'xstate'
import { HttpHandler } from '../HttpHandler'
import Logger from '../Logger'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { devices } from '../WebSocketListener'
import { Error } from './error'

export interface MaintenanceContext {
  message: any
  xmlMessage: string
  errorMessage: string
  statusMessage: string
  clientId: string
  httpHandler: HttpHandler
  status: 'success' | 'error' | ''
}

interface MaintenanceEvent {
  type: 'SYNCCLOCK' | 'ONFAILED'
  clientId: string
  data?: any
}/*  */

export class Maintenance {
  responseMsg: ClientResponseMsg
  amt: AMT.Messages
  logger: Logger
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
          SYNCCLOCK: {
            actions: [assign({ clientId: (context, event) => event.clientId }), 'Reset Unauth Count'],
            target: 'GET_LOW_ACCURACY_TIME_SYNCH'
          }
        }
      },
      GET_LOW_ACCURACY_TIME_SYNCH: {
        invoke: {
          id: 'get-low-accuracy-time-synch',
          src: this.getLowAccuracyTimeSynch.bind(this),
          onDone: [{
            actions: assign({ message: (context, event) => event.data }),
            target: 'GET_LOW_ACCURACY_TIME_SYNCH_RESPONSE'
          }],
          onError: {
            actions: assign({
              message: (context, event) => event.data
            }),
            target: 'ERROR'
          }
        }
      },
      GET_LOW_ACCURACY_TIME_SYNCH_RESPONSE: {
        always: [{
          cond: 'isGetLowAccuracyTimeSynchSuccessful',
          target: 'SET_HIGH_ACCURACY_TIME_SYNCH'
        }, {
          actions: assign({
            message: (context, event) => event.data,
            errorMessage: 'Failed to GET_LOW_ACCURACY_TIME_SYNC'
          }),
          target: 'FAILURE'
        }]
      },
      SET_HIGH_ACCURACY_TIME_SYNCH: {
        invoke: {
          id: 'set-high-accuracy-time-synch',
          src: this.setHighAccuracyTimeSynch.bind(this),
          onDone: [{
            actions: assign({ message: (context, event) => event.data }),
            target: 'SET_HIGH_ACCURACY_TIME_SYNCH_RESPONSE'
          }],
          onError: {
            actions: assign({
              message: (context, event) => event.data,
              errorMessage: 'Failed to SET_HIGH_ACCURACY_TIME_SYNCH'
            }),
            target: 'FAILURE'
          }
        }
      },
      SET_HIGH_ACCURACY_TIME_SYNCH_RESPONSE: {
        always: [{
          cond: 'isSetHighAccuracyTimeSynchSuccessful',
          target: 'SUCCESS'
        }, {
          actions: assign({
            message: (context, event) => event.data,
            errorMessage: 'Failed to SET_HIGH_ACCURACY_TIME_SYNCH'
          }),
          target: 'FAILURE'
        }]
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
          onDone: 'GET_LOW_ACCURACY_TIME_SYNCH' // To do: Need to test as it might not require anymore.
        },
        on: {
          ONFAILED: 'FAILURE'
        }
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
    guards: {
      isGetLowAccuracyTimeSynchSuccessful: (context, event) => {
        return context.message.Envelope.Body?.GetLowAccuracyTimeSynch_OUTPUT?.ReturnValue === 0
      },
      isSetHighAccuracyTimeSynchSuccessful: (context, event) => context.message.Envelope.Body?.SetHighAccuracyTimeSynch_OUTPUT?.ReturnValue === 0
    },
    actions: {
      'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 },
      'Send Message to Device': (context, event) => this.sendMessageToDevice(context, event),
      'Update Configuration Status': this.updateConfigurationStatus.bind(this)
    }
  })

  constructor () {
    this.amt = new AMT.Messages()
    this.responseMsg = new ClientResponseMsg()
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

  async getLowAccuracyTimeSynch (context: MaintenanceContext): Promise<void> {
    context.xmlMessage = this.amt.TimeSynchronizationService(AMT.Methods.GET_LOW_ACCURACY_TIME_SYNCH)
    return await this.invokeWsmanCall(context)
  }

  async setHighAccuracyTimeSynch (context: MaintenanceContext): Promise<void> {
    const Tm1 = Math.round(new Date().getTime() / 1000)
    const Ta0 = context.message.Envelope.Body.GetLowAccuracyTimeSynch_OUTPUT.Ta0
    context.xmlMessage = this.amt.TimeSynchronizationService(AMT.Methods.SET_HIGH_ACCURACY_TIME_SYNCH, Ta0, Tm1, Tm1)
    return await this.invokeWsmanCall(context)
  }

  updateConfigurationStatus (context: MaintenanceContext): void {
    if (context.status === 'success') {
      devices[context.clientId].status.Status = context.statusMessage
    } else if (context.status === 'error') {
      devices[context.clientId].status.Status = context.errorMessage !== '' ? context.errorMessage : 'Failed'
    }
  }

  async invokeWsmanCall (context: MaintenanceContext): Promise<any> {
    let { message, clientId, xmlMessage } = context
    const clientObj = devices[clientId]
    message = context.httpHandler.wrapIt(xmlMessage, clientObj.connectionParams)
    const responseMessage = this.responseMsg.get(clientId, message, 'wsman', 'ok')
    devices[clientId].ClientSocket.send(JSON.stringify(responseMessage))
    clientObj.pendingPromise = new Promise<any>((resolve, reject) => {
      clientObj.resolve = resolve
      clientObj.reject = reject
    })
    return await clientObj.pendingPromise
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
    const responseMessage = this.responseMsg.get(clientId, null, status as any, method, JSON.stringify(clientObj.status))
    devices[clientId].ClientSocket.send(JSON.stringify(responseMessage))
  }
}
