/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMT, type CIM } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine, sendTo } from 'xstate'
import { type HttpHandler } from '../HttpHandler.js'
import Logger from '../Logger.js'
import { type AMTConfiguration } from '../models/index.js'
import { devices } from '../devices.js'
import { Error } from './error.js'
import { Configurator } from '../Configurator.js'
import { DbCreatorFactory } from '../factories/DbCreatorFactory.js'
import { invokeWsmanCall } from './common.js'
import { UNEXPECTED_PARSE_ERROR } from '../utils/constants.js'
import { WiredConfiguration } from './wiredNetworkConfiguration.js'
import { WiFiConfiguration } from './wifiNetworkConfiguration.js'

interface NetworkConfigContext {
  amtProfile: AMTConfiguration | null
  message: any
  clientId: string
  xmlMessage: any
  errorMessage: string
  generalSettings: AMT.Models.GeneralSettings | null
  wiredSettings: any
  wifiSettings: any
  httpHandler: HttpHandler | null
  amt?: AMT.Messages
  cim?: CIM.Messages
  retryCount: number
}

interface NetworkConfigEvent {
  type: 'NETWORKCONFIGURATION' | 'ONFAILED'
  clientId: string
  data?: any
}
export class NetworkConfiguration {
  configurator: Configurator
  logger: Logger
  dbFactory: DbCreatorFactory
  db: any
  error: Error = new Error()
  wiredConfiguration: WiredConfiguration = new WiredConfiguration()
  wifiConfiguration: WiFiConfiguration = new WiFiConfiguration()

