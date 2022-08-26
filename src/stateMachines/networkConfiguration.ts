import { AMT, CIM } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine } from 'xstate'
import { WirelessConfig } from '../models/RCS.Config'
import { HttpHandler } from '../HttpHandler'
import Logger from '../Logger'
import { AMTConfiguration } from '../models'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { EnvReader } from '../utils/EnvReader'
// import { MqttProvider } from '../utils/MqttProvider'
import { parseBody } from '../utils/parseWSManResponseBody'
import { devices } from '../WebSocketListener'
import { send } from 'xstate/lib/actions'
import { Error } from './error'
import { Configurator } from '../Configurator'
import { HttpZResponseModel } from 'http-z'
import { DbCreatorFactory } from '../repositories/factories/DbCreatorFactory'
import { AMTEthernetPortSettings, AMT_WiFiPortConfigurationServiceResponse } from '../models/WSManResponse'

interface NetworkConfigContext {
  amtProfile: AMTConfiguration
  wifiProfileCount: number
  message: HttpZResponseModel
  clientId: string
  xmlMessage: any
  response: any
  status: 'success' | 'error'
  errorMessage: string
  statusMessage: string
  generalSettings: AMT.Models.GeneralSettings
  wiredSettings: any
  wireLessSettings: any
  wifiEndPointSettings?: any
}

interface NetworkConfigEvent {
  type: 'NETWORKCONFIGURATION' | 'ONFAILED'
  clientId: string
  data?: any
}
export class NetworkConfiguration {
  configurator: Configurator
  responseMsg: ClientResponseMsg
  httpHandler: HttpHandler
  amt: AMT.Messages
  cim: CIM.Messages
  logger: Logger
  dbFactory: DbCreatorFactory
  db: any
  error: Error = new Error()

