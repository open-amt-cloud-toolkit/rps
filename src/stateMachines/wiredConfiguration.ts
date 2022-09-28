import { AMT, CIM } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine, send } from 'xstate'
import { WirelessConfig } from '../models/RCS.Config'
import { HttpHandler } from '../HttpHandler'
import Logger from '../Logger'
import { AMTConfiguration } from '../models'
import { EnvReader } from '../utils/EnvReader'
import { devices } from '../WebSocketListener'
import { Error } from './error'
import { Configurator } from '../Configurator'
import { DbCreatorFactory } from '../repositories/factories/DbCreatorFactory'
import { AMTEthernetPortSettings, AMT_WiFiPortConfigurationServiceResponse } from '../models/WSManResponse'
import { invokeWsmanCall } from './common'
import { WirelessConfiguration } from './wirelessConfiguration'

interface WiredConfigContext {
  amtProfile: AMTConfiguration
  message: any
  clientId: string
  xmlMessage: any
  statusMessage: string
  generalSettings: AMT.Models.GeneralSettings
  wiredSettings: any
  wirelessSettings: any
  httpHandler: HttpHandler
  amt?: AMT.Messages
  cim?: CIM.Messages
}

interface WiredConfigEvent {
  type: 'WIRED_CONFIGURATION' | 'ONFAILED'
  clientId: string
  data?: any
}
export class WiredConfiguration {
  configurator: Configurator
  logger: Logger
  dbFactory: DbCreatorFactory
  db: any
  error: Error = new Error()
  wirelessConfiguration: WirelessConfiguration = new WirelessConfiguration()
  machine =
  /** @xstate-layout N4IgpgJg5mDOIC5QEMDGAXAlgN2Vg9gHYC0AtmgBaaFgB0AqgHIAKASgPIBqAkgMrftGAUQAiAYgCCAYQAq3ThLmDEoAA75YmAoRUgAHogCMAVgDMABlrGATADZzt6+cOGA7IYAcHgDQgAnogALB7WtACcjubmxrYm1qaBgQC+Sb5oWLjaZJTUdADiQjIA+gXCrBIAMkW8hXKMebxiEER01Nj4ANZ0sGCEEMQwNABOyAA2PehYhFDwSCDqmtq6BghOgca0HoaBtmGudjHWxr4BCLGutNYers6uIdYHtilpGDh4mETZqFQ0tAXFpSE5SqNRkdQaYjAQyG+CGtFUozwADNYaRaD0+gNelCxhMpjNdAstB8dHMViYLFY7A4nC53F4Tohzpdrrd7o9niB0m8suRvrlaFJBJwgcUABoAWSqMnYRQAUrxBGJCRpiURlohrO5Qg8Yjs9o9rIyzoEwrRzGE4g9DLZXBEwpzuZkSV8fnRWEIJCISkIypVqrVuPVGirFiSNQhTLTLrYzB5zB5jGFTK5jv4mabzZabNbbfbHa9nZ8+W7BQAJIRSADSRRE3AKvGKHsqEuVcyJSzJiFMxlTlzCgUMV0HdtsDPTCF7ploiTCNgtUfMWuSqS5hfexZyv24zF4RTL7EbACEJDURKD6LugTwpEImi1aG1Ot1ev0KBp0AAjZA9CATACuqihmqpKgCswQeOEYQOLEjiGAuqbGi4xiQS4CTxlc6GxgWGQbiQJYCjue4Hsep6iBeV6sDed5QjCcIIsiqLoq+xDvrAX4-pAAFAe2qqdmBQReFBME2tY8HJohE5bIYlxalcWrbB4gSmB4OE8i6BG-F6IjCGKMi3qwdRSGWEhBvevxPl0zGYqgUJYEimCoHgYDAfx+iIPOtA9kmFqzlqaanAOoQJjYSmBPEISqauTp4a6Arabp+mikGxmmYwkLQrC8KIugKJDGiGL9LZQz2Y5zmueGXYINcoQ2h4pgJBECEBUYdiBOE5x7K4gSuHm1hqUW+FbnQXoSkGFHma0hDtFZhXEMgECkNQ3EVeqVU1bQdUNaa9gSS1CDhTJ5iBM4J13K4vXHQNsWaSNIhjYwE20VlDG5Uxc0LUthArbxYZrQJ1X7JtY7bU1e3GmOlimLsVzwdEiYDtdvLDbQE3NBZ03PtZ-Q-WofGVQDG1bY1u0pvtQ4ySdLi2Cm0N7JaTzReuyP8r8T2ZfROV5QVLG4-M+P-e5gO1SDJPNcaPZQ9Yg607sdo2qYSMaSjvASCKIhCNRk2Ppjs3INgYDEBAYDYI5Lm-SBEYUpYNj2JEdKeD4E7Rg1dohG4F0JCpSubqzdCq+rmvcLeGV0dljH5ei+uG8bpu2atoFC9bVJ27SbiO8ag46jsURiQasaMy8uEs6WQIcKw2uWXQz1DHFNAJ1bZg29S9vp+OpypjJsROBYS5hNY+ZM8Xyt+7QZfsBXggAGKmRUogN1Vye2zSzht07pyJhsSZxDY8HGMYCY+0No9BgoFTcN6dYNk2noVK2C8A+FzjmgmT-rLGSYQ5mFpWmJea7CkVchB8DG1mCgZmI9SxMDYFwPgAhhAiAfknCKVh+42H7hEa4+0D4bGCMdMI-dbS9i2EfOu+RCg+j9CCQMwYkHkhQu1W0RwTAeF2NsBwxokyQTEgfOwm8dheFIbdQUwpRRFElNKWUCplAWzcisJwQNEgxHOuJMmnC7i0FsMpcwPYvCsPcA6Ie6lfalmbN6QEwIAxgiDA0OhmpXAqU2DERwSk3CYPXh5MI3CTBLjHPvARUUi7GOPqWYylYaxXyEI2IozY752MjA8C4HgIjQ3iMdMcklTg0zNPGfeLgeo50RkYwaZDaBEX3IeGQJ4zwURqFRYOQh4nhWNOdGMDxWEpl2GYfqxSboowSkIPSBkjImSDPE4wJhNF-20bYLRNIkJiXaiFCwEUaYTKEf0+641CiXnGf3KwPknAENJh4g6vVNp3EcHOXsA8FYbNHhRPZoR97QSOWDFSSFzlmAiDYA+sZ4IriCSU4RAdRBB1vPE+CQNdE6IeIacmF0vL7C8ShUwXjlKpnuaXVg5d4nQUgnaZMNoTqOH2o4UIsYoxJi1A45SgS1zDxMYRRgZ8L61nrFEm+LZ4kqUSOaK4B94IPAiLYThXjLg+L4f4sc9KYolwFDPbgc9EGyIJkLcKWpNFoqptBTw+xOFjnNIOPUA52GOCxQKGBPB+CCHnqqwW9DeybV7MdBILrTBDgWZYK4o4VK2j1cYC19d7WJ3JKczwgCkhAA */
  createMachine<WiredConfigContext, WiredConfigEvent>({
    preserveActionOrder: true,
    predictableActionArguments: true,
    context: {
      httpHandler: null,
      amtProfile: null,
      message: null,
      clientId: '',
      xmlMessage: null,
      statusMessage: '',
      generalSettings: null,
      wiredSettings: null,
      wirelessSettings: null
    },
    id: 'wired-network-configuration-machine',
    initial: 'ACTIVATION',
    states: {
      ACTIVATION: {
        on: {
          WIRED_CONFIGURATION: {
            actions: ['Reset Unauth Count'],
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
            actions: assign({ statusMessage: (context, event) => 'Failed to update amt general settings on device' }),
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
            actions: assign({ statusMessage: (context, event) => 'Failed to get enumeration number to ethernet port settings' }),
            target: 'FAILED'
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
            cond: 'isWiredSupportedOnDevice',
            target: 'PUT_ETHERNET_PORT_SETTINGS'
          }, {
            cond: 'isWirelessOnlyDevice',
            target: 'WIRELESS_CONFIGURATION'
          }
        ]
      },
      PUT_ETHERNET_PORT_SETTINGS: {
        invoke: {
          src: this.putEthernetPortSettings.bind(this),
          id: 'put-ethernet-port-settings',
          onDone: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'CHECK_ETHERNET_PORT_SETTINGS_PUT_RESPONSE'
          },
          onError: {
            actions: assign({ statusMessage: (context, event) => 'Failed to put to ethernet port settings' }),
            target: 'FAILED'
          }
        }
      },
      CHECK_ETHERNET_PORT_SETTINGS_PUT_RESPONSE: {
        entry: 'Read Ethernet Port Settings Put Response',
        always: [
          {
            cond: 'isWirelessSupportedOnDevice',
            target: 'WIRELESS_CONFIGURATION'
          }, {
            target: 'SUCCESS'
          }
        ]
      },
      WIRELESS_CONFIGURATION: {
        entry: send({ type: 'WIRELESS_CONFIGURATION' }, { to: 'wireless-network-configuration-machine' }),
        invoke: {
          src: this.wirelessConfiguration.machine,
          id: 'wireless-network-configuration-machine',
          data: {
            amtProfile: (context, event) => context.amtProfile,
            generalSettings: (context, event) => context.generalSettings,
            clientId: (context, event) => context.clientId,
            httpHandler: (context, _) => context.httpHandler,
            amt: (context, event) => context.amt,
            cim: (context, event) => context.cim,
            wirelessSettings: (context, event) => context.wirelessSettings
          },
          onDone: 'SUCCESS'
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
          onDone: 'CHECK_GENERAL_SETTINGS' 
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
        // entry: ['Update Configuration Status'],
        type: 'final'
      }
    }
  }, {
    guards: {
      isNotAMTNetworkEnabled: this.isNotAMTNetworkEnabled.bind(this),
      isWiredSupportedOnDevice: (context, event) => context.wiredSettings?.MACAddress != null,
      isWirelessOnlyDevice: (context, event) => { return context.wirelessSettings != null && context.wiredSettings?.MACAddress == null },
      isWirelessSupportedOnDevice: (context, event) => { return context.wirelessSettings?.MACAddress != null }
    },
    actions: {
      'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 },
      'Update Configuration Status': (context, event) => {
        const status = devices[context.clientId].status.Network
        devices[context.clientId].status.Network = status == null ? context.statusMessage : `${status}. ${context.statusMessage}`
      },
      'Read Ethernet Port Settings': this.readEthernetPortSettings.bind(this),
      'Read Ethernet Port Settings Put Response': this.readEthernetPortSettingsPutResponse.bind(this)
    }
  })

