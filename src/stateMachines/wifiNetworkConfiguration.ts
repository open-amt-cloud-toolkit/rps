/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMT, type CIM } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine, sendTo } from 'xstate'
import { type WirelessConfig } from '../models/RCS.Config.js'
import { type HttpHandler } from '../HttpHandler.js'
import Logger from '../Logger.js'
import { type AMTConfiguration } from '../models/index.js'
import { devices } from '../WebSocketListener.js'
import { Error } from './error.js'
import { Configurator } from '../Configurator.js'
import { DbCreatorFactory } from '../factories/DbCreatorFactory.js'
import { invokeWsmanCall } from './common.js'
import { type WifiCredentials } from '../interfaces/ISecretManagerService.js'
import { UNEXPECTED_PARSE_ERROR } from '../utils/constants.js'
import { getCertFromEnterpriseAssistant, initiateCertRequest, sendEnterpriseAssistantKeyPairResponse } from './enterpriseAssistant.js'

export interface WiFiConfigContext {
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
  wifiProfileName: string
  httpHandler: HttpHandler
  amt?: AMT.Messages
  cim?: CIM.Messages
  retryCount?: number
  eaResponse?: any
  addTrustedRootCertResponse?: any
  addCertResponse?: any
  keyPairHandle?: string
  wifiProfile?: WirelessConfig
  profilesAdded?: string
  profilesFailed?: string
  authProtocol: number
  onlyLocalWifiSyncEnabled?: boolean
}

