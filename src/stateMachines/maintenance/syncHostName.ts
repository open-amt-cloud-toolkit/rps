/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine } from 'xstate'
import {
  coalesceMessage,
  commonContext,
  type CommonMaintenanceContext,
  HttpResponseError,
  invokeWsmanCall
} from './common'
import Logger from '../../Logger'
import * as Task from './doneResponse'
import { devices } from '../../WebSocketListener'
import got from 'got'
import { Environment } from '../../utils/Environment'

export interface HostNameInfo {
  dnsSuffixOS: string
  hostname: string
}

export const MessageMissingHostName = 'host name was not provided'
export const MessageAlreadySynchronized = 'host name already synchronized'

export interface SyncHostNameContext extends CommonMaintenanceContext {
  hostNameInfo: HostNameInfo
  generalSettings: AMT.Models.GeneralSettings
}

export const SyncHostNameEventType = 'SYNC_HOST_NAME'
export type SyncHostNameEvent = | { type: typeof SyncHostNameEventType, clientId: string, hostNameInfo: HostNameInfo }



const amt = new AMT.Messages()
const logger = new Logger('syncHostName')

export class SyncHostName {
  machine = createMachine({
    id: 'sync-host-name',
    types: {} as {
      context: SyncHostNameContext
      events: SyncHostNameEvent
      actions: any
    },
    context: {
      ...commonContext,
      taskName: 'synchostname',
      hostNameInfo: null,
      generalSettings: null
    },
    initial: 'INITIAL',
    states: {
      INITIAL: {
        on: {
          SYNC_HOST_NAME: {
            actions: assign({
              clientId: ({context, event}) => event.clientId,
              hostNameInfo: ({context, event}) => event.hostNameInfo
            }),
            target: 'GET_GENERAL_SETTINGS'
          }
        }
      },
      GET_GENERAL_SETTINGS: {
        invoke: {
          src: this.getGeneralSettings.bind(this),
          id: 'get-general-settings',
          onDone: {
            actions: assign({ generalSettings: ({context, event}) => event.data }),
            target: 'PUT_GENERAL_SETTINGS'
          },
          onError: {
            actions: assign({
              statusMessage: ({ event }) => coalesceMessage('at GET_GENERAL_SETTINGS', event.data)
            }),
            target: 'FAILED'
          }
        }
      },
      PUT_GENERAL_SETTINGS: {
        invoke: {
          src: this.putGeneralSettings.bind(this),
          id: 'put-host-name-info',
          onDone: {
            actions: assign({ statusMessage: ({event}) => event.data }),
            target: 'SAVE_TO_MPS'
          },
          onError: {
            actions: assign({
              statusMessage: ({event}) => coalesceMessage('at PUT_GENERAL_SETTINGS', event.data)
            }),
            target: 'FAILED'
          }
        }
      },
      SAVE_TO_MPS: {
        invoke: {
          src: this.saveToMPS.bind(this),
          id: 'save-to-mps',
          onDone: {
            actions: assign({ statusMessage: ({event}) => event.data }),
            target: 'SUCCESS'
          },
          onError: {
            actions: assign({
              statusMessage: ({event}) => coalesceMessage('at SAVE_TO_MPS', event.data)
            }),
            target: 'FAILED'
          }
        }
      },
      FAILED: {
        type: 'final',
        output: ({context}) => (Task.doneFail(context.taskName, context.statusMessage))
      },
      SUCCESS: {
        type: 'final',
        output: ({context}) => (Task.doneSuccess(context.taskName, context.statusMessage))
      }
    }
  })

  async getGeneralSettings (context: SyncHostNameContext): Promise<AMT.Models.GeneralSettings> {
    const wsmanXml = amt.GeneralSettings.Get()
    const rsp = await invokeWsmanCall<AMT.Models.GeneralSettingsResponse>(context.clientId, wsmanXml, 2)
    const settings = rsp.AMT_GeneralSettings
    if (!settings) {
      throw new Error('invalid response')
    }
    logger.debug(`AMT_GeneralSettings: ${JSON.stringify(settings)}`)
    return settings
  }

  async putGeneralSettings (context: SyncHostNameContext): Promise<AMT.Models.GeneralSettings> {
    let errMsg: string
    if (!context.hostNameInfo.hostname) {
      errMsg = MessageMissingHostName
    } else if (context.hostNameInfo.hostname === context.generalSettings.HostName) {
      errMsg = MessageAlreadySynchronized
    }
    if (errMsg) {
      throw new Error(`at put AMT_GeneralSettings ${errMsg}`)
    }
    const settingsToPut = {
      ...context.generalSettings,
      HostName: context.hostNameInfo.hostname
    }
    const wsmanXml = amt.GeneralSettings.Put(settingsToPut)
    const rsp = await invokeWsmanCall<AMT.Models.GeneralSettingsResponse>(context.clientId, wsmanXml, 2)
    if (!rsp.AMT_GeneralSettings) {
      throw new Error(`invalid response: ${JSON.stringify(rsp)}`)
    }
    logger.debug(`AMT_GeneralSettings: ${JSON.stringify(rsp.AMT_GeneralSettings)}`)
    return rsp.AMT_GeneralSettings
  }

  async saveToMPS (context: SyncHostNameContext): Promise<string> {
    const clientObj = devices[context.clientId]
    const url = `${Environment.Config.mps_server}/api/v1/devices`
    const jsonData = {
      guid: clientObj.uuid,
      hostname: context.hostNameInfo.hostname,
      dnsSuffix: context.hostNameInfo.dnsSuffixOS
    }
    const rsp = await got.patch(url, { json: jsonData })
    if (rsp.statusCode !== 200) {
      throw new HttpResponseError(rsp.statusMessage, rsp.statusCode)
    }
    logger.debug(`savedToMPS ${JSON.stringify(jsonData)}`)
    return context.hostNameInfo.hostname
  }
}