  constructor () {
    this.configurator = new Configurator()
    this.dbFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
    this.logger = new Logger('Network_Configuration_State_Machine')
  }

  async putGeneralSettings (context): Promise<any> {
    context.xmlMessage = context.amt.GeneralSettings(AMT.Methods.PUT, context.generalSettings)
    return await invokeWsmanCall(context)
  }

  isNotAMTNetworkEnabled (context: WiredConfigContext, event: WiredConfigEvent): boolean {
    // AMTNetworkEnabled - When set to Disabled, the AMT OOB network interfaces (LAN and WLAN) are disabled including AMT user initiated applications, Environment Detection and RMCPPing.
    // 0 : Disabled, 1 - Enabled
    // SharedFQDN -Defines Whether the FQDN (HostName.DomainName) is shared with the Host or dedicated to ME. (The default value for this property is shared - TRUE).
    // RmcpPingResponseEnabled - Indicates whether Intel(R) AMT should respond to RMCP ping Echo Request messages.
    const settings: AMT.Models.GeneralSettings = context.generalSettings
    if (!settings.SharedFQDN || settings.AMTNetworkEnabled !== 1 || !settings.RmcpPingResponseEnabled) {
      settings.SharedFQDN = true
      settings.AMTNetworkEnabled = 1
      settings.RmcpPingResponseEnabled = true
      context.generalSettings = settings
      return true
    }
    return false
  }