  machine =
    /** @xstate-layout N4IgpgJg5mDOIC5QEMDGAXAlgN2Vg9gHYC0AtmgBaaFgB0AqgHIAKASgPIBqAkgMrftGAUQAiAYgCCAYQAq3ThLmDEoAA75YmAoRUgAHogCMAVgDMABlrGATADZzt6+cOGA7IYAcHgDQgAnogALB7WtACcjubmxrYm1qaBgQC+Sb5oWLjaZJTUdADiQjIA+gXCrBIAMkW8hXKMebxiEER01Nj4ANZ0sGCEEMQwNABOyAA2PehYhFDwSCDqmtq6BghOgca0HoaBtmGudjHWxr4BCLGutNYers6uIdYHtilpGDh4mETZqFQ0tAXFpSE5SqNRkdQaYjAQyG+CGtFUozwADNYaRaD0+gNelCxhMpjNdAstB8dHMViYLFY7A4nC53F4Tohzpdrrd7o9niB0m8suRvrlaFJBJwgcUABoAWSqMnYRQAUrxBGJCRpiURlohrO5Qg8Yjs9o9rIyzoEwrRzGE4g9DLZXBEwpzuZkSV8fnRWEIJCISkIypVqrVuPVGirFiSNQhTLTLrYzB5zB5jGFTK5jv4mabzZabNbbfbHa9nZ8+W7BQAJIRSADSRRE3AKvGKHsqEuVcyJSzJiFMxlTlzCgUMV0HdtsDPTCF7ploiTCNgtUfMWuSqS5hfexZyv24zF4RTL7EbACEJDURKD6LugTwpEImi1aG1Ot1ev0KBp0AAjZA9CATACuqihmqpKgCswQeOEYQOLEjiGAuqbGi4xiQS4CTxlc6GxgWGQbiQJYCjue4Hsep6iBeV6sDed5QjCcIIsiqLoq+xDvrAX4-pAAFAe2qqdmBQReFBME2tY8HJohE5bIYlxalcWrbB4gSmB4OE8i6BG-F6IjCGKMi3qwdRSGWEhBvevxPl0zGYqgUJYEimCoHgYDAfx+iIPOtA9kmFqzlqaanAOoQJjYSmBPEISqauTp4a6Arabp+mikGxmmYwkLQrC8KIugKJDGiGL9LZQz2Y5zmueGXYINcoQ2h4pgJBECEBUYdiBOE5x7K4gSuHm1hqUW+FbnQXoSkGFHma0hDtFZhXEMgECkNQ3EVeqVU1bQdUNaa9gSS1CDhTJ5iBM4J13K4vXHQNsWaSNIhjYwE20VlDG5Uxc0LUthArbxYZrQJ1X7JtY7bU1e3GmOlimLsVzwdEiYDtdvLDbQE3NBZ03PtZ-Q-WofGVQDG1bY1u0pvtQ4ySdLi2Cm0N7JaTzReuyP8r8T2ZfROV5QVLG4-M+P-e5gO1SDJPNcaPZQ9Yg607sdo2qYSMaSjvASCKIhCNRk2Ppjs3INgYDEBAYDYI5Lm-SBEYUpYNj2JEdKeD4E7Rg1dohG4F0JCpSubqzdCq+rmvcLeGV0dljH5ei+uG8bpu2atoFC9bVJ27SbiO8ag46jsURiQasaMy8uEs6WQIcKw2uWXQz1DHFNAJ1bZg29S9vp+OpypjJsROBYS5hNY+ZM8Xyt+7QZfsBXggAGKmRUogN1Vye2zSzht07pyJhsSZxDY8HGMYCY+0No9BgoFTcN6dYNk2noVK2C8A+FzjmgmT-rLGSYQ5mFpWmJea7CkVchB8DG1mCgZmI9SxMDYFwPgAhhAiAfknCKVh+42H7hEa4+0D4bGCMdMI-dbS9i2EfOu+RCg+j9CCQMwYkHkhQu1W0RwTAeF2NsBwxokyQTEgfOwm8dheFIbdQUwpRRFElNKWUCplAWzcisJwQNEgxHOuJMmnC7i0FsMpcwPYvCsPcA6Ie6lfalmbN6QEwIAxgiDA0OhmpXAqU2DERwSk3CYPXh5MI3CTBLjHPvARUUi7GOPqWYylYaxXyEI2IozY752MjA8C4HgIjQ3iMdMcklTg0zNPGfeLgeo50RkYwaZDaBEX3IeGQJ4zwURqFRYOQh4nhWNOdGMDxWEpl2GYfqxSboowSkIPSBkjImSDPE4wJhNF-20bYLRNIkJiXaiFCwEUaYTKEf0+641CiXnGf3KwPknAENJh4g6vVNp3EcHOXsA8FYbNHhRPZoR97QSOWDFSSFzlmAiDYA+sZ4IriCSU4RAdRBB1vPE+CQNdE6IeIacmF0vL7C8ShUwXjlKpnuaXVg5d4nQUgnaZMNoTqOH2o4UIsYoxJi1A45SgS1zDxMYRRgZ8L61nrFEm+LZ4kqUSOaK4B94IPAiLYThXjLg+L4f4sc9KYolwFDPbgc9EGyIJkLcKWpNFoqptBTw+xOFjnNIOPUA52GOCxQKGBPB+CCHnqqwW9DeybV7MdBILrTBDgWZYK4o4VK2j1cYC19d7WJ3JKczwgCkhAA */
    createMachine<NetworkConfigContext, NetworkConfigEvent>({
      preserveActionOrder: true,
      predictableActionArguments: true,
      // todo: the actual context comes in from the parent and clobbers this one
      // xstate version 5 should fix this.
      context: {
        httpHandler: null,
        amtProfile: null,
        message: null,
        clientId: '',
        xmlMessage: null,
        errorMessage: '',
        generalSettings: null,
        wiredSettings: null,
        wifiSettings: null,
        retryCount: 0
      },
      id: 'network-configuration-machine',
      initial: 'ACTIVATION',
      states: {
        ACTIVATION: {
          on: {
            NETWORKCONFIGURATION: {
              actions: [assign({ errorMessage: () => '' }), 'Reset Unauth Count', 'Reset Retry Count'],
              target: 'CHECK_GENERAL_SETTINGS'
            }
          }
        },
        CHECK_GENERAL_SETTINGS: {
          always: [
            {
              cond: 'isNotAMTNetworkEnabled',
              target: 'PUT_GENERAL_SETTINGS'
            }, {
              target: 'ENUMERATE_ETHERNET_PORT_SETTINGS'
            }
          ]
        },
        PUT_GENERAL_SETTINGS: {
          invoke: {
            src: this.putGeneralSettings.bind(this),
            id: 'put-general-settings',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'ENUMERATE_ETHERNET_PORT_SETTINGS'
            },
            onError: {
              actions: assign({ errorMessage: (context, event) => 'Failed to update amt general settings on device' }),
              target: 'FAILED'
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
              actions: assign({ errorMessage: (context, event) => 'Failed to get enumeration number to ethernet port settings' }),
              target: 'FAILED'
            }
          }
        },
        PULL_ETHERNET_PORT_SETTINGS: {
          invoke: {
            src: this.pullEthernetPortSettings.bind(this),
            id: 'pull-ethernet-port-settings',
            onDone: {
              actions: [assign({ message: (context, event) => event.data }), 'Reset Retry Count'],
              target: 'CHECK_ETHERNET_PORT_SETTINGS_PULL_RESPONSE'
            },
            onError: [
              {
                cond: 'shouldRetry',
                actions: 'Increment Retry Count',
                target: 'ENUMERATE_ETHERNET_PORT_SETTINGS'
              },
              {
                actions: assign({ errorMessage: (context, event) => 'Failed to pull ethernet port settings' }),
                target: 'FAILED'
              }
            ]
          }
        },
        CHECK_ETHERNET_PORT_SETTINGS_PULL_RESPONSE: {
          entry: 'Read Ethernet Port Settings',
          always: [
            {
              cond: 'isWiredSupportedOnDevice',
              target: 'WIRED_CONFIGURATION'
            }, {
              cond: 'isWifiOnlyDevice',
              target: 'WIFI_CONFIGURATION'
            }, {
              target: 'SUCCESS'
            }
          ]
        },
        WIRED_CONFIGURATION: {
          entry: sendTo('wired-network-configuration-machine', { type: 'WIREDCONFIG' }),
          invoke: {
            src: this.wiredConfiguration.machine,
            id: 'wired-network-configuration-machine',
            data: {
              amtProfile: (context, event) => context.amtProfile,
              wiredSettings: (context, event) => context.wiredSettings,
              clientId: (context, event) => context.clientId,
              httpHandler: (context, _) => context.httpHandler,
              amt: (context, event) => context.amt,
              ips: (context, event) => context.ips,
              cim: (context, event) => context.cim
            },
            onDone: [
              {
                cond: 'isWifiSupportedOnDevice',
                target: 'WIFI_CONFIGURATION'
              },
              { target: 'SUCCESS' }
            ]
          }
        },
        WIFI_CONFIGURATION: {
          entry: sendTo('wifi-network-configuration-machine', { type: 'WIFICONFIG' }),
          invoke: {
            src: this.wifiConfiguration.machine,
            id: 'wifi-network-configuration-machine',
            data: {
              amtProfile: (context, event) => context.amtProfile,
              wifiSettings: (context, event) => context.wifiSettings,
              clientId: (context, event) => context.clientId,
              httpHandler: (context, _) => context.httpHandler,
              amt: (context, event) => context.amt,
              ips: (context, event) => context.ips,
              cim: (context, event) => context.cim
            },
            onDone: 'SUCCESS'
          }
        },
        ERROR: {
          entry: sendTo('error-machine', { type: 'PARSE' }),
          invoke: {
            src: this.error.machine,
            id: 'error-machine',
            data: {
              unauthCount: 0,
              message: (context, event) => event.data,
              clientId: (context, event) => context.clientId
            },
            onDone: 'CHECK_GENERAL_SETTINGS' // To do: Need to test as it might not require anymore.
          },
          on: {
            ONFAILED: 'FAILED'
          }
        },
        FAILED: {
          entry: ['Update Configuration Status'],
          type: 'final'
        },
        SUCCESS: {
          type: 'final'
        }
      }
    }, {
      guards: {
        isNotAMTNetworkEnabled: this.isNotAMTNetworkEnabled.bind(this),
        isWifiOnlyDevice: (context, event) => context.wifiSettings != null && context.wiredSettings?.MACAddress == null,
        isWiredSupportedOnDevice: (context, event) => context.wiredSettings?.MACAddress != null,
        isWifiSupportedOnDevice: (context, event) => {
          const profile = context.amtProfile
          if (profile?.wifiConfigs != null) {
            if (context.wifiSettings?.MACAddress != null && (profile.wifiConfigs.length > 0 || profile.localWifiSyncEnabled)) {
              return true
            }
          }
          return false
        },

        // isWifiSupportedOnDevice: (context, event) => context.wifiSettings?.MACAddress != null && ((context.amtProfile?.wifiConfigs != null && context.amtProfile.wifiConfigs.length > 0) || (context.amtProfile?.localWifiSyncEnabled != null && context.amtProfile.localWifiSyncEnabled)),

        isLocalProfileSynchronizationNotEnabled: (context, event) => context.message.Envelope.Body.AMT_WiFiPortConfigurationService.localProfileSynchronizationEnabled === 0,
        shouldRetry: (context, event) => context.retryCount != null && context.retryCount < 3 && event.data instanceof UNEXPECTED_PARSE_ERROR
      },
      actions: {
        'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 },
        'Read Ethernet Port Settings': this.readEthernetPortSettings.bind(this),
        'Reset Retry Count': assign({ retryCount: (context, event) => 0 }),
        'Increment Retry Count': assign({ retryCount: (context, event) => context.retryCount + 1 }),
        'Update Configuration Status': (context, event) => {
          devices[context.clientId].status.Network = context.errorMessage
        }
      }
    })

  constructor () {
    this.configurator = new Configurator()
    this.dbFactory = new DbCreatorFactory()
    this.logger = new Logger('Network_Configuration_State_Machine')
  }

  async putGeneralSettings (context): Promise<any> {
    context.xmlMessage = context.amt.GeneralSettings.Put(context.generalSettings)
    return await invokeWsmanCall(context)
  }

  isNotAMTNetworkEnabled (context: NetworkConfigContext, event: NetworkConfigEvent): boolean {
    // AMTNetworkEnabled - When set to Disabled, the AMT OOB network interfaces (LAN and WLAN) are disabled including AMT user initiated applications, Environment Detection and RMCPPing.
    // 0 : Disabled, 1 - Enabled
    // SharedFQDN -Defines Whether the FQDN (HostName.DomainName) is shared with the Host or dedicated to ME. (The default value for this property is shared - TRUE).
    // RmcpPingResponseEnabled - Indicates whether Intel(R) AMT should respond to RMCP ping Echo Request messages.
    const settings: AMT.Models.GeneralSettings | null = context.generalSettings
    if (settings != null) {
      if (!settings.SharedFQDN || settings.AMTNetworkEnabled !== 1 || !settings.RmcpPingResponseEnabled) {
        settings.SharedFQDN = true
        settings.AMTNetworkEnabled = 1
        settings.RmcpPingResponseEnabled = true
        context.generalSettings = settings
        return true
      }
    }
    return false
  }

  async enumerateEthernetPortSettings (context): Promise<any> {
    context.xmlMessage = context.amt.EthernetPortSettings.Enumerate()
    return await invokeWsmanCall(context, 2)
  }

  async pullEthernetPortSettings (context): Promise<any> {
    context.xmlMessage = context.amt.EthernetPortSettings.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  readEthernetPortSettings (context: NetworkConfigContext, event: NetworkConfigEvent): void {
    // As per AMT SDK first entry is WIRED network port and second entry is WIFI
    const pullResponse = context.message.Envelope.Body.PullResponse.Items.AMT_EthernetPortSettings
    const assignSettings = (item): void => {
      if (item.InstanceID.includes('Settings 0')) {
        context.wiredSettings = item
      } else if (item.InstanceID.includes('Settings 1')) {
        context.wifiSettings = item
      }
    }
    if (Array.isArray(pullResponse)) {
      pullResponse.slice(0, 2).forEach(assignSettings)
    } else {
      assignSettings(pullResponse)
    }
  }
}
