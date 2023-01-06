/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMT, IPS } from '@open-amt-cloud-toolkit/wsman-messages'
import { createMachine, assign, send } from 'xstate'
import { CertManager } from '../certManager'
import { Configurator } from '../Configurator'
import { HttpHandler } from '../HttpHandler'
import Logger from '../Logger'
import { CIRAConfig } from '../models/RCS.Config'
import { NodeForge } from '../NodeForge'
import { DbCreatorFactory } from '../repositories/factories/DbCreatorFactory'
import { EnvReader } from '../utils/EnvReader'
import { SignatureHelper } from '../utils/SignatureHelper'
import { Validator } from '../Validator'
import { devices } from '../WebSocketListener'
import { AMTConfiguration } from '../models'
import { Error } from './error'
import { invokeWsmanCall } from './common'

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
  TLSSettingData: any[]
  publicKeyCertificates: any[]
  amt?: AMT.Messages
  ips?: IPS.Messages
}
interface UnconfigEvent {
  type: 'REMOVEPOLICY' | 'ONFAILED'
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
      TLSSettingData: [],
      publicKeyCertificates: []
    },
    id: 'unconfiuration-machine',
    initial: 'UNCONFIGURED',
    states: {
      UNCONFIGURED: {
        on: {
          REMOVEPOLICY: {
            actions: 'Reset Unauth Count',
            target: 'REMOVE_REMOTE_ACCESS_POLICY_RULE_USER_INITIATED'
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
          onDone: 'REMOVE_REMOTE_ACCESS_POLICY_RULE_USER_INITIATED'
        },
        on: {
          ONFAILED: 'FAILURE'
        }
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
          { target: 'ENUMERATE_PUBLIC_KEY_CERTIFICATE' }
        ]
      },
      DISABLE_TLS_SETTING_DATA: {
        invoke: {
          src: this.disableTLSSettingData.bind(this),
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
          src: this.disableTLSSettingData2.bind(this),
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
        after: { 5000: 'ENUMERATE_TLS_CREDENTIAL_CONTEXT' }
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
            actions: assign({ publicKeyCertificates: (context, event) => context.publicKeyCertificates.slice(1) }),
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
        type: 'final'
      }
    }
  }, {
    guards: {
      isExpectedBadRequest: (context, event) => {
        return event.data?.Envelope?.Body.Fault != null
      },
      hasPrivateCerts: (context, event) => {
        return context.privateCerts.length > 0
      },
      isLMSTLSSettings: (context, event) => {
        return context.message.Envelope.Body.AMT_TLSSettingData?.ElementName === 'Intel(r) AMT LMS TLS Settings'
      },
      is8023TLS: (context, event) => {
        return context.message.Envelope.Body.AMT_TLSSettingData?.ElementName === 'Intel(r) AMT 802.3 TLS Settings' && context.TLSSettingData[1].Enabled
      },
      tlsSettingDataEnabled: (context, event) => {
        return context.message.Envelope.Body.PullResponse.Items.AMT_TLSSettingData?.[0].Enabled || context.message.Envelope.Body.PullResponse.Items.AMT_TLSSettingData?.[1].Enabled
      },
      hasMPSEntries: (context, event) => {
        return context.message.Envelope.Body.PullResponse.Items?.AMT_ManagementPresenceRemoteSAP != null
      },
      hasPublicKeyCertificate: (context, event) => {
        return context.publicKeyCertificates?.length > 0
      },
      hasEnvSettings: (context, event) => {
        return context.message.Envelope.Body.AMT_EnvironmentDetectionSettingData.DetectionStrings != null
      },
      hasTLSCredentialContext: (context, event) => {
        return context.message.Envelope.Body.PullResponse.Items?.AMT_TLSCredentialContext != null
      }
    },
    actions: {
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
      },
      'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 }
    }
  })

  constructor () {
    this.nodeForge = new NodeForge()
    this.certManager = new CertManager(new Logger('CertManager'), this.nodeForge)
    this.signatureHelper = new SignatureHelper(this.nodeForge)
    this.configurator = new Configurator()
    this.validator = new Validator(new Logger('Validator'), this.configurator)
    this.dbFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
    this.logger = new Logger('Activation_State_Machine')
  }

  async removeRemoteAccessPolicyRuleUserInitiated (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const selector = { name: 'PolicyRuleName', value: 'User Initiated' }
    context.xmlMessage = context.amt.RemoteAccessPolicyRule(AMT.Methods.DELETE, null, selector)
    return await invokeWsmanCall(context)
  }

  async removeRemoteAccessPolicyRuleAlert (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const selector = { name: 'PolicyRuleName', value: 'Alert' }
    context.xmlMessage = context.amt.RemoteAccessPolicyRule(AMT.Methods.DELETE, null, selector)
    return await invokeWsmanCall(context)
  }

  async removeRemoteAccessPolicyRulePeriodic (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const selector = { name: 'PolicyRuleName', value: 'Periodic' }
    context.xmlMessage = context.amt.RemoteAccessPolicyRule(AMT.Methods.DELETE, null, selector)
    return await invokeWsmanCall(context)
  }

  async enumerateManagementPresenceRemoteSAP (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.ManagementPresenceRemoteSAP(AMT.Methods.ENUMERATE)
    return await invokeWsmanCall(context)
  }

  async pullManagementPresenceRemoteSAP (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.ManagementPresenceRemoteSAP(AMT.Methods.PULL, context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async deleteRemoteAccessService (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const selector = { name: 'Name', value: context.message.Envelope.Body.PullResponse.Items.AMT_ManagementPresenceRemoteSAP.Name }
    context.xmlMessage = context.amt.ManagementPresenceRemoteSAP(AMT.Methods.DELETE, null, selector)
    return await invokeWsmanCall(context)
  }

  async enumeratePublicKeyCertificate (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicKeyCertificate(AMT.Methods.ENUMERATE)
    return await invokeWsmanCall(context)
  }

  async pullPublicKeyCertificate (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicKeyCertificate(AMT.Methods.PULL, context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async deletePublicKeyCertificate (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const selector = { name: 'InstanceID', value: context.publicKeyCertificates[0].InstanceID }
    context.xmlMessage = context.amt.PublicKeyCertificate(AMT.Methods.DELETE, null, selector)
    return await invokeWsmanCall(context)
  }

  async getEnvironmentDetectionSettings (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.EnvironmentDetectionSettingData(AMT.Methods.GET)
    return await invokeWsmanCall(context)
  }

  async clearEnvironmentDetectionSettings (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const envSettings = context.message.Envelope.Body.AMT_EnvironmentDetectionSettingData
    envSettings.DetectionStrings = []
    context.xmlMessage = context.amt.EnvironmentDetectionSettingData(AMT.Methods.PUT, null, envSettings)
    return await invokeWsmanCall(context)
  }

  async enumerateTLSSettingData (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.TLSSettingData(AMT.Methods.ENUMERATE)
    return await invokeWsmanCall(context)
  }

  async pullTLSSettingData (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.TLSSettingData(AMT.Methods.PULL, context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async disableTLSSettingData (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.TLSSettingData = context.message.Envelope.Body.PullResponse.Items.AMT_TLSSettingData
    context.TLSSettingData[0].Enabled = false
    context.TLSSettingData[0].AcceptNonSecureConnections = true
    context.TLSSettingData[0].MutualAuthentication = false
    delete context.TLSSettingData[0].TrustedCN
    context.xmlMessage = context.amt.TLSSettingData(AMT.Methods.PUT, null, context.TLSSettingData[0])
    return await invokeWsmanCall(context)
  }

  async commitSetupAndConfigurationService (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.SetupAndConfigurationService(AMT.Methods.COMMIT_CHANGES)
    return await invokeWsmanCall(context)
  }

  async disableTLSSettingData2 (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.TLSSettingData[1].Enabled = false
    delete context.TLSSettingData[1].TrustedCN
    context.xmlMessage = context.amt.TLSSettingData(AMT.Methods.PUT, null, context.TLSSettingData[1])
    return await invokeWsmanCall(context)
  }

  async enumerateTLSCredentialContext (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.TLSCredentialContext(AMT.Methods.ENUMERATE)
    return await invokeWsmanCall(context)
  }

  async pullTLSCredentialContext (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.TLSCredentialContext(AMT.Methods.PULL, context.message.Envelope.Body.EnumerateResponse.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async deleteTLSCredentialContext (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.TLSCredentialContext(AMT.Methods.DELETE, null, null, context.message.Envelope.Body.PullResponse.Items?.AMT_TLSCredentialContext)
    return await invokeWsmanCall(context)
  }

  async enumeratePublicPrivateKeyPair (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicPrivateKeyPair(AMT.Methods.ENUMERATE)
    return await invokeWsmanCall(context)
  }

  async pullPublicPrivateKeyPair (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicPrivateKeyPair(AMT.Methods.PULL, context.message.Envelope.Body.EnumerateResponse.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async deletePublicPrivateKeyPair (context: UnconfigContext, event: UnconfigEvent): Promise<void> {
    const selector = { name: 'InstanceID', value: context.privateCerts[0].InstanceID }
    context.privateCerts = context.privateCerts.slice(1)
    context.xmlMessage = context.amt.PublicPrivateKeyPair(AMT.Methods.DELETE, null, selector)
    return await invokeWsmanCall(context)
  }
}