  async enumerateEthernetPortSettings (context): Promise<any> {
    context.xmlMessage = context.amt.EthernetPortSettings(AMT.Methods.ENUMERATE)
    return await invokeWsmanCall(context)
  }

  async pullEthernetPortSettings (context): Promise<any> {
    context.xmlMessage = context.amt.EthernetPortSettings(AMT.Methods.PULL, context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  readEthernetPortSettings (context: WiredConfigContext, event: WiredConfigEvent): void {
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

  async putEthernetPortSettings (context): Promise<any> {
    if (context.amtProfile.dhcpEnabled) {
      context.wiredSettings.DHCPEnabled = true
      context.wiredSettings.SharedStaticIp = false
    } else {
      context.wiredSettings.DHCPEnabled = false
      context.wiredSettings.SharedStaticIp = true
    }
    context.wiredSettings.IpSyncEnabled = true
    if (context.wiredSettings.DHCPEnabled || context.wiredSettings.IpSyncEnabled) {
      // When 'DHCPEnabled' property is set to true the following properties should be removed:
      // SubnetMask, DefaultGateway, IPAddress, PrimaryDNS, SecondaryDNS.
      delete context.wiredSettings.SubnetMask
      delete context.wiredSettings.DefaultGateway
      delete context.wiredSettings.IPAddress
      delete context.wiredSettings.PrimaryDNS
      delete context.wiredSettings.SecondaryDNS
    } else {
      // TBD: To set static IP address the values should be read from the REST API
      // ethernetPortSettings.SubnetMask = "255.255.255.0";
      // ethernetPortSettings.DefaultGateway = "192.168.1.1";
      // ethernetPortSettings.IPAddress = "192.168.1.223";
      // ethernetPortSettings.PrimaryDNS = "192.168.1.1";
      // ethernetPortSettings.SecondaryDNS = "192.168.1.1";
    }
    // this.logger.debug(`Updated Network configuration to set on device :  ${JSON.stringify(context.message, null, '\t')}`)
    // put request to update ethernet port settings on the device
    context.xmlMessage = context.amt.EthernetPortSettings(AMT.Methods.PUT, null, context.wiredSettings)
    return await invokeWsmanCall(context)
  }

  readEthernetPortSettingsPutResponse (context: WiredConfigContext, event: WiredConfigEvent): void {
    const amtEthernetPortSettings: AMTEthernetPortSettings = context.message.Envelope.Body.AMT_EthernetPortSettings
    if (context.amtProfile.dhcpEnabled === amtEthernetPortSettings.DHCPEnabled && !(context.amtProfile.dhcpEnabled) === amtEthernetPortSettings.SharedStaticIp && amtEthernetPortSettings.IpSyncEnabled) {
      // Check with status messages once
      devices[context.clientId].status.Network = 'Wired Network Configured'
      return
    }
    devices[context.clientId].status.Network = 'Wired Network Configuration Failed'
  }
}
