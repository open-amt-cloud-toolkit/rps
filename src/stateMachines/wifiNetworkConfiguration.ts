/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMT, type CIM } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine, send } from 'xstate'
import { type WirelessConfig } from '../models/RCS.Config'
import { type HttpHandler } from '../HttpHandler'
import Logger from '../Logger'
import { type AMTConfiguration } from '../models'
import { devices } from '../WebSocketListener'
import { Error } from './error'
import { Configurator } from '../Configurator'
import { DbCreatorFactory } from '../factories/DbCreatorFactory'
import { invokeWsmanCall } from './common'
import { type WifiCredentials } from '../interfaces/ISecretManagerService'
import { UNEXPECTED_PARSE_ERROR } from '../utils/constants'
import { getCertFromEnterpriseAssistant, initiateCertRequest, sendEnterpriseAssistantKeyPairResponse } from './enterpriseAssistant'

interface WiFiConfigContext {
  amtProfile: AMTConfiguration
  wifiProfileCount: number
  message: any
  clientId: string
  xmlMessage: any
  errorMessage: string
  statusMessage: string
  generalSettings: AMT.Models.GeneralSettings
  wifiSettings: any
  wifiEndPointSettings?: any
  httpHandler: HttpHandler
  amt?: AMT.Messages
  cim?: CIM.Messages
  retryCount?: number
  eaResponse?: any
  addTrustedRootCertResponse?: any
  addCertResponse?: any
  keyPairHandle?: string
  wifiProfile?: WirelessConfig
}

interface WiFiConfigEvent {
  type: 'WIFICONFIG' | 'ONFAILED'
  clientId: string
  data?: any
}
export class WiFiConfiguration {
  configurator: Configurator
  logger: Logger
  dbFactory: DbCreatorFactory
  db: any
  error: Error = new Error()