  machine =
  /** @xstate-layout N4IgpgJg5mDOIC5QEMDGAXAlgN2Vg9gHYC0AtmgBaaFgB0AqgHIAKASgPIBqAkgMrftGAUQAiAYgCCAYQAq3ThLmDEoAA75YmAoRUgAHogCMAVgDMABlrGATADZzt6+cOGA7IYAcHgDQgAnogALB7WtACcjubmxrYm1qaBgQC+Sb5oWLjaZJTUdADiQjIA+gXCrBIAMkW8hXKMebxiEER01Nj4ANZ0sGCEEMQwNABOyAA2PehYhFDwSCDqmtq6BghOgca0HoaBtmGudjHWxr4BCLGutNYers6uIdYHtilpGDh4mETZqFQ0tAXFpSE5SqNRkdQaYjAQyG+CGtFUozwADNYaRaD0+gNelCxhMpjNdAstB8dHMViYLFY7A4nC53F4Tohzpdrrd7o9niB0m8suRvrlaFJBJwgcUABoAWSqMnYRQAUrxBGJCRpiURlohrO5Qg8Yjs9o9rIyzoEwrRzGE4g9DLZXBEwpzuZkSV8fnRWEIJCISkIypVqrVuPVGirFiSNQhTLTLrYzB5zB5jGFTK5jv4mabzZabNbbfbHa9nZ8+W7BQAJIRSADSRRE3AKvGKHsqEuVcyJSzJiFMxlTlzCgUMV0HdtsDPTCF7ploiTCNgtUfMWuSqS5hfexZyv24zF4RTL7EbACEJDURKD6LugTwpEImi1aG1Ot1ev0KBp0AAjZA9CATACuqihmqpKgCswQeOEYQOLEjiGAuqbGi4xiQS4CTxlc6GxgWGQbiQJYCjue4Hsep6iBeV6sDed5QjCcIIsiqLoq+xDvrAX4-pAAFAe2qqdmBQReFBME2tY8HJohE5bIYlxalcWrbB4gSmB4OE8i6BG-F6IjCGKMi3qwdRSGWEhBvevxPl0zGYqgUJYEimCoHgYDAfx+iIPOtA9kmFqzlqaanAOoQJjYSmBPEISqauTp4a6Arabp+mikGxmmYwkLQrC8KIugKJDGiGL9LZQz2Y5zmueGXYINcoQ2h4pgJBECEBUYdiBOE5x7K4gSuHm1hqUW+FbnQXoSkGFHma0hDtFZhXEMgECkNQ3EVeqVU1bQdUNaa9gSS1CDhTJ5iBM4J13K4vXHQNsWaSNIhjYwE20VlDG5Uxc0LUthArbxYZrQJ1X7JtY7bU1e3GmOlimLsVzwdEiYDtdvLDbQE3NBZ03PtZ-Q-WofGVQDG1bY1u0pvtQ4ySdLi2Cm0N7JaTzReuyP8r8T2ZfROV5QVLG4-M+P-e5gO1SDJPNcaPZQ9Yg607sdo2qYSMaSjvASCKIhCNRk2Ppjs3INgYDEBAYDYI5Lm-SBEYUpYNj2JEdKeD4E7Rg1dohG4F0JCpSubqzdCq+rmvcLeGV0dljH5ei+uG8bpu2atoFC9bVJ27SbiO8ag46jsURiQasaMy8uEs6WQIcKw2uWXQz1DHFNAJ1bZg29S9vp+OpypjJsROBYS5hNY+ZM8Xyt+7QZfsBXggAGKmRUogN1Vye2zSzht07pyJhsSZxDY8HGMYCY+0No9BgoFTcN6dYNk2noVK2C8A+FzjmgmT-rLGSYQ5mFpWmJea7CkVchB8DG1mCgZmI9SxMDYFwPgAhhAiAfknCKVh+42H7hEa4+0D4bGCMdMI-dbS9i2EfOu+RCg+j9CCQMwYkHkhQu1W0RwTAeF2NsBwxokyQTEgfOwm8dheFIbdQUwpRRFElNKWUCplAWzcisJwQNEgxHOuJMmnC7i0FsMpcwPYvCsPcA6Ie6lfalmbN6QEwIAxgiDA0OhmpXAqU2DERwSk3CYPXh5MI3CTBLjHPvARUUi7GOPqWYylYaxXyEI2IozY752MjA8C4HgIjQ3iMdMcklTg0zNPGfeLgeo50RkYwaZDaBEX3IeGQJ4zwURqFRYOQh4nhWNOdGMDxWEpl2GYfqxSboowSkIPSBkjImSDPE4wJhNF-20bYLRNIkJiXaiFCwEUaYTKEf0+641CiXnGf3KwPknAENJh4g6vVNp3EcHOXsA8FYbNHhRPZoR97QSOWDFSSFzlmAiDYA+sZ4IriCSU4RAdRBB1vPE+CQNdE6IeIacmF0vL7C8ShUwXjlKpnuaXVg5d4nQUgnaZMNoTqOH2o4UIsYoxJi1A45SgS1zDxMYRRgZ8L61nrFEm+LZ4kqUSOaK4B94IPAiLYThXjLg+L4f4sc9KYolwFDPbgc9EGyIJkLcKWpNFoqptBTw+xOFjnNIOPUA52GOCxQKGBPB+CCHnqqwW9DeybV7MdBILrTBDgWZYK4o4VK2j1cYC19d7WJ3JKczwgCkhAA */
  createMachine<NetworkConfigContext, NetworkConfigEvent>({
    preserveActionOrder: true,
    predictableActionArguments: true,
    context: {
      amtProfile: null,
      wifiProfileCount: 0,
      message: null,
      clientId: '',
      xmlMessage: null,
      response: '',
      status: 'success',
      errorMessage: '',
      statusMessage: '',
      generalSettings: null,
      wiredSettings: null,
      wireLessSettings: null,
      wifiEndPointSettings: []
    },
    id: 'network-configuration-machine',
    initial: 'ACTIVATION',
    states: {
      ACTIVATION: {
        on: {
          NETWORKCONFIGURATION: {
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
            actions: assign({
              message: (context, event) => event.data,
              errorMessage: 'Failed to update amt general settings on device'
            }),
            target: 'ERROR'
          }
        }
      },
      ENUMERATE_ETHERNET_PORT_SETTINGS: {
        invoke: {
          src: this.enumerateEthernetPortSettings.bind(this),
          id: 'enumerate-ethernet-port-settings',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data }),
              'Convert WSMan XML response to JSON'
            ],
            target: 'PULL_ETHERNET_PORT_SETTINGS'
          },
          onError: {
            actions: assign({
              message: (context, event) => event.data,
              errorMessage: 'Failed to get enumeration number to ethernet port settings'
            }),
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
            actions: assign({
              message: (context, event) => event.data,
              errorMessage: 'Failed to pull to ethernet port settings'
            }),
            target: 'ERROR'
          }
        }
      },
      CHECK_ETHERNET_PORT_SETTINGS_PULL_RESPONSE: {
        entry: ['Convert WSMan XML response to JSON', 'Read Ethernet Port Settings'],
        always: [
          {
            cond: 'isWiredSupportedOnDevice',
            target: 'PUT_ETHERNET_PORT_SETTINGS'
          }, {
            cond: 'isWirelessOnlyDevice',
            target: 'ENUMERATE_WIFI_ENDPOINT_SETTINGS'
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
            actions: assign({
              message: (context, event) => event.data,
              errorMessage: 'Failed to put to ethernet port settings'
            }),
            target: 'ERROR'
          }
        }
      },
      CHECK_ETHERNET_PORT_SETTINGS_PUT_RESPONSE: {
        entry: ['Convert WSMan XML response to JSON', 'Read Ethernet Port Settings Put Response'],
        always: [
          {
            cond: 'isWirelessSupportedOnDevice',
            target: 'ENUMERATE_WIFI_ENDPOINT_SETTINGS'
          }, {
            target: 'NETWORKCONFIGURED'
          }
        ]
      },
      ENUMERATE_WIFI_ENDPOINT_SETTINGS: {
        invoke: {
          src: this.enumerateWiFiEndpointSettings.bind(this),
          id: 'enumerate-wifi-endpoint-settings',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data }),
              'Convert WSMan XML response to JSON'
            ],
            target: 'PULL_WIFI_ENDPOINT_SETTINGS'
          },
          onError: {
            actions: assign({
              message: (context, event) => event.data,
              errorMessage: 'Failed to get enumeration number for wifi endpoint settings'
            }),
            target: 'ERROR'
          }
        }
      },
      PULL_WIFI_ENDPOINT_SETTINGS: {
        invoke: {
          src: this.pullWiFiEndpointSettings.bind(this),
          id: 'pull-wifi-endpoint-settings',
          onDone: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'CHECK_WIFI_ENDPOINT_SETTINGS_PULL_RESPONSE'
          },
          onError: {
            actions: assign({
              message: (context, event) => event.data,
              errorMessage: 'Failed to pull wifi endpoint settings'
            }),
            target: 'ERROR'
          }
        }
      },
      CHECK_WIFI_ENDPOINT_SETTINGS_PULL_RESPONSE: {
        entry: ['Convert WSMan XML response to JSON', 'Read WiFi Endpoint Settings Pull Response'],
        always: [
          {
            cond: 'IsWirelessProfilesExistsonDevice',
            target: 'DELETE_WIFI_ENDPOINT_SETTINGS'
          }, {
            cond: 'isWiFiProfilesExits',
            target: 'REQUEST_STATE_CHANGE_FOR_WIFI_PORT'
          }, {
            target: 'NETWORKCONFIGURED'
          }
        ]
      },
      DELETE_WIFI_ENDPOINT_SETTINGS: {
        invoke: {
          src: this.deleteWiFiProfileOnAMTDevice.bind(this),
          id: 'delete-wifi-endpoint-settings',
          onDone: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'CHECK_WIFI_ENDPOINT_SETTINGS_DELETE_RESPONSE'
          },
          onError: {
            actions: assign({
              message: (context, event) => event.data,
              errorMessage: 'Failed to delete wifi endpoint settings'
            }),
            target: 'ERROR'
          }
        }
      },
      CHECK_WIFI_ENDPOINT_SETTINGS_DELETE_RESPONSE: {
        entry: ['Convert WSMan XML response to JSON'],
        always: [
          {
            cond: 'isWifiProfileDeleted',
            target: 'FAILED'
          },
          {
            cond: 'IsWirelessProfilesExistsonDevice',
            target: 'DELETE_WIFI_ENDPOINT_SETTINGS'
          }, {
            cond: 'isWiFiProfilesExits',
            target: 'REQUEST_STATE_CHANGE_FOR_WIFI_PORT'
          }, {
            target: 'NETWORKCONFIGURED'
          }
        ]
      },
      REQUEST_STATE_CHANGE_FOR_WIFI_PORT: {
        invoke: {
          src: this.updateWifiPort.bind(this),
          id: 'request-state-change-for-wifi-port',
          onDone: {
            actions: [assign({ message: (context, event) => event.data }), 'Convert WSMan XML response to JSON'],
            target: 'ADD_WIFI_SETTINGS'
          },
          onError: {
            actions: assign({
              message: (context, event) => event.data,
              errorMessage: 'Failed to update state change for wifi port'
            }),
            target: 'ERROR'
          }
        }
      },
      ADD_WIFI_SETTINGS: {
        invoke: {
          src: this.addWifiConfigs.bind(this),
          id: 'add-wifi-settings',
          onDone: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'CHECK_ADD_WIFI_SETTINGS_RESPONSE'
          },
          onError: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'ERROR'
          }
        }
      },
      CHECK_ADD_WIFI_SETTINGS_RESPONSE: {
        entry: ['Convert WSMan XML response to JSON'],
        always: [
          {
            cond: 'isWifiProfileAdded',
            target: 'FAILED'
          },
          {
            cond: 'isWiFiProfilesExits',
            target: 'ADD_WIFI_SETTINGS'
          },
          {
            target: 'GET_WIFI_PORT_CONFIGURATION_SERVICE'
          }
        ]
      },
      GET_WIFI_PORT_CONFIGURATION_SERVICE: {
        invoke: {
          src: this.getWiFiPortConfigurationService.bind(this),
          id: 'get-wifi-port-configuration-service',
          onDone: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'CHECK_WIFI_PORT_CONFIGURATION_SERVICE'
          },
          onError: {
            actions: assign({
              message: (context, event) => event.data,
              errorMessage: 'Failed to get WiFi Port Configuration Service'
            }),
            target: 'ERROR'
          }
        }
      },
      CHECK_WIFI_PORT_CONFIGURATION_SERVICE: {
        entry: ['Convert WSMan XML response to JSON'],
        always: [
          {
            cond: 'islocalProfileSynchronizationNotEnabled',
            target: 'PUT_WIFI_PORT_CONFIGURATION_SERVICE'
          },
          {
            actions: assign({ statusMessage: (context, event) => `${context.statusMessage} Wireless Configured` }),
            target: 'NETWORKCONFIGURED'
          }
        ]
      },
      PUT_WIFI_PORT_CONFIGURATION_SERVICE: {
        invoke: {
          src: this.putWiFiPortConfigurationService.bind(this),
          id: 'put-wifi-port-configuration-service',
          onDone: {
            actions: [assign({ message: (context, event) => event.data }), 'Convert WSMan XML response to JSON'],
            target: 'NETWORKCONFIGURED'
          },
          onError: {
            actions: assign({
              message: (context, event) => event.data,
              errorMessage: 'Failed to put WiFi Port Configuration Service'
            }),
            target: 'ERROR'
          }
        }
      },
      ERROR: {
        entry: send({ type: 'PARSE' }, { to: 'error-machine' }),
        invoke: {
          src: this.error.machine,
          id: 'error-machine',
          data: {
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
        entry: [assign({ status: (context, event) => 'error' }), 'update configuration status'],
        type: 'final'
      },
      NETWORKCONFIGURED: {
        entry: [assign({ status: (context, event) => 'success' }), 'update configuration status'],
        type: 'final'
      }
    }
  }, {
    guards: {
      isWiFiProfilesExits: (context, event) => context.wifiProfileCount < context.amtProfile.wifiConfigs.length,
      isWirelessOnlyDevice: (context, event) => context.wireLessSettings != null && context.wiredSettings?.MACAddress == null,
      isWiredSupportedOnDevice: (context, event) => context.wiredSettings?.MACAddress != null,
      isWirelessSupportedOnDevice: (context, event) => context.wireLessSettings?.MACAddress != null,
      IsWirelessProfilesExistsonDevice: (context, event) => context.wifiEndPointSettings.length !== 0,
      isWifiProfileAdded: (context, event) => context.response.Envelope.Body.AddWiFiSettings_OUTPUT.ReturnValue !== 0,
      isWifiProfileDeleted: (context, event) => context.response.Envelope.Body == null,
      islocalProfileSynchronizationNotEnabled: (context, event) => context.response.Envelope.Body.AMT_WiFiPortConfigurationService.localProfileSynchronizationEnabled === 0,
      isNotAMTNetworkEnabled: this.isNotAMTNetworkEnabled.bind(this)
    },
    actions: {
      'Convert WSMan XML response to JSON': this.convertToJson.bind(this),
      'update configuration status': this.updateConfigurationStatus.bind(this),
      'Read Ethernet Port Settings': this.readEthernetPortSettings.bind(this),
      'Read Ethernet Port Settings Put Response': this.readEthernetPortSettingsPutResponse.bind(this),
      'Read WiFi Endpoint Settings Pull Response': this.readWiFiEndpointSettingsPullResponse.bind(this)
    }
  })

  constructor () {
    this.configurator = new Configurator()
    this.responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
    this.httpHandler = new HttpHandler()
    this.amt = new AMT.Messages()
    this.cim = new CIM.Messages()
    this.dbFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
    this.logger = new Logger('Network_Configuration_State_Machine')
  }

  updateConfigurationStatus (context, event): void {
    // TODO: Get rid of redundant data (i.e. Method and Status)
    if (context.status === 'success') {
      devices[context.clientId].status.Network = context.statusMessage
    } else if (context.status === 'error') {
      devices[context.clientId].status.Network = context.errorMessage !== '' ? context.errorMessage : 'Failed'
    }
    // return sendParent({ type: 'ONFAILED', data: 'Unknown error has occured' })
  }

  async invokeWsmanCall (context): Promise<any> {
    let { message, clientId, xmlMessage } = context
    const clientObj = devices[clientId]
    message = this.httpHandler.wrapIt(xmlMessage, clientObj.connectionParams)
    const responseMessage = this.responseMsg.get(clientId, message, 'wsman', 'ok')
    devices[clientId].ClientSocket.send(JSON.stringify(responseMessage))
    clientObj.pendingPromise = new Promise<any>((resolve, reject) => {
      clientObj.resolve = resolve
      clientObj.reject = reject
    })
    return await clientObj.pendingPromise
  }

  convertToJson (context: NetworkConfigContext, event: NetworkConfigEvent): void {
    const xmlBody = parseBody(context.message)
    // parse WSMan xml response to json
    context.response = this.httpHandler.parseXML(xmlBody)
    this.logger.debug(`JSON response from AMT: ${JSON.stringify(context.response, null, '\t')}`)
  }

  async putGeneralSettings (context): Promise<any> {
    context.xmlMessage = this.amt.GeneralSettings(AMT.Methods.PUT, context.generalSettings)
    return await this.invokeWsmanCall(context)
  }

  isNotAMTNetworkEnabled (context: NetworkConfigContext, event: NetworkConfigEvent): boolean {
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
    context.xmlMessage = this.amt.EthernetPortSettings(AMT.Methods.ENUMERATE)
    return await this.invokeWsmanCall(context)
  }

  async pullEthernetPortSettings (context): Promise<any> {
    context.xmlMessage = this.amt.EthernetPortSettings(AMT.Methods.PULL, context.response.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await this.invokeWsmanCall(context)
  }

  readEthernetPortSettings (context: NetworkConfigContext, event: NetworkConfigEvent): void {
    // As per AMT SDK first entry is WIRED network port and second entry is WIRELESS
    const pullResponse = context.response.Envelope.Body.PullResponse.Items.AMT_EthernetPortSettings
    if (Array.isArray(pullResponse)) {
      if (pullResponse[0].InstanceID.includes('Settings 0')) {
        context.wiredSettings = pullResponse[0]
      } else if (pullResponse[0].InstanceID.includes('Settings 1')) {
        context.wireLessSettings = pullResponse[0]
      }

      if (pullResponse[1].InstanceID.includes('Settings 0')) {
        context.wiredSettings = pullResponse[1]
      } else if (pullResponse[1].InstanceID.includes('Settings 1')) {
        context.wireLessSettings = pullResponse[1]
      }
    } else {
      if (pullResponse.InstanceID.includes('Settings 0')) {
        context.wiredSettings = pullResponse
      } else if (pullResponse.InstanceID.includes('Settings 1')) {
        context.wireLessSettings = pullResponse
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
    this.logger.debug(`Updated Network configuration to set on device :  ${JSON.stringify(context.response, null, '\t')}`)
    // put request to update ethernet port settings on the device
    context.xmlMessage = this.amt.EthernetPortSettings(AMT.Methods.PUT, null, context.wiredSettings)
    return await this.invokeWsmanCall(context)
  }

  readEthernetPortSettingsPutResponse (context: NetworkConfigContext, event: NetworkConfigEvent): void {
    const amtEthernetPortSettings: AMTEthernetPortSettings = context.response.Envelope.Body.AMT_EthernetPortSettings
    if (context.amtProfile.dhcpEnabled === amtEthernetPortSettings.DHCPEnabled && !(context.amtProfile.dhcpEnabled) === amtEthernetPortSettings.SharedStaticIp && amtEthernetPortSettings.IpSyncEnabled) {
      // Check with status messages once
      context.statusMessage = 'Wired Network Configured'
    }
    context.statusMessage = 'Wired Network Confirguartion Failed'
  }

  async enumerateWiFiEndpointSettings (context): Promise<any> {
    context.xmlMessage = this.cim.WiFiEndpointSettings(CIM.Methods.ENUMERATE)
    return await this.invokeWsmanCall(context)
  }

  async pullWiFiEndpointSettings (context): Promise<any> {
    context.xmlMessage = this.cim.WiFiEndpointSettings(CIM.Methods.PULL, context.response.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await this.invokeWsmanCall(context)
  }

  readWiFiEndpointSettingsPullResponse (context: NetworkConfigContext, event: NetworkConfigEvent): void {
    let wifiEndPointSettings = []
    if (context.response.Envelope.Body.PullResponse.Items?.CIM_WiFiEndpointSettings != null) {
      // CIM_WiFiEndpointSettings is an array if there more than one profile exists, otherwise its just an object from AMT
      if (Array.isArray(context.response.Envelope.Body.PullResponse.Items.CIM_WiFiEndpointSettings)) {
        wifiEndPointSettings = context.response.Envelope.Body.PullResponse.Items.CIM_WiFiEndpointSettings
      } else {
        wifiEndPointSettings.push(context.response.Envelope.Body.PullResponse.Items.CIM_WiFiEndpointSettings)
      }
    }
    if (wifiEndPointSettings.length > 0) {
    //  ignore the profiles with Priority 0 and without InstanceID, which is required to delete a wifi profile on AMT device
      wifiEndPointSettings.forEach(wifi => {
        if (wifi.InstanceID != null && wifi.Priority !== 0) {
          context.wifiEndPointSettings.push({ ...wifi })
        }
      })
    }
  }

  async deleteWiFiProfileOnAMTDevice (context: NetworkConfigContext, event: NetworkConfigEvent): Promise<any> {
    let wifiEndpoints = context.wifiEndPointSettings
    // Deletes first profile in the array
    const selector = { name: 'InstanceID', value: wifiEndpoints[0].InstanceID }
    context.xmlMessage = this.cim.WiFiEndpointSettings(CIM.Methods.DELETE, null, selector)
    wifiEndpoints = wifiEndpoints.slice(1)
    context.wifiEndPointSettings = wifiEndpoints
    return await this.invokeWsmanCall(context)
  }

  async updateWifiPort (context: NetworkConfigContext, event: NetworkConfigEvent): Promise<any> {
    // Enumeration 32769 - WiFi is enabled in S0 + Sx/AC
    context.xmlMessage = this.cim.WiFiPort(CIM.Methods.REQUEST_STATE_CHANGE, 32769)
    return await this.invokeWsmanCall(context)
  }

  async getWifiProfile (profileName: string): Promise<WirelessConfig> {
    // Get WiFi profile information based on the profile name from db.
    const wifiConfig = await this.db.wirelessProfiles.getByName(profileName)
    if (this.configurator?.secretsManager) {
      // Get WiFi profile pskPassphrase from vault
      const data: any = await this.configurator.secretsManager.getSecretAtPath(`Wireless/${wifiConfig.profileName}`)
      if (data != null) {
        wifiConfig.pskPassphrase = data.data.PSK_PASSPHRASE
      }
    }
    return wifiConfig
  }

  async addWifiConfigs (context: NetworkConfigContext, event: NetworkConfigEvent): Promise<any> {
    // Get WiFi profile information based on the profile name.
    const wifiConfig = await this.getWifiProfile(context.amtProfile.wifiConfigs[context.wifiProfileCount].profileName)
    const selector = { name: 'Name', value: 'WiFi Endpoint 0' }
    // Add  WiFi profile information to WiFi endpoint settings object
    const wifiEndpointSettings = {
      ElementName: wifiConfig.profileName,
      InstanceID: `Intel(r) AMT:WiFi Endpoint Settings ${wifiConfig.profileName}`,
      AuthenticationMethod: wifiConfig.authenticationMethod,
      EncryptionMethod: wifiConfig.encryptionMethod,
      SSID: wifiConfig.ssid,
      Priority: context.amtProfile.wifiConfigs[context.wifiProfileCount].priority,
      PSKPassPhrase: wifiConfig.pskPassphrase
    }
    // Increment the count to keep track of profiles added to AMT
    ++context.wifiProfileCount
    context.xmlMessage = this.amt.WiFiPortConfigurationService(AMT.Methods.ADD_WIFI_SETTINGS, wifiEndpointSettings, selector)
    return await this.invokeWsmanCall(context)
  }

  async getWiFiPortConfigurationService (context: NetworkConfigContext, event: NetworkConfigEvent): Promise<any> {
    context.xmlMessage = this.amt.WiFiPortConfigurationService(AMT.Methods.GET, null, null)
    return await this.invokeWsmanCall(context)
  }

  async putWiFiPortConfigurationService (context: NetworkConfigContext, event: NetworkConfigEvent): Promise<any> {
    const wifiPortConfigurationService: AMT_WiFiPortConfigurationServiceResponse = context.response.Envelope.Body.AMT_WiFiPortConfigurationService
    wifiPortConfigurationService.localProfileSynchronizationEnabled = 1
    context.xmlMessage = this.amt.WiFiPortConfigurationService(AMT.Methods.PUT, wifiPortConfigurationService, null)
    return await this.invokeWsmanCall(context)
  }
}
