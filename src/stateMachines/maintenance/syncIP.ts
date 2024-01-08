/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { assign, createMachine } from 'xstate'
import {
  coalesceMessage,
  commonActions,
  commonContext,
  commonGuards,
  type CommonMaintenanceContext,
  type EnumerationContext,
  invokeWsmanCall
} from './common'
import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { type Enumerate, type Pull } from '@open-amt-cloud-toolkit/wsman-messages/models/common'
import * as Task from './doneResponse'
import Logger from '../../Logger'

export type EthernetPortSettingsPullResponse = Pull<{
  AMT_EthernetPortSettings: AMT.Models.EthernetPortSettings | AMT.Models.EthernetPortSettings[]
}>

export const MessageNoWiredSettingsOnDevice = 'Device has no wired configuration settings'
export const MessageWirelessOnly = 'Not applicable for wireless only device'
export const MessageAlreadySynchronized = 'IPAddress already synchronized'

export interface IPConfiguration {
  ipAddress: string
  netmask: string
  gateway: string
  primaryDns: string
  secondaryDns: string
}

export interface SyncIPContext extends CommonMaintenanceContext {
  targetIPConfig: IPConfiguration
  enumerationContext: EnumerationContext
  parseErrorCount: number
  wiredSettings: AMT.Models.EthernetPortSettings
  wirelessSettings: AMT.Models.EthernetPortSettings
}

export const SyncIPEventType = 'SYNC_IP'
export type SyncIPEvent =
  | { type: typeof SyncIPEventType, clientId: string, targetIPConfig: IPConfiguration }

class PullData {
  wiredSettings: AMT.Models.EthernetPortSettings
  wirelessSettings: AMT.Models.EthernetPortSettings
}

export const amt = new AMT.Messages()
const logger = new Logger('syncIP')

