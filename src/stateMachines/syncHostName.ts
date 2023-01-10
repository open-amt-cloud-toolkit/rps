/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine } from 'xstate'
import { HttpHandler } from '../HttpHandler'
import { invokeWsmanCall } from './common'
import Logger from '../Logger'
import { Error } from './error'
import { devices } from '../WebSocketListener'
import { EnvReader } from '../utils/EnvReader'
import { MqttProvider } from '../utils/MqttProvider'
import got from 'got'
import { send } from 'xstate/lib/actions'

export interface HostnameConfiguration {
  dnsSuffixOS: string
  hostname: string
}

interface SyncHostNameContext {
  message: any
  xmlMessage: string
  clientId: string
  status: string
  hostnameInfo: HostnameConfiguration
  statusMessage: string
  errorMessage: string
  httpHandler: HttpHandler
  generalSettings?: AMT.Models.GeneralSettings
}

interface SyncHostEvent {
  type: 'SYNCHOSTNAME' | 'ONFAILED'
  clientId: string
  data: any
}

export class SyncHostName {
  error: Error = new Error()
  logger = new Logger('sync-hostname')
  machine = createMachine<SyncHostNameContext, SyncHostEvent>({
    predictableActionArguments: true,
    context: {
      message: null,
      xmlMessage: '',
      clientId: '',
      status: '',
      statusMessage: '',
      errorMessage: '',
      httpHandler: new HttpHandler(),
      generalSettings: null,
      hostnameInfo: null
    },
    id: 'sync-hostname',
    initial: 'SYNC_HOSTNAME',
    states: {
      SYNC_HOSTNAME: {
        on: {
          SYNCHOSTNAME: {
            target: 'GET_GENERAL_SETTINGS'
          }
        }
      },
      GET_GENERAL_SETTINGS: {
        invoke: {
          src: this.getGeneralSettings.bind(this),
          id: 'get-general-settings',
          onDone: {
            actions: [assign({ generalSettings: (context, event) => event.data.Envelope.Body.AMT_GeneralSettings })],
            target: 'COMPARE_HOSTNAME_DNSSUFFIX'
          },
          onError: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'ERROR'
          }
        }
      },
      COMPARE_HOSTNAME_DNSSUFFIX: {
        always: [
          {
            cond: 'isHostNameMatching',
            target: 'SUCCESS'
          }, {
            target: 'UPDATE_AMT'
          }
        ]
      },
      UPDATE_AMT: {
        invoke: {
          src: this.updateAMT.bind(this),
          id: 'update-amt',
          onDone: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'SAVE_DEVICE_TO_MPS'
          },
          onError: {
            actions: assign({ statusMessage: (context, event) => 'Failed to update AMT with hostname' }),
            target: 'FAILED'
          }
        }
      },
      SAVE_DEVICE_TO_MPS: {
        invoke: {
          src: this.saveDeviceInfoToMPS.bind(this),
          id: 'save-device-to-mps',
          onDone: 'SUCCESS',
          onError: 'ERROR'
        }
      },
      ERROR: {
        entry: send({ type: 'PARSE' }, { to: 'error-machine' }),
        invoke: {
          src: this.error.machine,
          id: 'error-machine',
          data: {
            unauthCount: 0,
            message: (context, event) => event.data,
            clientId: (context, event) => context.clientId
          },
          onDone: 'GET_GENERAL_SETTINGS'
        },
        on: {
          ONFAILED: 'FAILED'
        }
      },
      FAILED: {
        entry: 'respondFailure',
        type: 'final'
      },
      SUCCESS: {
        type: 'final'
      }
    }
  }, {
    guards: {
      isHostNameMatching: (context, event) => this.compareHostName(context.hostnameInfo.hostname, context.generalSettings.HostName)
    },
    actions: {
    }
  })

  async getGeneralSettings (context): Promise<any> {
    const amt = new AMT.Messages()
    context.xmlMessage = amt.GeneralSettings(AMT.Methods.GET)
    return await invokeWsmanCall(context)
  }

  compareHostName (hostnameOS, hostNameGeneralSettings): boolean {
    return hostnameOS === hostNameGeneralSettings
  }

  async updateAMT (context: SyncHostNameContext): Promise<any> {
    const amt = new AMT.Messages()
    context.generalSettings.HostName = context.hostnameInfo.hostname
    context.xmlMessage = amt.GeneralSettings(AMT.Methods.PUT, context.generalSettings)
    return await invokeWsmanCall(context)
  }

  async saveDeviceInfoToMPS (context: SyncHostNameContext, event: SyncHostEvent): Promise<boolean> {
    const { clientId } = context
    const clientObj = devices[clientId]
    /* Register device metadata with MPS */
    try {
      await got(`${EnvReader.GlobalEnvConfig.mpsServer}/api/v1/devices`, {
        method: 'PATCH',
        json: {
          guid: clientObj.uuid,
          hostname: context.hostnameInfo.hostname,
          dnsSuffix: context.hostnameInfo.dnsSuffixOS
        }
      })
      return true
    } catch (err) {
      MqttProvider.publishEvent('fail', ['HostName'], 'unable to update hostname/dnsSuffix general setting with MPS', clientObj.uuid)
      this.logger.error('unable to update hostname/dnsSuffix general setting with MPS', err)
    }
    return false
  }
}
