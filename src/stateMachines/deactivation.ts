import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine, interpret } from 'xstate'
import { send } from 'xstate/lib/actions'
import { Configurator } from '../Configurator'
import { HttpHandler } from '../HttpHandler'
import Logger from '../Logger'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { EnvReader } from '../utils/EnvReader'
import { devices } from '../WebSocketListener'
import { Error } from './error'
import got from 'got'

interface DeactivationContext {
  message: any
  clientId: string
  status: 'success' | 'error' | ''
}

interface DeactivationEvent {
  type: 'UNPROVISION' | 'ONFAILED'
  clientId: string
}
export class Deactivation {
  responseMsg: ClientResponseMsg
  configurator: Configurator
  httpHandler: HttpHandler
  amt: AMT.Messages
  logger: Logger
  error: Error = new Error()
  machine =
  createMachine<DeactivationContext, DeactivationEvent>({
    predictableActionArguments: true,
    preserveActionOrder: true,
    context: { message: '', clientId: '', status: '' },
    id: 'Deactivation Machine',
    initial: 'PROVISIONED',
    states: {
      PROVISIONED: {
        on: {
          UNPROVISION: {
            actions: [assign({ clientId: (context, event) => event.clientId }), 'Reset Unauth Count'],
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
          onError: 'REMOVE_DEVICE_FROM_SECRET_PROVIDER_FAILURE'
        }
      },
      REMOVE_DEVICE_FROM_MPS: {
        invoke: {
          src: this.removeDeviceFromMPS.bind(this),
          id: 'remove-device-from-mps',
          onDone: 'UNPROVISIONED',
          onError: 'REMOVE_DEVICE_FROM_MPS_FAILURE'
        }
      },
      REMOVE_DEVICE_FROM_SECRET_PROVIDER_FAILURE: {
        entry: assign({ errorMessage: 'Failed to remove device from secret provider' }),
        always: 'FAILED'
      },
      REMOVE_DEVICE_FROM_MPS_FAILURE: {
        entry: assign({ errorMessage: 'Failed to remove device from MPS' }),
        always: 'FAILED'
      },
      UNPROVISIONED: {
        type: 'final',
        entry: [assign({ status: (context, event) => 'success' }), 'Send Message to Device']
      },
      ERROR: {
        invoke: {
          id: 'error-machine',
          src: this.error.machine,
          data: {
            unauthCount: (context, event) => context.unauthCount,
            message: (context, event) => event.data,
            clientId: (context, event) => context.clientId
          },
          onDone: [{
            target: 'UNPROVISIONING'
          }],
          onError: 'FAILED'
        },
        entry: send({ type: 'PARSE' }, { to: 'error-machine' }),
        on: {
          ONFAILED: 'FAILED'
        }
      },
      FAILED: {
        entry: [assign({ status: 'error' }), 'Send Message to Device'],
        type: 'final'
      }
    }
  }, {
    actions: {
      'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 },
      'Send Message to Device': (context, event) => this.sendMessageToDevice(context, event)
    }
  })

  service = interpret(this.machine).onTransition((state) => {
    console.log(`Current state of Deactivation State Machine: ${JSON.stringify(state.value)}`)
    // console.log(state.children['error-machine'])
  }).onChange((data) => {
    console.log('ONCHANGE:')
    console.log(data)
  }).onDone((data) => {
    console.log('ONDONE:')
    console.log(data)
  })

  constructor () {
    this.responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
    this.httpHandler = new HttpHandler()
    this.configurator = new Configurator()
    this.amt = new AMT.Messages()
    this.logger = new Logger('Deactivation_State_Machine')
  }

  async removeDeviceFromSecretProvider (context, event): Promise<any> {
    return await this.configurator.amtDeviceRepository.delete(devices[context.clientId].uuid)
  }

  async removeDeviceFromMPS (context, event): Promise<any> {
    await got(`${EnvReader.GlobalEnvConfig.mpsServer}/api/v1/devices/${devices[context.clientId].uuid}`, {
      method: 'DELETE'
    })
  }

  async invokeUnprovision (context): Promise<any> {
    let { message, clientId } = context
    const clientObj = devices[clientId]
    const xmlRequestBody = this.amt.SetupAndConfigurationService(AMT.Methods.UNPROVISION, null, 2)
    message = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    this.logger.debug(`Unprovisioning message to AMT ${clientObj.uuid} : ${message}`)
    const responseMessage = this.responseMsg.get(clientId, message, 'wsman', 'ok')
    devices[clientId].ClientSocket.send(JSON.stringify(responseMessage))
    clientObj.pendingPromise = new Promise<any>((resolve, reject) => {
      clientObj.resolve = resolve
      clientObj.reject = reject
    })
    return await clientObj.pendingPromise
  }

  sendMessageToDevice (context, event): void {
    const { clientId, status } = context
    const message = event?.data
    const clientObj = devices[clientId]
    let method: 'failed' | 'success' | 'ok' | 'heartbeat' = 'success' // TODO: Get rid of redundant data (i.e. Method and Status)
    if (status === 'success') {
      clientObj.status.Status = 'Deactivated'
      method = 'success'
    } else if (status === 'error') {
      clientObj.status.Status = message
      method = 'failed'
    }
    const responseMessage = this.responseMsg.get(clientId, null, status, method, JSON.stringify(clientObj.status))
    devices[clientId].ClientSocket.send(JSON.stringify(responseMessage))
  }
}
