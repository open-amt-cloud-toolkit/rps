/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type CIM, type AMT, type IPS } from '@open-amt-cloud-toolkit/wsman-messages'
import { createMachine, assign, sendTo } from 'xstate'
import { CertManager } from '../certManager'
import { Configurator } from '../Configurator'
import { type HttpHandler } from '../HttpHandler'
import Logger from '../Logger'
import { type CIRAConfig } from '../models/RCS.Config'
import { NodeForge } from '../NodeForge'
import { DbCreatorFactory } from '../factories/DbCreatorFactory'
import { SignatureHelper } from '../utils/SignatureHelper'
import { Validator } from '../Validator'
import { devices } from '../WebSocketListener'
import { type AMTConfiguration } from '../models'
import { Error } from './error'
import { invokeWsmanCall } from './common'
import { Environment } from '../utils/Environment'
import statsD from '../utils/stats'

export interface UnconfigContext {
  clientId: string
  status: 'success' | 'error' | 'wsman' | 'heartbeat_request'
  errorMessage: string
  xmlMessage: string // the message we send to the device
  message: any // the parsed json response
  ciraConfig: CIRAConfig
  profile: AMTConfiguration
  statusMessage: string
  privateCerts: any[]
  httpHandler: HttpHandler
  tlsSettingData: any[]
  publicKeyCertificates: any[]
  is8021xProfileUpdated?: boolean
  wifiEndPointSettings?: any[]
  amt?: AMT.Messages
  ips?: IPS.Messages
  cim?: CIM.Messages
  retryCount?: number
  wiredSettings: any
  wifiSettings: any
}
interface UnconfigEvent {
  type: 'REMOVECONFIG' | 'ONFAILURE'
  clientId: string
  data?: any
}
export class Unconfiguration {
  nodeForge: NodeForge
  certManager: CertManager
  signatureHelper: SignatureHelper
  configurator: Configurator
  validator: Validator
  logger: Logger
  dbFactory: DbCreatorFactory
  db: any
  error: Error = new Error()

  machine =