export class SyncIP {
  machine = createMachine({
    id: 'sync-ip',
    types: {} as {
      context: SyncIPContext
      events: SyncIPEvent
      actions: any
    },
    context: {
      ...commonContext,
      taskName: 'syncip',
      targetIPConfig: null,
      enumerationContext: '',
      parseErrorCount: 0,
      wiredSettings: null,
      wirelessSettings: null
    },
    initial: 'INITIAL',
    states: {
      INITIAL: {
        on: {
          SYNC_IP: [
            {
              guard: ({ context, event }) => !event.targetIPConfig?.ipAddress,
              actions: assign({
                statusMessage: 'at INITIAL invalid ip configuration'
              }),
              target: 'FAILED'
            },
            {
              actions: assign({
                clientId: ({ context, event }) => event.clientId,
                targetIPConfig: ({ context, event }) => event.targetIPConfig
              }),
              target: 'ENUMERATE_ETHERNET_PORT_SETTINGS'
            }
          ]
        }
      },
      ENUMERATE_ETHERNET_PORT_SETTINGS: {
        invoke: {
          id: 'enumerate-ethernet-port-settings',
          src: this.enumerateEthernetPortSettings.bind(this),
          onDone: {
            actions: assign({ enumerationContext: ({ context, event }) => event.data }),
            target: 'PULL_ETHERNET_PORT_SETTINGS'
          },
          onError: {
            actions: assign({
              statusMessage: ({event}) => coalesceMessage('at ENUMERATE_ETHERNET_PORT_SETTINGS', event.data)
            }),
            target: 'FAILED'
          }
        }
      },
      PULL_ETHERNET_PORT_SETTINGS: {
        invoke: {
          id: 'pull-ethernet-port-settings',
          src: this.pullEthernetPortSettings.bind(this),
          onDone: {
            actions: assign(({ context, event }) => ({
              wiredSettings: event.data.wiredSettings,
              wirelessSettings: event.data.wirelessSettings
            })),
            target: 'PUT_ETHERNET_PORT_SETTINGS'
          },
          onError: [
            {
              guard: 'shoudRetryOnParseError',
              actions: 'incrementParseErrorCount',
              target: 'ENUMERATE_ETHERNET_PORT_SETTINGS'
            },
            {
              actions: [
                'resetParseErrorCount',
                assign({
                  statusMessage: ({event}) =>
                    coalesceMessage('at PULL_ETHERNET_PORT_SETTINGS', event.data)
                })
              ],
              target: 'FAILED'
            }
          ]
        }
      },
      PUT_ETHERNET_PORT_SETTINGS: {
        invoke: {
          src: this.putEthernetPortSettings.bind(this),
          id: 'put-ethernet-port-settings',
          onDone: {
            actions: assign({ statusMessage: ({ event }) => event.data }),
            target: 'SUCCESS'
          },
          onError: {
            actions: assign({
              statusMessage: ({ event }) => coalesceMessage('at PUT_ETHERNET_PORT_SETTINGS', event.data)
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
  }, {
    actions: {
      ...commonActions
    },
    guards: {
      ...commonGuards
    }
  })

  async enumerateEthernetPortSettings (context: SyncIPContext): Promise<EnumerationContext> {
    const wsmanXml = amt.EthernetPortSettings.Enumerate()
    const rsp = await invokeWsmanCall<Enumerate>(context.clientId, wsmanXml, 2)
    const enumCtx = rsp.EnumerateResponse?.EnumerationContext
    if (!enumCtx) { throw new Error(`invalid response: ${JSON.stringify(rsp)}`) }
    logger.debug(`EnumerationContext: ${enumCtx}`)
    return enumCtx
  }

  async pullEthernetPortSettings (context: SyncIPContext): Promise<PullData> {
    const wsmanXml = amt.EthernetPortSettings.Pull(context.enumerationContext)
    const rsp = await invokeWsmanCall<EthernetPortSettingsPullResponse>(context.clientId, wsmanXml)
    const settings = rsp.PullResponse?.Items?.AMT_EthernetPortSettings
    if (!settings) {
      throw new Error(`invalid response: ${JSON.stringify(rsp)}`)
    }
    const pullData: PullData = {
      wiredSettings: null,
      wirelessSettings: null
    }
    // settings might be a single entry or an array
    // set it up for processing as an array
    let settingsArray: any[]
    if (!Array.isArray(settings)) {
      settingsArray = [settings]
    } else {
      settingsArray = settings
    }
    // In Intel AMT Release 6.0 and later releases InstanceId value is
    // 'Intel(r) AMT Ethernet Port Settings 0' for wired instance
    // 'Intel(r) AMT Ethernet Port Settings 1' for wireless instance
    settingsArray.forEach(e => {
      if (e.InstanceID.includes('Settings 0')) {
        pullData.wiredSettings = e
      }
      if (e.InstanceID.includes('Settings 1')) {
        pullData.wirelessSettings = e
      }
    })
    logger.debug(`EthernetPortSettings: ${JSON.stringify(pullData)}`)
    return pullData
  }

  async putEthernetPortSettings (context: SyncIPContext): Promise<string> {
    let statusMessage: string
    if (!context.wiredSettings) {
      statusMessage = MessageNoWiredSettingsOnDevice
    } else if (context.wirelessSettings != null && context.wiredSettings.MACAddress == null) {
      statusMessage = MessageWirelessOnly
    } else if (context.wiredSettings.IPAddress === context.targetIPConfig.ipAddress) {
      statusMessage = MessageAlreadySynchronized
    }
    if (statusMessage) {
      const err = new Error(statusMessage)
      return await new Promise<string>((resolve, reject) => { reject(err) })
    }

    // preserve what is in the context
    const settingsToPut = {
      ...context.wiredSettings
    }
    if (context.wiredSettings.DHCPEnabled) {
      settingsToPut.IpSyncEnabled = true
      settingsToPut.SharedStaticIp = false
      settingsToPut.IPAddress = null
      settingsToPut.SubnetMask = null
      settingsToPut.DefaultGateway = null
      settingsToPut.PrimaryDNS = null
      settingsToPut.SecondaryDNS = null
    } else {
      settingsToPut.IpSyncEnabled = false
      settingsToPut.SharedStaticIp = false
      settingsToPut.IPAddress = context.targetIPConfig.ipAddress
      settingsToPut.SubnetMask = context.targetIPConfig.netmask || settingsToPut.SubnetMask
      settingsToPut.DefaultGateway = context.targetIPConfig.gateway || settingsToPut.DefaultGateway
      settingsToPut.PrimaryDNS = context.targetIPConfig.primaryDns || settingsToPut.PrimaryDNS
      settingsToPut.SecondaryDNS = context.targetIPConfig.secondaryDns || settingsToPut.SecondaryDNS
    }

    logger.debug(`putting wired settings: ${JSON.stringify(settingsToPut)}`)
    const wsmanXml = amt.EthernetPortSettings.Put(settingsToPut)
    const rsp = await invokeWsmanCall<AMT.Models.EthernetPortSettings>(context.clientId, wsmanXml)
    if (!rsp) {
      throw new Error(`invalid response: ${JSON.stringify(rsp)}`)
    }
    // interestingly, the ipAddress that was put is not in the response
    return context.targetIPConfig.ipAddress
  }
}