export interface WiFiConfigEvent {
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
        wifiProfileName: null,
        message: null,
        clientId: '',
        xmlMessage: null,
        errorMessage: '',
        statusMessage: null,
        generalSettings: null,
        wifiSettings: null,
        wifiEndPointSettings: [],
        authProtocol: 0
      },
      id: 'wifi-network-configuration-machine',
      initial: 'ACTIVATION',
      states: {
        ACTIVATION: {
          on: {
            WIFICONFIG: {
              actions: [assign({ wifiProfileCount: () => 0 }), 'Reset Unauth Count', 'Reset Retry Count'],
              target: 'GET_WIFI_PORT_CONFIGURATION_SERVICE'
            }
          }
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
              target: 'CHECK_FOR_WIFI_PROFILES'
            },
            onError: {
              actions: assign({ errorMessage: (context, event) => 'Failed to update state change for wifi port' }),
              target: 'FAILED'
            }
          }
        },
        CHECK_FOR_WIFI_PROFILES: {
          always: [
            {
              cond: 'isWiFiProfilesExist',
              target: 'GET_WIFI_PROFILE'
            },
            {
              target: 'SUCCESS_SYNC_ONLY'
            }
          ]
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
        CHECK_TO_ADD_WIFI_SETTINGS: {
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
            onDone: [{
              cond: 'isMSCHAPv2',
              actions: assign({ eaResponse: (context, event) => event.data.response }),
              target: 'CHECK_RADIUS_SERVER_ROOT_CERTIFICATE'
            }, {
              actions: assign({ message: (context, event) => event.data }),
              target: 'GENERATE_KEY_PAIR'
            }],
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
              actions: assign({ addCertResponse: (context, event) => event.data.Envelope?.Body }),
              target: 'CHECK_RADIUS_SERVER_ROOT_CERTIFICATE'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to add certificate in 802.1x' }),
              target: 'FAILED'
            }
          }
        },
        CHECK_RADIUS_SERVER_ROOT_CERTIFICATE: {
          always: [
            {
              cond: 'isTrustedRootCertifcateExists',
              target: 'ADD_WIFI_SETTINGS'
            },
            {
              target: 'ADD_RADIUS_SERVER_ROOT_CERTIFICATE'
            }
          ]
        },
        ADD_RADIUS_SERVER_ROOT_CERTIFICATE: {
          invoke: {
            src: this.addRadiusServerRootCertificate.bind(this),
            id: 'add-radius-server-root-certificate',
            onDone: {
              actions: assign({ addTrustedRootCertResponse: (context, event) => event.data.Envelope.Body }),
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
              actions: 'Check Return Value',
              target: 'CHECK_ADD_WIFI_SETTINGS_RESPONSE'
            },
            onError: {
              actions: assign({
                profilesFailed: (context, event) => context.profilesFailed == null ? `${context.wifiProfileName}` : `${context.profilesFailed}, ${context.wifiProfileName}`
              }),
              target: 'CHECK_ADD_WIFI_SETTINGS_RESPONSE'
            }
          }
        },
        CHECK_ADD_WIFI_SETTINGS_RESPONSE: {
          always: [
            {
              cond: 'isMoreWiFiProfiles',
              target: 'GET_WIFI_PROFILE'
            },
            {
              target: 'SUCCESS'
            }
          ]
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
        },
        SUCCESS_SYNC_ONLY: {
          entry: [assign({ statusMessage: (context, event) => 'Wireless Only Local Profile Sync Configured' }), 'Update Configuration Status'],
          type: 'final'
        }
      }
    }, {
      guards: {
        is8021xProfileAssociated: (context, event) => context.wifiProfile.ieee8021xProfileName != null && context.eaResponse == null && context.addCertResponse == null,
        isMoreWiFiProfiles: (context, event) => context.wifiProfileCount < context.amtProfile.wifiConfigs.length,
        isWiFiProfilesExist: (context, event) => context.amtProfile.wifiConfigs.length > 0,
        isLocalProfileSynchronizationNotEnabled: (context, event) => context.message.Envelope.Body.AMT_WiFiPortConfigurationService.localProfileSynchronizationEnabled === 0,
        isTrustedRootCertifcateExists: (context, event) => {
          const res = devices[context.clientId].trustedRootCertificateResponse
          const cert = devices[context.clientId].trustedRootCertificate
          if (res != null && cert === context.eaResponse.rootcert) {
            return true
          }
          return false
        },
        isMSCHAPv2: (context, event) => context.wifiProfile.ieee8021xProfileObject.authenticationProtocol === 2,
        shouldRetry: (context, event) => context.retryCount < 3 && event.data instanceof UNEXPECTED_PARSE_ERROR
      },
      actions: {
        'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 },
        'Update Configuration Status': (context, event) => {
          const { clientId, profilesAdded, profilesFailed, statusMessage, errorMessage } = context
          const status = devices[clientId].status.Network
          let message
          if (errorMessage) {
            message = errorMessage
          } else if (profilesFailed) {
            message = profilesAdded != null ? `Added ${profilesAdded} WiFi Profiles. Failed to add ${profilesFailed}` : `Failed to add ${profilesFailed}`
          } else {
            message = statusMessage
          }
          devices[context.clientId].status.Network = status ? `${status}. ${message}` : message
        },
        'Reset Retry Count': assign({ retryCount: (context, event) => 0 }),
        'Increment Retry Count': assign({ retryCount: (context, event) => context.retryCount + 1 }),
        'Check Return Value': assign({
          profilesAdded: (context, event) => {
            if (event.data.Envelope?.Body?.AddWiFiSettings_OUTPUT?.ReturnValue === 0) {
              if (context.profilesAdded == null) {
                return `${context.wifiProfileName}`
              } else {
                return `${context.profilesAdded}, ${context.wifiProfileName}`
              }
            } else {
              return context.profilesAdded
            }
          },
          profilesFailed: (context, event) => {
            if (event.data.Envelope?.Body?.AddWiFiSettings_OUTPUT?.ReturnValue !== 0) {
              if (context.profilesFailed == null) {
                return `${context.wifiProfileName}`
              } else {
                return `${context.profilesFailed}, ${context.wifiProfileName}`
              }
            } else {
              return context.profilesFailed
            }
          }
        })
      }
    })

  constructor () {
    this.configurator = new Configurator()
    this.dbFactory = new DbCreatorFactory()
    this.logger = new Logger('Network_Configuration_State_Machine')
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
    if (context.wifiProfile.ieee8021xProfileName != null) {
      context.wifiProfile.ieee8021xProfileObject = await this.db.ieee8021xProfiles.getByName(context.wifiProfile.ieee8021xProfileName, context.wifiProfile.tenantId)
      context.authProtocol = context.wifiProfile.ieee8021xProfileObject.authenticationProtocol
    }
    if (this.configurator?.secretsManager) {
      // Get WiFi profile pskPassphrase from vault
      const data = await this.configurator.secretsManager.getSecretAtPath(`Wireless/${context.wifiProfile.profileName}`) as WifiCredentials
      if (data != null) {
        context.wifiProfile.pskPassphrase = data.PSK_PASSPHRASE
      }
    }
  }

  async addWifiConfigs (context: WiFiConfigContext, event: WiFiConfigEvent): Promise<any> {
    if (context.addTrustedRootCertResponse != null) {
      devices[context.clientId].trustedRootCertificateResponse = context.addTrustedRootCertResponse
    } else {
      context.addTrustedRootCertResponse = devices[context.clientId].trustedRootCertificateResponse
    }
    // Get WiFi profile information based on the profile name.
    const selector = { name: 'Name', value: 'WiFi Endpoint 0' }
    // Add  WiFi profile information to WiFi endpoint settings object
    const wifiEndpointSettings: CIM.Models.WiFiEndpointSettings = {
      ElementName: context.wifiProfile.profileName,
      InstanceID: `Intel(r) AMT:WiFi Endpoint Settings ${context.wifiProfile.profileName}`,
      AuthenticationMethod: context.wifiProfile.authenticationMethod as CIM.Types.WiFiEndpointSettings.AuthenticationMethod,
      EncryptionMethod: context.wifiProfile.encryptionMethod as CIM.Types.WiFiEndpointSettings.EncryptionMethod,
      SSID: context.wifiProfile.ssid,
      Priority: context.amtProfile.wifiConfigs[context.wifiProfileCount].priority
    }

    if (wifiEndpointSettings.AuthenticationMethod === 5 || wifiEndpointSettings.AuthenticationMethod === 7) {
      // const authProtocol = context.wifiProfile.ieee8021xProfileObject.authenticationProtocol
      const ieee8021xSettings: CIM.Models.IEEE8021xSettings = {
        ElementName: context.wifiProfile.ieee8021xProfileObject.profileName,
        InstanceID: `Intel(r) AMT: 8021X Settings ${context.wifiProfile.ieee8021xProfileObject.profileName}`,
        AuthenticationProtocol: context.authProtocol as CIM.Types.IEEE8021xSettings.AuthenticationProtocol,
        Username: context.eaResponse?.username
      }
      if (context.authProtocol === 2) {
        ieee8021xSettings.Password = context.eaResponse?.password
      }
      const cert = context.authProtocol === 2 ? null : context.addCertResponse?.AddCertificate_OUTPUT?.CreatedCertificate?.ReferenceParameters?.SelectorSet?.Selector?._
      const root = context.addTrustedRootCertResponse?.AddTrustedRootCertificate_OUTPUT?.CreatedCertificate?.ReferenceParameters?.SelectorSet?.Selector?._
      context.xmlMessage = context.amt.WiFiPortConfigurationService.AddWiFiSettings(wifiEndpointSettings, selector, ieee8021xSettings, cert, root)
    } else {
      wifiEndpointSettings.PSKPassPhrase = context.wifiProfile.pskPassphrase
      context.xmlMessage = context.amt.WiFiPortConfigurationService.AddWiFiSettings(wifiEndpointSettings, selector)
    }

    // Increment the count to keep track of profiles added to AMT
    context.wifiProfileName = context.wifiProfile.profileName
    ++context.wifiProfileCount
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
    const cert = context.eaResponse.rootcert
    context.xmlMessage = context.amt.PublicKeyManagementService.AddTrustedRootCertificate({ CertificateBlob: cert })
    return await invokeWsmanCall(context)
  }
}