    /** @xstate-layout N4IgpgJg5mDOIC5QEMDGAXAlgN2Vg9gHYC0AtmgBaaFgB0AqgHIAKASgPIBqAkgMrftGAUQAiAYgCCAYQAq3ThLmDEoAA75YmAoRUgAHogCMAVgDMABlrGATADZzt6+cOGA7IYAcHgDQgAnogALB7WtACcjubmxrYm1qaBgQC+Sb5oWLjaZJTUdADiQjIA+gXCrBIAMkW8hXKMebxiEER01Nj4ANZ0sGCEEMQwNABOyAA2PehYhFDwSCDqmtq6BghOgca0HoaBtmGudjHWxr4BCLGutNYers6uIdYHtilpGDh4mETZqFQ0tAXFpSE5SqNRkdQaYjAQyG+CGtFUozwADNYaRaD0+gNelCxhMpjNdAstB8dHMViYLFY7A4nC53F4Tohzpdrrd7o9niB0m8suRvrlaFJBJwgcUABoAWSqMnYRQAUrxBGJCRpiURlohrO5Qg8Yjs9o9rIyzoEwrRzGE4g9DLZXBEwpzuZkSV8fnRWEIJCISkIypVqrVuPVGirFiSNQhTLTLrYzB5zB5jGFTK5jv4mabzZabNbbfbHa9nZ8+W7BQAJIRSADSRRE3AKvGKHsqEuVcyJSzJiFMxlTlzCgUMV0HdtsDPTCF7ploiTCNgtUfMWuSqS5hfexZyv24zF4RTL7EbACEJDURKD6LugTwpEImi1aG1Ot1ev0KBp0AAjZA9CATACuqihmqpKgCswQeOEYQOLEjiGAuqbGi4xiQS4CTxlc6GxgWGQbiQJYCjue4Hsep6iBeV6sDed5QjCcIIsiqLoq+xDvrAX4-pAAFAe2qqdmBQReFBME2tY8HJohE5bIYlxalcWrbB4gSmB4OE8i6BG-F6IjCGKMi3qwdRSGWEhBvevxPl0zGYqgUJYEimCoHgYDAfx+iIPOtA9kmFqzlqaanAOoQJjYSmBPEISqauTp4a6Arabp+mikGxmmYwkLQrC8KIugKJDGiGL9LZQz2Y5zmueGXYINcoQ2h4pgJBECEBUYdiBOE5x7K4gSuHm1hqUW+FbnQXoSkGFHma0hDtFZhXEMgECkNQ3EVeqVU1bQdUNaa9gSS1CDhTJ5iBM4J13K4vXHQNsWaSNIhjYwE20VlDG5Uxc0LUthArbxYZrQJ1X7JtY7bU1e3GmOlimLsVzwdEiYDtdvLDbQE3NBZ03PtZ-Q-WofGVQDG1bY1u0pvtQ4ySdLi2Cm0N7JaTzReuyP8r8T2ZfROV5QVLG4-M+P-e5gO1SDJPNcaPZQ9Yg607sdo2qYSMaSjvASCKIhCNRk2Ppjs3INgYDEBAYDYI5Lm-SBEYUpYNj2JEdKeD4E7Rg1dohG4F0JCpSubqzdCq+rmvcLeGV0dljH5ei+uG8bpu2atoFC9bVJ27SbiO8ag46jsURiQasaMy8uEs6WQIcKw2uWXQz1DHFNAJ1bZg29S9vp+OpypjJsROBYS5hNY+ZM8Xyt+7QZfsBXggAGKmRUogN1Vye2zSzht07pyJhsSZxDY8HGMYCY+0No9BgoFTcN6dYNk2noVK2C8A+FzjmgmT-rLGSYQ5mFpWmJea7CkVchB8DG1mCgZmI9SxMDYFwPgAhhAiAfknCKVh+42H7hEa4+0D4bGCMdMI-dbS9i2EfOu+RCg+j9CCQMwYkHkhQu1W0RwTAeF2NsBwxokyQTEgfOwm8dheFIbdQUwpRRFElNKWUCplAWzcisJwQNEgxHOuJMmnC7i0FsMpcwPYvCsPcA6Ie6lfalmbN6QEwIAxgiDA0OhmpXAqU2DERwSk3CYPXh5MI3CTBLjHPvARUUi7GOPqWYylYaxXyEI2IozY752MjA8C4HgIjQ3iMdMcklTg0zNPGfeLgeo50RkYwaZDaBEX3IeGQJ4zwURqFRYOQh4nhWNOdGMDxWEpl2GYfqxSboowSkIPSBkjImSDPE4wJhNF-20bYLRNIkJiXaiFCwEUaYTKEf0+641CiXnGf3KwPknAENJh4g6vVNp3EcHOXsA8FYbNHhRPZoR97QSOWDFSSFzlmAiDYA+sZ4IriCSU4RAdRBB1vPE+CQNdE6IeIacmF0vL7C8ShUwXjlKpnuaXVg5d4nQUgnaZMNoTqOH2o4UIsYoxJi1A45SgS1zDxMYRRgZ8L61nrFEm+LZ4kqUSOaK4B94IPAiLYThXjLg+L4f4sc9KYolwFDPbgc9EGyIJkLcKWpNFoqptBTw+xOFjnNIOPUA52GOCxQKGBPB+CCHnqqwW9DeybV7MdBILrTBDgWZYK4o4VK2j1cYC19d7WJ3JKczwgCkhAA */
    createMachine<UnconfigContext, UnconfigEvent>({
      preserveActionOrder: true,
      predictableActionArguments: true,
      context: {
        clientId: '',
        httpHandler: null,
        status: 'success',
        errorMessage: '',
        xmlMessage: '',
        statusMessage: '',
        message: null,
        ciraConfig: null,
        profile: null,
        privateCerts: [],
        tlsSettingData: [],
        publicKeyCertificates: [],
        is8021xProfileUpdated: false,
        wifiEndPointSettings: [],
        wiredSettings: null,
        wifiSettings: null
      },
      id: 'unconfiuration-machine',
      initial: 'UNCONFIGURED',
      states: {
        UNCONFIGURED: {
          on: {
            REMOVECONFIG: {
              actions: ['Reset Unauth Count', 'Reset Retry Count'],
              target: 'ENUMERATE_ETHERNET_PORT_SETTINGS'
            }
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
            onDone: 'ENUMERATE_ETHERNET_PORT_SETTINGS'
          },
          on: {
            ONFAILURE: 'FAILURE'
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
              target: 'ERROR'
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
                target: 'FAILURE'
              }
            ]
          }
        },
        CHECK_ETHERNET_PORT_SETTINGS_PULL_RESPONSE: {
          entry: 'Read Ethernet Port Settings',
          always: [
            {
              cond: 'isWiredSupportedOnDevice',
              target: 'GET_8021X_PROFILE'
            }, {
              cond: 'isWifiOnlyDevice',
              target: 'ENUMERATE_WIFI_ENDPOINT_SETTINGS'
            }
          ]
        },
        GET_8021X_PROFILE: {
          invoke: {
            src: this.get8021xProfile.bind(this),
            id: 'get-8021x-profile',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'CHECK_GET_8021X_PROFILE_RESPONSE'
            },
            onError: {
              actions: assign({ errorMessage: (context, event) => 'Failed to get 8021x profile' }),
              target: 'FAILURE'
            }
          }
        },
        CHECK_GET_8021X_PROFILE_RESPONSE: {
          always: [
            {
              cond: 'is8021xProfileEnabled',
              target: 'DISABLE_IEEE8021X_WIRED'
            }, {
              cond: 'isWifiSupportedOnDevice',
              target: 'ENUMERATE_WIFI_ENDPOINT_SETTINGS'
            }, {
              target: 'REMOVE_REMOTE_ACCESS_POLICY_RULE_USER_INITIATED'
            }
          ]
        },
        DISABLE_IEEE8021X_WIRED: {
          invoke: {
            src: this.disableWired8021xConfiguration.bind(this),
            id: 'disable-Wired-8021x-Configuration',
            onDone: [{
              cond: 'isWifiSupportedOnDevice',
              actions: assign({ is8021xProfileUpdated: true }),
              target: 'ENUMERATE_WIFI_ENDPOINT_SETTINGS'
            }, {
              target: 'REMOVE_REMOTE_ACCESS_POLICY_RULE_USER_INITIATED'
            }],
            onError: {
              actions: assign({ errorMessage: (context, event) => 'Failed to disable 8021x profile' }),
              target: 'FAILURE'
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
              target: 'FAILURE'
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
                target: 'FAILURE'
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
              target: 'REMOVE_REMOTE_ACCESS_POLICY_RULE_USER_INITIATED'
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
              target: 'FAILURE'
            }
          }
        },
        CHECK_WIFI_ENDPOINT_SETTINGS_DELETE_RESPONSE: {
          always: [
            {
              cond: 'isWifiProfileDeleted',
              target: 'FAILURE'
            },
            {
              cond: 'isWifiProfilesExistsOnDevice',
              target: 'DELETE_WIFI_ENDPOINT_SETTINGS'
            }, {
              target: 'REMOVE_REMOTE_ACCESS_POLICY_RULE_USER_INITIATED'
            }
          ]
        },
        REMOVE_REMOTE_ACCESS_POLICY_RULE_USER_INITIATED: {
          invoke: {
            src: this.removeRemoteAccessPolicyRuleUserInitiated.bind(this),
            id: 'remove-remote-access-policy-rule-user-initiated',
            onDone: 'REMOVE_REMOTE_ACCESS_POLICY_RULE_ALERT',
            onError: [
              {
                cond: 'isExpectedBadRequest',
                target: 'REMOVE_REMOTE_ACCESS_POLICY_RULE_ALERT'
              }, {
                target: 'ERROR'
              }
            ]
          }
        },
        REMOVE_REMOTE_ACCESS_POLICY_RULE_ALERT: {
          invoke: {
            src: this.removeRemoteAccessPolicyRuleAlert.bind(this),
            id: 'remove-remote-access-policy-rule-rule-alert',
            onDone: 'REMOVE_REMOTE_ACCESS_POLICY_RULE_PERIODIC',
            onError: 'REMOVE_REMOTE_ACCESS_POLICY_RULE_PERIODIC'
          }
        },
        REMOVE_REMOTE_ACCESS_POLICY_RULE_PERIODIC: {
          invoke: {
            src: this.removeRemoteAccessPolicyRulePeriodic.bind(this),
            id: 'remove-remote-access-policy-rule-periodic',
            onDone: 'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP',
            onError: 'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP'
          }
        },
        ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP: {
          invoke: {
            src: this.enumerateManagementPresenceRemoteSAP.bind(this),
            id: 'enumerate-management-presence-remote-sap',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP'
            },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to enumerate Management Presence Remote SAP' }),
              target: 'FAILURE'
            }
          }
        },
        PULL_MANAGEMENT_PRESENCE_REMOTE_SAP: {
          invoke: {
            src: this.pullManagementPresenceRemoteSAP.bind(this),
            id: 'pull-management-presence-remote-sap',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP_RESPONSE'
            },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to Pull Management Presence Remote SAP' }),
              target: 'FAILURE'
            }
          }
        },
        PULL_MANAGEMENT_PRESENCE_REMOTE_SAP_RESPONSE: {
          always: [
            {
              cond: 'hasMPSEntries', // this could be problematic
              target: 'DELETE_MANAGEMENT_PRESENCE_REMOTE_SAP'
            }, {
              target: 'ENUMERATE_TLS_SETTING_DATA'
            }
          ]
        },
        DELETE_MANAGEMENT_PRESENCE_REMOTE_SAP: {
          invoke: {
            src: this.deleteRemoteAccessService.bind(this),
            id: 'delete-management-presence-remote-sap',
            onDone: {
              actions: [assign({ statusMessage: (context, event) => 'unconfigured' }), 'Update CIRA Status'],
              target: 'ENUMERATE_TLS_SETTING_DATA'
            },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to delete Management Presence Remote SAP' }),
              target: 'FAILURE'
            }
          }
        },
        ENUMERATE_TLS_SETTING_DATA: {
          invoke: {
            src: this.enumerateTLSSettingData.bind(this),
            id: 'enumerate-tls-setting-data',
            onDone: { actions: assign({ message: (context, event) => event.data }), target: 'PULL_TLS_SETTING_DATA' },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to enumerate TLS Setting Data' }),
              target: 'FAILURE'
            }
          }
        },
        PULL_TLS_SETTING_DATA: {
          invoke: {
            src: this.pullTLSSettingData.bind(this),
            id: 'pull-tls-setting-data',
            onDone: { actions: assign({ message: (context, event) => event.data }), target: 'PULL_TLS_SETTING_DATA_RESPONSE' },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to pull TLS Setting Data' }),
              target: 'FAILURE'
            }
          }
        },
        PULL_TLS_SETTING_DATA_RESPONSE: {
          always: [
            { cond: 'tlsSettingDataEnabled', target: 'DISABLE_TLS_SETTING_DATA' },
            { cond: 'is8021xProfileDisabled', target: 'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR' },
            { target: 'ENUMERATE_PUBLIC_KEY_CERTIFICATE' }
          ]
        },
        DISABLE_TLS_SETTING_DATA: {
          invoke: {
            src: this.disableRemoteTLSSettingData.bind(this),
            id: 'disable-tls-setting-data',
            onDone: { actions: assign({ message: (context, event) => event.data }), target: 'DISABLE_TLS_SETTING_DATA_RESPONSE' },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to disable TLS Setting Data' }),
              target: 'FAILURE'
            }
          }
        },
        DISABLE_TLS_SETTING_DATA_2: { // TODO: REFACTOR TO USE EXISITING PUT
          invoke: {
            src: this.disableLocalTLSSettingData.bind(this),
            id: 'disable-tls-setting-data-2',
            onDone: { actions: assign({ message: (context, event) => event.data }), target: 'DISABLE_TLS_SETTING_DATA_RESPONSE' },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to disable TLS Setting Data' }),
              target: 'FAILURE'
            }
          }
        },
        DISABLE_TLS_SETTING_DATA_RESPONSE: {
          always: [
            { cond: 'is8023TLS', target: 'DISABLE_TLS_SETTING_DATA_2' },
            { cond: 'isLMSTLSSettings', target: 'SETUP_AND_CONFIGURATION_SERVICE_COMMIT_CHANGES' },
            { target: 'FAILURE' }
          ]
        },
        SETUP_AND_CONFIGURATION_SERVICE_COMMIT_CHANGES: {
          invoke: {
            src: this.commitSetupAndConfigurationService.bind(this),
            id: 'setup-and-configuration-service-commit-changes',
            onDone: { actions: [assign({ statusMessage: (context, event) => 'unconfigured' }), 'Update TLS Status'], target: 'SETUP_AND_CONFIGURATION_SERVICE_COMMIT_CHANGES_RESPONSE' },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed at setup and configuration service commit changes' }),
              target: 'FAILURE'
            }
          }
        },
        SETUP_AND_CONFIGURATION_SERVICE_COMMIT_CHANGES_RESPONSE: {
          after: { DELAY_TIME_SETUP_AND_CONFIG_SYNC: 'ENUMERATE_TLS_CREDENTIAL_CONTEXT' }
        },
        ENUMERATE_TLS_CREDENTIAL_CONTEXT: {
          invoke: {
            src: this.enumerateTLSCredentialContext.bind(this),
            id: 'enumerate-tls-credential-context',
            onDone: { actions: assign({ message: (context, event) => event.data }), target: 'PULL_TLS_CREDENTIAL_CONTEXT' },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to enumerate TLS Credential context' }),
              target: 'FAILURE'
            }
          }
        },
        PULL_TLS_CREDENTIAL_CONTEXT: {
          invoke: {
            src: this.pullTLSCredentialContext.bind(this),
            id: 'pull-tls-credential-context',
            onDone: { actions: assign({ message: (context, event) => event.data }), target: 'PULL_TLS_CREDENTIAL_CONTEXT_RESPONSE' },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to pull TLS Credential context' }),
              target: 'FAILURE'
            }
          }
        },
        PULL_TLS_CREDENTIAL_CONTEXT_RESPONSE: {
          always: [
            { cond: 'hasTLSCredentialContext', target: 'DELETE_TLS_CREDENTIAL_CONTEXT' },
            { target: 'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR' }
          ]
        },
        DELETE_TLS_CREDENTIAL_CONTEXT: {
          invoke: {
            src: this.deleteTLSCredentialContext.bind(this),
            id: 'delete-tls-credential-context',
            onDone: 'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to delete TLS Credential context' }),
              target: 'FAILURE'
            }
          }
        },
        ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR: {
          invoke: {
            src: this.enumeratePublicPrivateKeyPair.bind(this),
            id: 'enumerate-public-private-key-pair',
            onDone: { actions: assign({ message: (context, event) => event.data }), target: 'PULL_PUBLIC_PRIVATE_KEY_PAIR' },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to enumerate public private key pair' }),
              target: 'FAILURE'
            }
          }
        },
        PULL_PUBLIC_PRIVATE_KEY_PAIR: {
          invoke: {
            src: this.pullPublicPrivateKeyPair.bind(this),
            id: 'pull-public-private-key-pair',
            onDone: {
              actions: assign({
                privateCerts: (context, event) => {
                  if (event.data.Envelope.Body.PullResponse.Items === '') return []
                  if (Array.isArray(event.data.Envelope.Body.PullResponse.Items?.AMT_PublicPrivateKeyPair)) {
                    return event.data.Envelope.Body.PullResponse.Items.AMT_PublicPrivateKeyPair
                  } else {
                    return [event.data.Envelope.Body.PullResponse.Items.AMT_PublicPrivateKeyPair]
                  }
                }
              }),
              target: 'PULL_PUBLIC_PRIVATE_KEY_PAIR_RESPONSE'
            },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to pull public private key pair' }),
              target: 'FAILURE'
            }
          }
        },
        PULL_PUBLIC_PRIVATE_KEY_PAIR_RESPONSE: {
          always: [
            { cond: 'hasPrivateCerts', target: 'DELETE_PUBLIC_PRIVATE_KEY_PAIR' },
            { target: 'ENUMERATE_PUBLIC_KEY_CERTIFICATE' }
          ]
        },
        DELETE_PUBLIC_PRIVATE_KEY_PAIR: {
          invoke: {
            src: this.deletePublicPrivateKeyPair.bind(this),
            id: 'delete-public-private-key-pair',
            onDone: { actions: assign({ message: (context, event) => event.data }), target: 'PULL_PUBLIC_PRIVATE_KEY_PAIR_RESPONSE' },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to delete public private key pair' }),
              target: 'FAILURE'
            }
          }
        },
        ENUMERATE_PUBLIC_KEY_CERTIFICATE: {
          invoke: {
            src: this.enumeratePublicKeyCertificate.bind(this),
            id: 'enumerate-public-key-certificate',
            onDone: { actions: assign({ message: (context, event) => event.data }), target: 'PULL_PUBLIC_KEY_CERTIFICATE' },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to enumerate public key certificate' }),
              target: 'FAILURE'
            }
          }
        },
        PULL_PUBLIC_KEY_CERTIFICATE: {
          invoke: {
            src: this.pullPublicKeyCertificate.bind(this),
            id: 'pull-public-key-certificate',
            onDone: {
              actions: assign({
                publicKeyCertificates: (context, event) => {
                  if (event.data.Envelope.Body.PullResponse.Items === '') return []
                  if (Array.isArray(event.data.Envelope.Body.PullResponse.Items?.AMT_PublicKeyCertificate)) {
                    return event.data.Envelope.Body.PullResponse.Items.AMT_PublicKeyCertificate
                  } else {
                    return [event.data.Envelope.Body.PullResponse.Items.AMT_PublicKeyCertificate]
                  }
                }
              }),
              target: 'PULL_PUBLIC_KEY_CERTIFICATE_RESPONSE'
            },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to pull public key certificate' }),
              target: 'FAILURE'
            }
          }
        },
        PULL_PUBLIC_KEY_CERTIFICATE_RESPONSE: {
          always: [
            { cond: 'hasPublicKeyCertificate', target: 'DELETE_PUBLIC_KEY_CERTIFICATE' },
            { target: 'GET_ENVIRONMENT_DETECTION_SETTINGS' }
          ]
        },
        DELETE_PUBLIC_KEY_CERTIFICATE: {
          invoke: {
            src: this.deletePublicKeyCertificate.bind(this),
            id: 'delete-public-key-certificate',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'PULL_PUBLIC_KEY_CERTIFICATE_RESPONSE'
            }, // check if there is any more certificates
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to delete public key certificate' }),
              target: 'FAILURE'
            }
          }
        },
        GET_ENVIRONMENT_DETECTION_SETTINGS: {
          invoke: {
            src: this.getEnvironmentDetectionSettings.bind(this),
            id: 'get-environment-detection-settings',
            onDone: { actions: assign({ message: (context, event) => event.data }), target: 'GET_ENVIRONMENT_DETECTION_SETTINGS_RESPONSE' },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to get environment detection settings' }),
              target: 'FAILURE'
            }
          }
        },
        GET_ENVIRONMENT_DETECTION_SETTINGS_RESPONSE: {
          always: [
            {
              cond: 'hasEnvSettings',
              target: 'CLEAR_ENVIRONMENT_DETECTION_SETTINGS'
            }, {
              target: 'SUCCESS'
            }
          ]
        },
        CLEAR_ENVIRONMENT_DETECTION_SETTINGS: {
          invoke: {
            src: this.clearEnvironmentDetectionSettings.bind(this),
            id: 'put-environment-detection-settings',
            onDone: {
              target: 'SUCCESS'
            },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to put environment detection settings' }),
              target: 'FAILURE'
            }
          }
        },
        FAILURE: {
          entry: ['Update Status'],
          type: 'final'
        },
        SUCCESS: {
          entry: ['Metric Capture'],
          type: 'final'
        }
      }
    }, {
      delays: {
        DELAY_TIME_SETUP_AND_CONFIG_SYNC: () => Environment.Config.delay_setup_and_config_sync
      },
      guards: {
        isExpectedBadRequest: (context, event) => event.data?.statusCode === 400,
        hasPrivateCerts: (context, event) => context.privateCerts.length > 0,
        isLMSTLSSettings: (context, event) => context.message.Envelope.Body.AMT_TLSSettingData?.ElementName === 'Intel(r) AMT LMS TLS Settings',
        is8023TLS: (context, event) => context.message.Envelope.Body.AMT_TLSSettingData?.ElementName === 'Intel(r) AMT 802.3 TLS Settings' && context.tlsSettingData[1].Enabled,
        tlsSettingDataEnabled: (context, event) => context.message.Envelope.Body.PullResponse.Items.AMT_TLSSettingData?.[0].Enabled || context.message.Envelope.Body.PullResponse.Items.AMT_TLSSettingData?.[1].Enabled,
        hasMPSEntries: (context, event) => context.message.Envelope.Body.PullResponse.Items?.AMT_ManagementPresenceRemoteSAP != null,
        hasPublicKeyCertificate: (context, event) => context.publicKeyCertificates?.length > 0,
        hasEnvSettings: (context, event) => context.message.Envelope.Body.AMT_EnvironmentDetectionSettingData.DetectionStrings != null,
        hasTLSCredentialContext: (context, event) => context.message.Envelope.Body.PullResponse.Items?.AMT_TLSCredentialContext != null,
        is8021xProfileEnabled: (context, event) => context.message.Envelope.Body.IPS_IEEE8021xSettings.Enabled === 2 || context.message.Envelope.Body.IPS_IEEE8021xSettings.Enabled === 6,
        is8021xProfileDisabled: (context, event) => context.is8021xProfileUpdated,
        isWifiProfilesExistsOnDevice: (context, event) => context.wifiEndPointSettings.length !== 0,
        isWifiProfileDeleted: (context, event) => context.message.Envelope.Body == null,
        isWifiOnlyDevice: (context, event) => context.wifiSettings != null && context.wiredSettings?.MACAddress == null,
        isWifiSupportedOnDevice: (context, event) => context.wifiSettings?.MACAddress != null,
        isWiredSupportedOnDevice: (context, event) => context.wiredSettings?.MACAddress != null

      },
      actions: {
        'Metric Capture': (context, event) => {
          statsD.increment('unconfiguration.success', 1)
        },
        'Update CIRA Status': (context, event) => {
          devices[context.clientId].status.CIRAConnection = context.statusMessage
        },
        'Update TLS Status': (context, event) => {
          devices[context.clientId].status.TLSConfiguration = context.statusMessage
        },
        'Update Status': (context, event) => {
          devices[context.clientId].status.TLSConfiguration = ''
          devices[context.clientId].status.CIRAConnection = ''
          devices[context.clientId].status.Status = context.statusMessage
          statsD.increment('unconfiguration.failure', 1)
        },
        'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 },
        'Read WiFi Endpoint Settings Pull Response': this.readWiFiEndpointSettingsPullResponse.bind(this),
        'Reset Retry Count': assign({ retryCount: (context, event) => 0 }),
        'Increment Retry Count': assign({ retryCount: (context, event) => context.retryCount + 1 }),
        'Read Ethernet Port Settings': this.readEthernetPortSettings.bind(this)
      }
    })

  constructor () {
    this.nodeForge = new NodeForge()
    this.certManager = new CertManager(new Logger('CertManager'), this.nodeForge)
    this.signatureHelper = new SignatureHelper(this.nodeForge)
    this.configurator = new Configurator()
    this.validator = new Validator(new Logger('Validator'), this.configurator)
    this.dbFactory = new DbCreatorFactory()
    this.logger = new Logger('Activation_State_Machine')
  }

  async enumerateEthernetPortSettings (context): Promise<any> {
    context.xmlMessage = context.amt.EthernetPortSettings.Enumerate()
    return await invokeWsmanCall(context, 2)
  }

  async pullEthernetPortSettings (context): Promise<any> {
    context.xmlMessage = context.amt.EthernetPortSettings.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  readEthernetPortSettings (context: UnconfigContext, event: UnconfigEvent): void {
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

  async get8021xProfile (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.ips.IEEE8021xSettings.Get()
    return await invokeWsmanCall(context, 2)
  }

  async disableWired8021xConfiguration (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const ieee8021xProfile = context.message.Envelope.Body.IPS_IEEE8021xSettings
    delete ieee8021xProfile.Username
    delete ieee8021xProfile.Password
    delete ieee8021xProfile.AuthenticationProtocol
    ieee8021xProfile.Enabled = 3
    context.xmlMessage = context.ips.IEEE8021xSettings.Put(ieee8021xProfile)
    return await invokeWsmanCall(context, 2)
  }

  async enumerateWiFiEndpointSettings (context): Promise<any> {
    context.xmlMessage = context.cim.WiFiEndpointSettings.Enumerate()
    return await invokeWsmanCall(context, 2)
  }

  async pullWiFiEndpointSettings (context): Promise<any> {
    context.xmlMessage = context.cim.WiFiEndpointSettings.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  readWiFiEndpointSettingsPullResponse (context: UnconfigContext, event: UnconfigEvent): void {
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

  async deleteWiFiProfileOnAMTDevice (context: UnconfigContext, event: UnconfigEvent): Promise<any> {
    let wifiEndpoints = context.wifiEndPointSettings
    // Deletes first profile in the array
    const selector = { name: 'InstanceID', value: wifiEndpoints[0].InstanceID }
    context.xmlMessage = context.cim.WiFiEndpointSettings.Delete(selector)
    wifiEndpoints = wifiEndpoints.slice(1)
    context.wifiEndPointSettings = wifiEndpoints
    return await invokeWsmanCall(context)
  }

  async removeRemoteAccessPolicyRuleUserInitiated (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const selector = { name: 'PolicyRuleName', value: 'User Initiated' }
    context.xmlMessage = context.amt.RemoteAccessPolicyRule.Delete(selector)
    return await invokeWsmanCall(context)
  }

  async removeRemoteAccessPolicyRuleAlert (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const selector = { name: 'PolicyRuleName', value: 'Alert' }
    context.xmlMessage = context.amt.RemoteAccessPolicyRule.Delete(selector)
    return await invokeWsmanCall(context)
  }

  async removeRemoteAccessPolicyRulePeriodic (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const selector = { name: 'PolicyRuleName', value: 'Periodic' }
    context.xmlMessage = context.amt.RemoteAccessPolicyRule.Delete(selector)
    return await invokeWsmanCall(context)
  }

  async enumerateManagementPresenceRemoteSAP (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.ManagementPresenceRemoteSAP.Enumerate()
    return await invokeWsmanCall(context)
  }

  async pullManagementPresenceRemoteSAP (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.ManagementPresenceRemoteSAP.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async deleteRemoteAccessService (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const selector = { name: 'Name', value: context.message.Envelope.Body.PullResponse.Items.AMT_ManagementPresenceRemoteSAP.Name }
    context.xmlMessage = context.amt.ManagementPresenceRemoteSAP.Delete(selector)
    return await invokeWsmanCall(context)
  }

  async enumeratePublicKeyCertificate (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicKeyCertificate.Enumerate()
    return await invokeWsmanCall(context)
  }

  async pullPublicKeyCertificate (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicKeyCertificate.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async deletePublicKeyCertificate (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const selector = { name: 'InstanceID', value: context.publicKeyCertificates[0].InstanceID }
    context.publicKeyCertificates = context.publicKeyCertificates.slice(1)
    context.xmlMessage = context.amt.PublicKeyCertificate.Delete(selector)
    return await invokeWsmanCall(context)
  }

  async getEnvironmentDetectionSettings (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.EnvironmentDetectionSettingData.Get()
    return await invokeWsmanCall(context)
  }

  async clearEnvironmentDetectionSettings (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const envSettings = context.message.Envelope.Body.AMT_EnvironmentDetectionSettingData
    envSettings.DetectionStrings = []
    context.xmlMessage = context.amt.EnvironmentDetectionSettingData.Put(envSettings)
    return await invokeWsmanCall(context)
  }

  async enumerateTLSSettingData (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.TLSSettingData.Enumerate()
    return await invokeWsmanCall(context)
  }

  async pullTLSSettingData (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.TLSSettingData.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async disableRemoteTLSSettingData (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.tlsSettingData = context.message.Envelope.Body.PullResponse.Items.AMT_TLSSettingData
    context.tlsSettingData[0].Enabled = false
    if (!('NonSecureConnectionsSupported' in context.tlsSettingData[0]) || context.tlsSettingData[0].NonSecureConnectionsSupported === true) {
      context.tlsSettingData[0].AcceptNonSecureConnections = true
    }
    context.tlsSettingData[0].MutualAuthentication = false
    delete context.tlsSettingData[0].TrustedCN
    context.xmlMessage = context.amt.TLSSettingData.Put(context.tlsSettingData[0])
    return await invokeWsmanCall(context)
  }

  async commitSetupAndConfigurationService (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.SetupAndConfigurationService.CommitChanges()
    return await invokeWsmanCall(context)
  }

  async disableLocalTLSSettingData (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.tlsSettingData[1].Enabled = false
    delete context.tlsSettingData[1].TrustedCN
    context.xmlMessage = context.amt.TLSSettingData.Put(context.tlsSettingData[1])
    return await invokeWsmanCall(context)
  }

  async enumerateTLSCredentialContext (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.TLSCredentialContext.Enumerate()
    return await invokeWsmanCall(context)
  }

  async pullTLSCredentialContext (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.TLSCredentialContext.Pull(context.message.Envelope.Body.EnumerateResponse.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async deleteTLSCredentialContext (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.TLSCredentialContext.Delete(context.message.Envelope.Body.PullResponse.Items?.AMT_TLSCredentialContext)
    return await invokeWsmanCall(context)
  }

  async enumeratePublicPrivateKeyPair (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicPrivateKeyPair.Enumerate()
    return await invokeWsmanCall(context)
  }

  async pullPublicPrivateKeyPair (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicPrivateKeyPair.Pull(context.message.Envelope.Body.EnumerateResponse.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async deletePublicPrivateKeyPair (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const selector = { name: 'InstanceID', value: context.privateCerts[0].InstanceID }
    context.privateCerts = context.privateCerts.slice(1)
    context.xmlMessage = context.amt.PublicPrivateKeyPair.Delete(selector)
    return await invokeWsmanCall(context)
  }
}
