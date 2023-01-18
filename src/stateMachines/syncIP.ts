/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine } from 'xstate'
import { pure, sendParent, send } from 'xstate/lib/actions'
import { HttpHandler } from '../HttpHandler'
import { invokeWsmanCall } from './common'
import Logger from '../Logger'
import { Error } from './error'
export interface IPConfiguration {
  ipAddress: string
  netmask: string
  gateway: string
  primaryDns: string
  secondaryDns: string
}
interface SyncIPContext {
  message: any
  xmlMessage: string
  clientId: string
  status: string
  ipConfiguration?: IPConfiguration
  statusMessage: string
  errorMessage: string
  httpHandler: HttpHandler
  wiredSettings: any
  wirelessSettings: any
  isIPSynchronized: boolean
}

interface SyncIPEvent {
  type: 'SYNC_IP' | 'ONFAILED'
  clientId: string
  data: any
}

export class SyncIP {
  error: Error = new Error()
  logger = new Logger('Sync_ip-address')
  machine = createMachine<SyncIPContext, SyncIPEvent>({
    predictableActionArguments: true,
    context: {
      message: null,
      xmlMessage: '',
      clientId: '',
      status: '',
      statusMessage: '',
      errorMessage: '',
      wiredSettings: null,
      wirelessSettings: null,
      httpHandler: new HttpHandler(),
      isIPSynchronized: false
    },
    id: 'sync-ip-address',
    initial: 'OS_SYNC_IP',
    states: {
      OS_SYNC_IP: {
        on: {
          SYNC_IP: {
            target: 'ENUMERATE_ETHERNET_PORT_SETTINGS'
          }
        }
      },
      ENUMERATE_ETHERNET_PORT_SETTINGS: {
        invoke: {
          src: this.enumerateEthernetPortSettings.bind(this),
          id: 'enumerate-ethernet-port-settings',
          onDone: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'PULL_ETHERNET_PORT_SETTINGS'
          },
          onError: {
            actions: assign({ statusMessage: (context, event) => 'Failed to get enumeration number to ethernet port settings' }),
            target: 'ERROR'
          }
        }
      },
      PULL_ETHERNET_PORT_SETTINGS: {
        invoke: {
          src: this.pullEthernetPortSettings.bind(this),
          id: 'pull-ethernet-port-settings',
          onDone: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'CHECK_ETHERNET_PORT_SETTINGS_PULL_RESPONSE'
          },
          onError: {
            actions: assign({ statusMessage: (context, event) => 'Failed to pull to ethernet port settings' }),
            target: 'FAILED'
          }
        }
      },
      CHECK_ETHERNET_PORT_SETTINGS_PULL_RESPONSE: {
        entry: 'Read Ethernet Port Settings',
        always: [
          {
            cond: 'isWirelessOnlyDevice',
            actions: assign({ statusMessage: (context, event) => 'Not applicable for wireless only device' }),
            target: 'FAILED'
          }, {
            cond: 'isNotSharedStaticIp',
            actions: assign({ statusMessage: (context, event) => 'Not applicable' }),
            target: 'FAILED'
          },
          {
            cond: 'isNotIPAddressMatched',
            target: 'PUT_ETHERNET_PORT_SETTINGS'
          }, {
            actions: assign({ statusMessage: (context, event) => 'IPAddress already Synchronized' }),
            target: 'SUCCESS'
          }
        ]
      },
      PUT_ETHERNET_PORT_SETTINGS: {
        invoke: {
          src: this.putEthernetPortSettings.bind(this),
          id: 'put-ethernet-port-settings',
          onDone: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'SUCCESS'
          },
          onError: {
            actions: assign({ statusMessage: (context, event) => 'Failed to put to ethernet port settings' }),
            target: 'FAILED'
          }
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
          onDone: 'ENUMERATE_ETHERNET_PORT_SETTINGS'
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
      isWirelessOnlyDevice: (context: SyncIPContext) => context.wirelessSettings != null && context.wiredSettings?.MACAddress == null,
      isNotSharedStaticIp: (context: SyncIPContext) => context.wiredSettings.DHCPEnabled === true && context.wiredSettings.SharedStaticIp !== true,
      isNotIPAddressMatched: (context: SyncIPContext) => context.wiredSettings.IPAddress !== context.ipConfiguration.ipAddress,
      isNotIPSyncEnabled: (context: SyncIPContext) => context.wiredSettings.IpSyncEnabled !== true && context.isIPSynchronized
    },
    actions: {
      respondFailure: pure((context: SyncIPContext) => sendParent({ type: 'ON_SYNC_NETWORK_FAILED', data: context.statusMessage })),
      'Read Ethernet Port Settings': this.readEthernetPortSettings.bind(this)
    }
  })

  async enumerateEthernetPortSettings (context: SyncIPContext): Promise<any> {
    const amt = new AMT.Messages()
    context.xmlMessage = amt.EthernetPortSettings(AMT.Methods.ENUMERATE)
    this.logger.info(context.xmlMessage)
    return await invokeWsmanCall(context)
  }

  async pullEthernetPortSettings (context: SyncIPContext): Promise<any> {
    const amt = new AMT.Messages()
    context.xmlMessage = amt.EthernetPortSettings(AMT.Methods.PULL, context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    this.logger.info(context.xmlMessage)
    return await invokeWsmanCall(context)
  }

  readEthernetPortSettings (context: SyncIPContext): void {
    // As per AMT SDK first entry is WIRED network port and second entry is WIRELESS
    const pullResponse = context.message.Envelope.Body.PullResponse.Items.AMT_EthernetPortSettings
    if (Array.isArray(pullResponse)) {
      if (pullResponse[0].InstanceID.includes('Settings 0')) {
        context.wiredSettings = pullResponse[0]
      } else if (pullResponse[0].InstanceID.includes('Settings 1')) {
        context.wirelessSettings = pullResponse[0]
      }

      if (pullResponse[1].InstanceID.includes('Settings 0')) {
        context.wiredSettings = pullResponse[1]
      } else if (pullResponse[1].InstanceID.includes('Settings 1')) {
        context.wirelessSettings = pullResponse[1]
      }
    } else {
      if (pullResponse.InstanceID.includes('Settings 0')) {
        context.wiredSettings = pullResponse
      } else if (pullResponse.InstanceID.includes('Settings 1')) {
        context.wirelessSettings = pullResponse
      }
    }
  }

  async putEthernetPortSettings (context: SyncIPContext): Promise<any> {
    if (context.wiredSettings.SharedStaticIp === true) {
      if (context.wiredSettings.IpSyncEnabled === true) {
        context.wiredSettings.IpSyncEnabled = false
      }
      context.wiredSettings.SubnetMask = context.ipConfiguration.netmask || context.wiredSettings.SubnetMask
      context.wiredSettings.DefaultGateway = context.ipConfiguration.gateway || context.wiredSettings.DefaultGateway
      context.wiredSettings.IPAddress = context.ipConfiguration.ipAddress
      context.wiredSettings.PrimaryDNS = context.ipConfiguration.primaryDns || context.wiredSettings.PrimaryDNS
      context.wiredSettings.SecondaryDNS = context.ipConfiguration.secondaryDns || context.wiredSettings.SecondaryDNS
    }
    const amt = new AMT.Messages()
    context.xmlMessage = amt.EthernetPortSettings(AMT.Methods.PUT, null, context.wiredSettings)
    return await invokeWsmanCall(context)
  }
}