  machine =
    createMachine<WiFiConfigContext, WiFiConfigEvent>({
      preserveActionOrder: true,
      predictableActionArguments: true,
      context: {
        httpHandler: null,
        amtProfile: null,
        wifiProfileCount: 0,
        message: null,
        clientId: '',
        xmlMessage: null,
        errorMessage: null,
        statusMessage: null,
        generalSettings: null,
        wifiSettings: null,
        wifiEndPointSettings: []
      },
      id: 'wifi-network-configuration-machine',
      initial: 'ACTIVATION',
      states: {
        ACTIVATION: {
          on: {
            WIFICONFIG: {
              actions: [assign({ wifiProfileCount: () => 0 }), 'Reset Unauth Count', 'Reset Retry Count'],
              target: 'ENUMERATE_WIFI_ENDPOINT_SETTINGS'
            }
          }
        },
        ENUMERATE_WIFI_ENDPOINT_SETTINGS: {
          invoke: {
            src: this.enumerateWiFiEndpointSettings.bind(this),
            id: 'enumerate-wifi-endpoint-settings',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'PULL_WIFI_ENDPOINT_SETTINGS'
            },
            onError: {
              actions: assign({ errorMessage: (context, event) => 'Failed to get enumeration number for wifi endpoint settings' }),
              target: 'FAILED'
            }
          }
        },
        PULL_WIFI_ENDPOINT_SETTINGS: {
          invoke: {
            src: this.pullWiFiEndpointSettings.bind(this),
            id: 'pull-wifi-endpoint-settings',
            onDone: {
              actions: [assign({ message: (context, event) => event.data }), 'Reset Retry Count'],
              target: 'CHECK_WIFI_ENDPOINT_SETTINGS_PULL_RESPONSE'
            },
            onError: [
              {
                cond: 'shouldRetry',
                actions: 'Increment Retry Count',
                target: 'ENUMERATE_WIFI_ENDPOINT_SETTINGS'
              },
              {
                actions: assign({ errorMessage: (context, event) => 'Failed to pull wifi endpoint settings' }),
                target: 'FAILED'
              }
            ]
          }
        },
        CHECK_WIFI_ENDPOINT_SETTINGS_PULL_RESPONSE: {
          entry: 'Read WiFi Endpoint Settings Pull Response',
          always: [
            {
              cond: 'isWifiProfilesExistsOnDevice',
              target: 'DELETE_WIFI_ENDPOINT_SETTINGS'
            }, {
              target: 'GET_WIFI_PORT_CONFIGURATION_SERVICE'
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
              actions: assign({ errorMessage: (context, event) => 'Failed to delete wifi endpoint settings' }),
              target: 'FAILED'
            }
          }
        },
        CHECK_WIFI_ENDPOINT_SETTINGS_DELETE_RESPONSE: {
          always: [
            {
              cond: 'isWifiProfileDeleted',
              target: 'FAILED'
            },
            {
              cond: 'isWifiProfilesExistsOnDevice',
              target: 'DELETE_WIFI_ENDPOINT_SETTINGS'
            }, {
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
              actions: assign({ errorMessage: (context, event) => 'Failed to get WiFi Port Configuration Service' }),
              target: 'FAILED'
            }
          }
        },
        CHECK_WIFI_PORT_CONFIGURATION_SERVICE: {
          always: [
            {
              cond: 'isLocalProfileSynchronizationNotEnabled',
              target: 'PUT_WIFI_PORT_CONFIGURATION_SERVICE'
            },
            {
              target: 'REQUEST_STATE_CHANGE_FOR_WIFI_PORT'
            }
          ]
        },
        PUT_WIFI_PORT_CONFIGURATION_SERVICE: {
          invoke: {
            src: this.putWiFiPortConfigurationService.bind(this),
            id: 'put-wifi-port-configuration-service',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'REQUEST_STATE_CHANGE_FOR_WIFI_PORT'
            },
            onError: {
              actions: assign({ errorMessage: (context, event) => 'Failed to put WiFi Port Configuration Service' }),
              target: 'FAILED'
            }
          }
        },
        REQUEST_STATE_CHANGE_FOR_WIFI_PORT: {
          invoke: {
            src: this.updateWifiPort.bind(this),
            id: 'request-state-change-for-wifi-port',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'GET_WIFI_PROFILE'
            },
            onError: {
              actions: assign({ errorMessage: (context, event) => 'Failed to update state change for wifi port' }),
              target: 'FAILED'
            }
          }
        },
        GET_WIFI_PROFILE: {
          invoke: {
            src: this.getWifiProfile.bind(this),
            id: 'get-wifi-profile',
            onDone: {
              target: 'CHECK_TO_ADD_WIFI_SETTINGS'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to get wifi profile from DB' }),
              target: 'FAILED'
            }
          }
        },
        CHECK_TO_ADD_WIFI_SETTINGS:{
          always: [
            {
              cond: 'is8021xProfileAssociated',
              target: 'ENTERPRISE_ASSISTANT_REQUEST'
            },
            {
              target: 'ADD_WIFI_SETTINGS'
            }
          ]
        },
        ENTERPRISE_ASSISTANT_REQUEST: {
          invoke: {
            src: async (context, event) => await initiateCertRequest(context, event),
            id: 'enterprise-assistant-request',
            onDone: {
              actions: [
                assign({ message: (context, event) => event.data })
              ],
              target: 'GENERATE_KEY_PAIR'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to initiate cert request with enterprise assistant in 802.1x' }),
              target: 'FAILED'
            }
          }
        },
        GENERATE_KEY_PAIR: {
          invoke: {
            src: this.generateKeyPair.bind(this),
            id: 'generate-key-pair',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to generate key pair in 802.1x' }),
              target: 'FAILED'
            }
          }
        },
        ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR: {
          invoke: {
            src: this.enumeratePublicPrivateKeyPair.bind(this),
            id: 'enumerate-public-private-key-pair',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'PULL_PUBLIC_PRIVATE_KEY_PAIR'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to enumerate public private key pair in 802.1x' }),
              target: 'FAILED'
            }
          }
        },
        PULL_PUBLIC_PRIVATE_KEY_PAIR: {
          invoke: {
            src: this.pullPublicPrivateKeyPair.bind(this),
            id: 'pull-public-private-key-pair',
            onDone: {
              actions: [assign({ message: (context, event) => event.data }), 'Reset Retry Count'],
              target: 'ENTERPRISE_ASSISTANT_RESPONSE'
            },
            onError: [{
              cond: 'shouldRetry',
              actions: 'Increment Retry Count',
              target: 'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR'
            }, {
              actions: assign({ errorMessage: 'Failed to pull public private key pair in 802.1x' }),
              target: 'FAILED'
            }]
          }
        },
        ENTERPRISE_ASSISTANT_RESPONSE: {
          invoke: {
            src: async (context, event) => await sendEnterpriseAssistantKeyPairResponse(context, event),
            id: 'enterprise-assistant-response',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'SIGN_CSR'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to send key pair to enterprise assistant in 802.1x' }),
              target: 'FAILED'
            }
          }
        },
        SIGN_CSR: {
          invoke: {
            src: this.signCSR.bind(this),
            id: 'sign-csr',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'GET_CERT_FROM_ENTERPRISE_ASSISTANT'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to have AMT sign CSR in 802.1x' }),
              target: 'FAILED'
            }
          }
        },
        GET_CERT_FROM_ENTERPRISE_ASSISTANT: {
          invoke: {
            src: async (context, event) => await getCertFromEnterpriseAssistant(context, event),
            id: 'get-cert-from-enterprise-assistant',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'ADD_CERTIFICATE'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to get cert from Microsoft CA in 802.1x' }),
              target: 'FAILED'
            }
          }
        },
        ADD_CERTIFICATE: {
          invoke: {
            src: this.addCertificate.bind(this),
            id: 'add-certificate',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'ADD_RADIUS_SERVER_ROOT_CERTIFICATE'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to add certificate in 802.1x' }),
              target: 'FAILED'
            }
          }
        },
        ADD_RADIUS_SERVER_ROOT_CERTIFICATE: {
          invoke: {
            src: this.addRadiusServerRootCertificate.bind(this),
            id: 'add-radius-server-root-certificate',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'ADD_WIFI_SETTINGS'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to add radius server root certificate in 802.1x' }),
              target: 'FAILED'
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
              actions: assign({ errorMessage: (context, event) => 'Failed to add wifi settings' }),
              target: 'FAILED'
            }
          }
        },
        CHECK_ADD_WIFI_SETTINGS_RESPONSE: {
          always: [
            {
              cond: 'isNotWifiProfileAdded',
              actions: assign({ errorMessage: (context, event) => 'Failed to add wifi settings' }),
              target: 'FAILED'
            },
            {
              cond: 'isWiFiProfilesExists',
              target: 'GET_WIFI_PROFILE'
            },
            {
              target: 'SUCCESS'
            }
          ]
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
            }
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
          entry: [assign({ statusMessage: (context, event) => 'Wireless Configured' }), 'Update Configuration Status'],
          type: 'final'
        }
      }
    }, {
      guards: {
        is8021xProfileAssociated: (context, event) => context.wifiProfile.ieee8021xProfileName != null , 
        isWiFiProfilesExists: (context, event) => context.wifiProfileCount < context.amtProfile.wifiConfigs.length,
        isWifiProfilesExistsOnDevice: (context, event) => context.wifiEndPointSettings.length !== 0,
        isNotWifiProfileAdded: (context, event) => context.message.Envelope.Body.AddWiFiSettings_OUTPUT.ReturnValue !== 0,
        isWifiProfileDeleted: (context, event) => context.message.Envelope.Body == null,
        isLocalProfileSynchronizationNotEnabled: (context, event) => context.message.Envelope.Body.AMT_WiFiPortConfigurationService.localProfileSynchronizationEnabled === 0,
        shouldRetry: (context, event) => context.retryCount < 3 && event.data instanceof UNEXPECTED_PARSE_ERROR
      },
      actions: {
        'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 },
        'Update Configuration Status': (context, event) => {
          const status = devices[context.clientId].status.Network
          const message = context.errorMessage ?? context.statusMessage
          devices[context.clientId].status.Network = `${status}. ${message}`
        },
        'Read WiFi Endpoint Settings Pull Response': this.readWiFiEndpointSettingsPullResponse.bind(this),
        'Reset Retry Count': assign({ retryCount: (context, event) => 0 }),
        'Increment Retry Count': assign({ retryCount: (context, event) => context.retryCount + 1 })
      }
    })

  constructor () {
    this.configurator = new Configurator()
    this.dbFactory = new DbCreatorFactory()
    this.logger = new Logger('Network_Configuration_State_Machine')
  }

  async enumerateWiFiEndpointSettings (context): Promise<any> {
    context.xmlMessage = context.cim.WiFiEndpointSettings.Enumerate()
    return await invokeWsmanCall(context, 2)
  }

  async pullWiFiEndpointSettings (context): Promise<any> {
    context.xmlMessage = context.cim.WiFiEndpointSettings.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  readWiFiEndpointSettingsPullResponse (context: WiFiConfigContext, event: WiFiConfigEvent): void {
    let wifiEndPointSettings = []
    if (context.message.Envelope.Body.PullResponse.Items?.CIM_WiFiEndpointSettings != null) {
      // CIM_WiFiEndpointSettings is an array if there more than one profile exists, otherwise its just an object from AMT
      if (Array.isArray(context.message.Envelope.Body.PullResponse.Items.CIM_WiFiEndpointSettings)) {
        wifiEndPointSettings = context.message.Envelope.Body.PullResponse.Items.CIM_WiFiEndpointSettings
      } else {
        wifiEndPointSettings.push(context.message.Envelope.Body.PullResponse.Items.CIM_WiFiEndpointSettings)
      }
    }

    context.wifiEndPointSettings = []
    if (wifiEndPointSettings.length > 0) {
      //  ignore the profiles with Priority 0 and without InstanceID, which is required to delete a wifi profile on AMT device
      wifiEndPointSettings.forEach(wifi => {
        if (wifi.InstanceID != null && wifi.Priority !== 0) {
          context.wifiEndPointSettings.push({ ...wifi })
        }
      })
    }
  }

  async deleteWiFiProfileOnAMTDevice (context: WiFiConfigContext, event: WiFiConfigEvent): Promise<any> {
    let wifiEndpoints = context.wifiEndPointSettings
    // Deletes first profile in the array
    const selector = { name: 'InstanceID', value: wifiEndpoints[0].InstanceID }
    context.xmlMessage = context.cim.WiFiEndpointSettings.Delete(selector)
    wifiEndpoints = wifiEndpoints.slice(1)
    context.wifiEndPointSettings = wifiEndpoints
    return await invokeWsmanCall(context)
  }

  async updateWifiPort (context: WiFiConfigContext, event: WiFiConfigEvent): Promise<any> {
    // Enumeration 32769 - WiFi is enabled in S0 + Sx/AC
    context.xmlMessage = context.cim.WiFiPort.RequestStateChange(32769)
    return await invokeWsmanCall(context)
  }

  async getWifiProfile (context: WiFiConfigContext, event: WiFiConfigEvent): Promise<void> {
    // Get WiFi profile information based on the profile name from db.
    this.db = await this.dbFactory.getDb()
    context.wifiProfile = await this.db.wirelessProfiles.getByName(context.amtProfile.wifiConfigs[context.wifiProfileCount].profileName, context.amtProfile.tenantId)
    if( context.wifiProfile.ieee8021xProfileName != null) {
      context.wifiProfile.ieee8021xProfileObject = await this.db.ieee8021xProfiles.getByName(context.wifiProfile.ieee8021xProfileName, context.wifiProfile.tenantId)
    }
    if (this.configurator?.secretsManager) {
      // Get WiFi profile pskPassphrase from vault
      const data = await this.configurator.secretsManager.getSecretAtPath(`Wireless/${context.wifiProfile.profileName}`) as WifiCredentials
      if (data != null) {
        context.wifiProfile.pskPassphrase = data.PSK_PASSPHRASE
      }
    }
  }

  // async check8021xProfileExists (context: WiFiConfigContext, event: WiFiConfigEvent): Promise<boolean> { 
  //   context.wifiProfile = await this.getWifiProfile(context.amtProfile.wifiConfigs[context.wifiProfileCount].profileName, context.amtProfile.tenantId)
  //   if(context.wifiProfile.ieee8021xProfileName != null) {
  //     return true
  //   }
  //   return false
  // }

  async addWifiConfigs (context: WiFiConfigContext, event: WiFiConfigEvent): Promise<any> {
    // Get WiFi profile information based on the profile name.
    const selector = { name: 'Name', value: 'WiFi Endpoint 0' }
    // Add  WiFi profile information to WiFi endpoint settings object
    const wifiEndpointSettings: CIM.Models.WiFiEndpointSettings = {
      ElementName: context.wifiProfile.profileName,
      InstanceID: `Intel(r) AMT:WiFi Endpoint Settings ${context.wifiProfile.profileName}`,
      AuthenticationMethod: context.wifiProfile.authenticationMethod as CIM.Types.WiFiEndpointSettings.AuthenticationMethod,
      EncryptionMethod: context.wifiProfile.encryptionMethod as CIM.Types.WiFiEndpointSettings.EncryptionMethod,
      SSID: context.wifiProfile.ssid,
      Priority: context.amtProfile.wifiConfigs[context.wifiProfileCount].priority,
      PSKPassPhrase: context.wifiProfile.pskPassphrase
    }

    // Increment the count to keep track of profiles added to AMT
    ++context.wifiProfileCount
    context.xmlMessage = context.amt.WiFiPortConfigurationService.AddWiFiSettings(wifiEndpointSettings, selector)
    return await invokeWsmanCall(context)
  }

  async getWiFiPortConfigurationService (context: WiFiConfigContext, event: WiFiConfigEvent): Promise<any> {
    context.xmlMessage = context.amt.WiFiPortConfigurationService.Get()
    return await invokeWsmanCall(context, 2)
  }

  async putWiFiPortConfigurationService (context: WiFiConfigContext, event: WiFiConfigEvent): Promise<any> {
    const wifiPortConfigurationService: AMT.Models.WiFiPortConfigurationService = context.message.Envelope.Body.AMT_WiFiPortConfigurationService
    wifiPortConfigurationService.localProfileSynchronizationEnabled = 3
    context.xmlMessage = context.amt.WiFiPortConfigurationService.Put(wifiPortConfigurationService)
    return await invokeWsmanCall(context, 2)
  }

  async generateKeyPair (context: WiFiConfigContext, event: WiFiConfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicKeyManagementService.GenerateKeyPair({ KeyAlgorithm: 0, KeyLength: 2048 })
    return await invokeWsmanCall(context)
  }

  async enumeratePublicPrivateKeyPair (context: WiFiConfigContext, event: WiFiConfigEvent): Promise<void> {
    context.keyPairHandle = context.message.Envelope.Body?.GenerateKeyPair_OUTPUT?.KeyPair?.ReferenceParameters?.SelectorSet?.Selector?._
    context.xmlMessage = context.amt.PublicPrivateKeyPair.Enumerate()
    return await invokeWsmanCall(context, 2)
  }

  async pullPublicPrivateKeyPair (context: WiFiConfigContext, event: WiFiConfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicPrivateKeyPair.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async signCSR (context: WiFiConfigContext, event: WiFiConfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicKeyManagementService.GeneratePKCS10RequestEx({
      KeyPair: '<a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address><a:ReferenceParameters><w:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicPrivateKeyPair</w:ResourceURI><w:SelectorSet><w:Selector Name="InstanceID">' + (context.message.response.keyInstanceId as string) + '</w:Selector></w:SelectorSet></a:ReferenceParameters>',
      SigningAlgorithm: 1,
      NullSignedCertificateRequest: context.message.response.csr
    })
    return await invokeWsmanCall(context)
  }

  async addCertificate (context: WiFiConfigContext, event: WiFiConfigEvent): Promise<void> {
    context.eaResponse = event.data.response
    const cert = event.data.response.certificate
    context.xmlMessage = context.amt.PublicKeyManagementService.AddCertificate({ CertificateBlob: cert })
    return await invokeWsmanCall(context)
  }

  async addRadiusServerRootCertificate (context: WiFiConfigContext, event: WiFiConfigEvent): Promise<void> {
    // To Do: Needs to replace the logic with how we will pull the radius server root certificate
    context.addCertResponse = context.message.Envelope.Body
    const cert = context.eaResponse.rootcert
    context.xmlMessage = context.amt.PublicKeyManagementService.AddTrustedRootCertificate({ CertificateBlob: cert })
    return await invokeWsmanCall(context)
  }
}
