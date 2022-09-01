import { AMT, IPS } from '@open-amt-cloud-toolkit/wsman-messages'
import { createMachine, interpret, assign, send } from 'xstate'
import { CertManager } from '../CertManager'
import { Configurator } from '../Configurator'
import { HttpHandler } from '../HttpHandler'
import Logger from '../Logger'
import got from 'got'
import { AMTRandomPasswordLength } from '../utils/constants'
import { CIRAConfig, ClientAction, mpsServer } from '../models/RCS.Config'
import { NodeForge } from '../NodeForge'
import { DbCreatorFactory } from '../repositories/factories/DbCreatorFactory'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { EnvReader } from '../utils/EnvReader'
import { PasswordHelper } from '../utils/PasswordHelper'
import { SignatureHelper } from '../utils/SignatureHelper'
import { Validator } from '../Validator'
import { devices } from '../WebSocketListener'
import { AMTConfiguration } from '../models'
import { MpsType } from '../actions/CIRAConfigurator'
import { randomUUID } from 'crypto'
import { Error } from './error'

export interface CIRAConfigContext {
  clientId: string
  status: 'success' | 'error' | 'wsman' | 'heartbeat_request'
  errorMessage: string
  xmlMessage: string // the message we send to the device
  message: any // the parsed json response
  ciraConfig: CIRAConfig
  profile: AMTConfiguration
  isDeleting: boolean
  statusMessage: string
  privateCerts: any[]
  httpHandler: HttpHandler
}
interface CIRAConfigEvent {
  type: 'REMOVEPOLICY' | 'ONFAILED'
  clientId: string
  data: any
}
export class CIRAConfiguration {
  nodeForge: NodeForge
  certManager: CertManager
  signatureHelper: SignatureHelper
  configurator: Configurator
  responseMsg: ClientResponseMsg
  validator: Validator
  amt: AMT.Messages
  ips: IPS.Messages
  logger: Logger
  dbFactory: DbCreatorFactory
  db: any
  error: Error = new Error()

  machine =

  /** @xstate-layout N4IgpgJg5mDOIC5QEMDGAXAlgN2Vg9gHYC0AtmgBaaFgB0AqgHIAKASgPIBqAkgMrftGAUQAiAYgCCAYQAq3ThLmDEoAA75YmAoRUgAHogCMAVgDMABlrGATADZzt6+cOGA7IYAcHgDQgAnogALB7WtACcjubmxrYm1qaBgQC+Sb5oWLjaZJTUdADiQjIA+gXCrBIAMkW8hXKMebxiEER01Nj4ANZ0sGCEEMQwNABOyAA2PehYhFDwSCDqmtq6BghOgca0HoaBtmGudjHWxr4BCLGutNYers6uIdYHtilpGDh4mETZqFQ0tAXFpSE5SqNRkdQaYjAQyG+CGtFUozwADNYaRaD0+gNelCxhMpjNdAstB8dHMViYLFY7A4nC53F4Tohzpdrrd7o9niB0m8suRvrlaFJBJwgcUABoAWSqMnYRQAUrxBGJCRpiURlohrO5Qg8Yjs9o9rIyzoEwrRzGE4g9DLZXBEwpzuZkSV8fnRWEIJCISkIypVqrVuPVGirFiSNQhTLTLrYzB5zB5jGFTK5jv4mabzZabNbbfbHa9nZ8+W7BQAJIRSADSRRE3AKvGKHsqEuVcyJSzJiFMxlTlzCgUMV0HdtsDPTCF7ploiTCNgtUfMWuSqS5hfexZyv24zF4RTL7EbACEJDURKD6LugTwpEImi1aG1Ot1ev0KBp0AAjZA9CATACuqihmqpKgCswQeOEYQOLEjiGAuqbGi4xiQS4CTxlc6GxgWGQbiQJYCjue4Hsep6iBeV6sDed5QjCcIIsiqLoq+xDvrAX4-pAAFAe2qqdmBQReFBME2tY8HJohE5bIYlxalcWrbB4gSmB4OE8i6BG-F6IjCGKMi3qwdRSGWEhBvevxPl0zGYqgUJYEimCoHgYDAfx+iIPOtA9kmFqzlqaanAOoQJjYSmBPEISqauTp4a6Arabp+mikGxmmYwkLQrC8KIugKJDGiGL9LZQz2Y5zmueGXYINcoQ2h4pgJBECEBUYdiBOE5x7K4gSuHm1hqUW+FbnQXoSkGFHma0hDtFZhXEMgECkNQ3EVeqVU1bQdUNaa9gSS1CDhTJ5iBM4J13K4vXHQNsWaSNIhjYwE20VlDG5Uxc0LUthArbxYZrQJ1X7JtY7bU1e3GmOlimLsVzwdEiYDtdvLDbQE3NBZ03PtZ-Q-WofGVQDG1bY1u0pvtQ4ySdLi2Cm0N7JaTzReuyP8r8T2ZfROV5QVLG4-M+P-e5gO1SDJPNcaPZQ9Yg607sdo2qYSMaSjvASCKIhCNRk2Ppjs3INgYDEBAYDYI5Lm-SBEYUpYNj2JEdKeD4E7Rg1dohG4F0JCpSubqzdCq+rmvcLeGV0dljH5ei+uG8bpu2atoFC9bVJ27SbiO8ag46jsURiQasaMy8uEs6WQIcKw2uWXQz1DHFNAJ1bZg29S9vp+OpypjJsROBYS5hNY+ZM8Xyt+7QZfsBXggAGKmRUogN1Vye2zSzht07pyJhsSZxDY8HGMYCY+0No9BgoFTcN6dYNk2noVK2C8A+FzjmgmT-rLGSYQ5mFpWmJea7CkVchB8DG1mCgZmI9SxMDYFwPgAhhAiAfknCKVh+42H7hEa4+0D4bGCMdMI-dbS9i2EfOu+RCg+j9CCQMwYkHkhQu1W0RwTAeF2NsBwxokyQTEgfOwm8dheFIbdQUwpRRFElNKWUCplAWzcisJwQNEgxHOuJMmnC7i0FsMpcwPYvCsPcA6Ie6lfalmbN6QEwIAxgiDA0OhmpXAqU2DERwSk3CYPXh5MI3CTBLjHPvARUUi7GOPqWYylYaxXyEI2IozY752MjA8C4HgIjQ3iMdMcklTg0zNPGfeLgeo50RkYwaZDaBEX3IeGQJ4zwURqFRYOQh4nhWNOdGMDxWEpl2GYfqxSboowSkIPSBkjImSDPE4wJhNF-20bYLRNIkJiXaiFCwEUaYTKEf0+641CiXnGf3KwPknAENJh4g6vVNp3EcHOXsA8FYbNHhRPZoR97QSOWDFSSFzlmAiDYA+sZ4IriCSU4RAdRBB1vPE+CQNdE6IeIacmF0vL7C8ShUwXjlKpnuaXVg5d4nQUgnaZMNoTqOH2o4UIsYoxJi1A45SgS1zDxMYRRgZ8L61nrFEm+LZ4kqUSOaK4B94IPAiLYThXjLg+L4f4sc9KYolwFDPbgc9EGyIJkLcKWpNFoqptBTw+xOFjnNIOPUA52GOCxQKGBPB+CCHnqqwW9DeybV7MdBILrTBDgWZYK4o4VK2j1cYC19d7WJ3JKczwgCkhAA */
  createMachine<CIRAConfigContext, CIRAConfigEvent>({
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
      isDeleting: true,
      privateCerts: []
    },
    id: 'cira-machine',
    initial: 'CIRACONFIGURED',
    states: {
      CIRACONFIGURED: {
        on: {
          REMOVEPOLICY: {
            actions: [assign({
              isDeleting: true // ensure this is true
            }), 'Reset Unauth Count'],
            target: 'GET_CIRA_CONFIG'
          }
        }
      },
      GET_CIRA_CONFIG: {
        invoke: {
          src: async (context, event) => {
            return await this.configurator.profileManager.getCiraConfiguration(devices[context.clientId].ClientData.payload.profile.profileName)
          },
          id: 'get-cira-config',
          onDone: {
            actions: assign({ ciraConfig: (context, event) => event.data }),
            target: 'GENERATE_RANDOM_PASSWORD'
          },
          onError: 'FAILURE'
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
      // TODO: when to generate and save this?
      GENERATE_RANDOM_PASSWORD: {
        always: {
          actions: assign((context, event) => {
            context.ciraConfig.password = PasswordHelper.generateRandomPassword(AMTRandomPasswordLength)
            return context
          }),
          target: 'REMOVE_REMOTE_ACCESS_POLICY_RULE_USER_INITIATED'
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
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP'
          },
          onError: 'FAILURE'
        }
      },
      PULL_MANAGEMENT_PRESENCE_REMOTE_SAP: {
        invoke: {
          src: this.pullManagementPresenceRemoteSAP.bind(this),
          id: 'pull-management-presence-remote-sap',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP_RESPONSE'
          }
        }
      },
      PULL_MANAGEMENT_PRESENCE_REMOTE_SAP_RESPONSE: {
        always: [{
          cond: 'isNotDeleting',
          target: 'ADD_REMOTE_POLICY_ACCESS_RULE'
        }, {
          cond: 'hasMPSEntries', // this could be problematic
          target: 'DELETE_MANAGEMENT_PRESENCE_REMOTE_SAP'
        },
        'ENUMERATE_TLS_SETTING_DATA'
        ]
      },
      ADD_REMOTE_POLICY_ACCESS_RULE: {
        invoke: {
          src: this.addRemoteAccessService.bind(this),
          id: 'add-remote-policy-access-rule',
          onDone: 'ENUMERATE_REMOTE_ACCESS_POLICY_RULE',
          onError: 'FAILURE'
        }
      },
      DELETE_MANAGEMENT_PRESENCE_REMOTE_SAP: {
        invoke: {
          src: this.deleteRemoteAccessService.bind(this),
          id: 'delete-management-presence-remote-sap',
          onDone: 'ENUMERATE_TLS_SETTING_DATA'
        }
      },
      ENUMERATE_TLS_SETTING_DATA: {
        invoke: {
          src: this.enumerateTLSSettingData.bind(this),
          id: 'enumerate-tls-setting-data',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'PULL_TLS_SETTING_DATA'
          }
        }
      },
      PULL_TLS_SETTING_DATA: {
        invoke: {
          src: this.pullTLSSettingData.bind(this),
          id: 'pull-tls-setting-data',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'PULL_TLS_SETTING_DATA_RESPONSE'
          }
        }
      },
      PULL_TLS_SETTING_DATA_RESPONSE: {
        always: [{
          cond: 'tlsSettingDataEnabled',
          target: 'DISABLE_TLS_SETTING_DATA'
        }, 'ENUMERATE_PUBLIC_KEY_CERTIFICATE']
      },
      DISABLE_TLS_SETTING_DATA: {
        invoke: {
          src: this.disableTLSSettingData.bind(this),
          id: 'disable-tls-setting-data',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'DISABLE_TLS_SETTING_DATA_RESPONSE'
          }
        }
      },
      DISABLE_TLS_SETTING_DATA_2: { // TODO: REFACTOR TO USE EXISITING PUT
        invoke: {
          src: this.disableTLSSettingData2.bind(this),
          id: 'disable-tls-setting-data-2',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'DISABLE_TLS_SETTING_DATA_RESPONSE'
          }
        }
      },
      DISABLE_TLS_SETTING_DATA_RESPONSE: {
        always: [
          { cond: 'is8023TLS', target: 'DISABLE_TLS_SETTING_DATA_2' },
          { cond: 'isLMSTLSSettings', target: 'SETUP_AND_CONFIGURATION_SERVICE_COMMIT_CHANGES' },
          'FAILURE']
      },
      SETUP_AND_CONFIGURATION_SERVICE_COMMIT_CHANGES: {
        invoke: {
          src: this.commitSetupAndConfigurationService.bind(this),
          id: 'setup-and-configuration-service-commit-changes',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'SETUP_AND_CONFIGURATION_SERVICE_COMMIT_CHANGES_RESPONSE'
          }
        }
      },
      SETUP_AND_CONFIGURATION_SERVICE_COMMIT_CHANGES_RESPONSE: {
        after: {
          5000: 'ENUMERATE_TLS_CREDENTIAL_CONTEXT'
        }
      },
      ENUMERATE_TLS_CREDENTIAL_CONTEXT: {
        invoke: {
          src: this.enumerateTLSCredentialContext.bind(this),
          id: 'enumerate-tls-credential-context',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'PULL_TLS_CREDENTIAL_CONTEXT'
          }
        }
      },
      PULL_TLS_CREDENTIAL_CONTEXT: {
        invoke: {
          src: this.pullTLSCredentialContext.bind(this),
          id: 'pull-tls-credential-context',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'PULL_TLS_CREDENTIAL_CONTEXT_RESPONSE'
          }
        }
      },
      PULL_TLS_CREDENTIAL_CONTEXT_RESPONSE: {
        always: [
          {
            cond: 'hasTLSCredentialContext', // should this be isNotDeleting
            target: 'DELETE_TLS_CREDENTIAL_CONTEXT'
          },
          'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR']
      },
      DELETE_TLS_CREDENTIAL_CONTEXT: {
        invoke: {
          src: this.deleteTLSCredentialContext.bind(this),
          id: 'delete-tls-credential-context',
          onDone: 'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR'
        }
      },
      ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR: {
        invoke: {
          src: this.enumeratePublicPrivateKeyPair.bind(this),
          id: 'enumerate-public-private-key-pair',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'PULL_PUBLIC_PRIVATE_KEY_PAIR'
          }
        }
      },
      PULL_PUBLIC_PRIVATE_KEY_PAIR: {
        invoke: {
          src: this.pullPublicPrivateKeyPair.bind(this),
          id: 'pull-public-private-key-pair',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'PULL_PUBLIC_PRIVATE_KEY_PAIR_RESPONSE'
          }
        }
      },
      PULL_PUBLIC_PRIVATE_KEY_PAIR_RESPONSE: {
        always: [
          {
            cond: 'isNotDeleting',
            target: 'ENUMERATE_PUBLIC_KEY_CERTIFICATE'
          },
          'DELETE_PUBLIC_PRIVATE_KEY_PAIR']
      },
      DELETE_PUBLIC_PRIVATE_KEY_PAIR: {
        invoke: {
          src: this.deletePublicPrivateKeyPair.bind(this),
          id: 'delete-public-private-key-pair',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'DELETE_PUBLIC_PRIVATE_KEY_PAIR_RESPONSE'
          }
        }
      },
      DELETE_PUBLIC_PRIVATE_KEY_PAIR_RESPONSE: {
        always: [{
          cond: 'hasPrivateCerts',
          target: 'DELETE_PUBLIC_PRIVATE_KEY_PAIR'
        }, 'ENUMERATE_PUBLIC_KEY_CERTIFICATE']
      },
      ENUMERATE_REMOTE_ACCESS_POLICY_RULE: {
        invoke: {
          src: this.enumerateRemoteAccessPolicyAppliesToMPS.bind(this),
          id: 'enumerate-remote-access-policy-rule',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'PULL_REMOTE_ACCESS_POLICY_RULE'
          }
        }
      },
      PULL_REMOTE_ACCESS_POLICY_RULE: {
        invoke: {
          src: this.pullRemoteAccessPolicyAppliesToMPS.bind(this),
          id: 'pull-remote-access-policy-rule',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'PUT_REMOTE_ACCESS_POLICY_RULE'
          }
        }
      },
      PUT_REMOTE_ACCESS_POLICY_RULE: {
        invoke: {
          src: this.putRemoteAccessPolicyAppliesToMPS.bind(this),
          id: 'put-remote-access-policy-rule',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'USER_INITIATED_CONNECTION_SERVICE'
          }
        }
      },
      USER_INITIATED_CONNECTION_SERVICE: {
        invoke: {
          src: this.userInitiatedConnectionService.bind(this),
          id: 'user-initiated-connection-service',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'USER_INITIATED_CONNECTION_SERVICE_RESPONSE'
          }
        }
      },
      USER_INITIATED_CONNECTION_SERVICE_RESPONSE: {
        always: [{
          cond: 'successfulStateChange',
          target: 'GET_ENVIRONMENT_DETECTION_SETTINGS'
        }, 'FAILURE'] // throw new RPSError(`Device ${clientObj.uuid} failed to update User Initiated Connection Service.`)
      },
      ENUMERATE_PUBLIC_KEY_CERTIFICATE: {
        invoke: {
          src: this.enumeratePublicKeyCertificate.bind(this),
          id: 'enumerate-public-key-certificate',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'PULL_PUBLIC_KEY_CERTIFICATE'
          }
        }
      },
      PULL_PUBLIC_KEY_CERTIFICATE: {
        invoke: {
          src: this.pullPublicKeyCertificate.bind(this),
          id: 'pull-public-key-certificate',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'PULL_PUBLIC_KEY_CERTIFICATE_RESPONSE'
          }
        }
      },
      PULL_PUBLIC_KEY_CERTIFICATE_RESPONSE: {
        always: [{
          cond: 'hasPublicKeyCertificate',
          target: 'DELETE_PUBLIC_KEY_CERTIFICATE'
        },
        'GET_ENVIRONMENT_DETECTION_SETTINGS'
        ]
      },
      DELETE_PUBLIC_KEY_CERTIFICATE: {
        invoke: {
          src: this.deletePublicKeyCertificate.bind(this),
          id: 'delete-public-key-certificate',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'GET_ENVIRONMENT_DETECTION_SETTINGS'
          }
        }
      },
      GET_ENVIRONMENT_DETECTION_SETTINGS: {
        invoke: {
          src: this.getEnvironmentDetectionSettings.bind(this),
          id: 'get-environment-detection-settings',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'GET_ENVIRONMENT_DETECTION_SETTINGS_RESPONSE'
          }
        }
      },
      GET_ENVIRONMENT_DETECTION_SETTINGS_RESPONSE: {
        always: [{
          cond: 'isNotDeleting',
          target: 'PUT_ENVIRONMENT_DETECTION_SETTINGS'
        }, {
          cond: 'hasEnvSettings', // TODO: NEed some verifivioantoidnfodfsjsdflji
          actions: assign({ isDeleting: (context, event) => false }),
          target: 'CLEAR_ENVIRONMENT_DETECTION_SETTINGS'
        }, {
          actions: assign({ isDeleting: (context, event) => false }),
          target: 'ADD_TRUSTED_ROOT_CERTIFICATE'
        }]
      },
      PUT_ENVIRONMENT_DETECTION_SETTINGS: {
        invoke: {
          src: this.putEnvironmentDetectionSettings.bind(this),
          id: 'put-environment-detection-settings',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data, status: (context, event) => 'success', statusMessage: (context, event) => 'Configured' })
            ],
            target: 'SUCCESS'
          }
        }
      },
      CLEAR_ENVIRONMENT_DETECTION_SETTINGS: {
        invoke: {
          src: this.clearEnvironmentDetectionSettings.bind(this),
          id: 'put-environment-detection-settings',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data, isDeleting: false }) // IMPORTANT: This flags switches from clearing to configuring CIRA
            ],
            target: 'ADD_TRUSTED_ROOT_CERTIFICATE'
          }
        }
      },
      ADD_TRUSTED_ROOT_CERTIFICATE: {
        invoke: {
          src: this.addTrustedRootCertificate.bind(this),
          id: 'add-trusted-root-certificate',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER'
          }
        }
      },
      SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER: {
        invoke: {
          src: async (context, event) => await this.configurator.secretsManager.writeSecretWithObject(`devices/${devices[context.clientId].uuid}`, {
            data: {
              MPS_PASSWORD: context.ciraConfig.password,
              AMT_PASSWORD: devices[context.clientId].amtPassword,
              MEBX_PASSWORD: devices[context.clientId].action === ClientAction.ADMINCTLMODE ? devices[context.clientId].mebxPassword : null
            }
          }),
          id: 'save-mps-password-to-secret-provider',
          onDone: 'SAVE_DEVICE_TO_MPS'
        }
      },
      SAVE_DEVICE_TO_MPS: {
        invoke: {
          src: async (context, event) => await got(`${EnvReader.GlobalEnvConfig.mpsServer}/api/v1/devices`, {
            method: 'POST',
            json: {
              guid: devices[context.clientId].uuid,
              hostname: devices[context.clientId].hostname,
              mpsusername: context.ciraConfig.username,
              tags: context.profile.tags ?? [],
              tenantId: context.ciraConfig.tenantId
            }
          }),
          id: 'save-device-to-mps',
          onDone: 'ADD_MPS'
        }
      },
      ADD_MPS: {
        invoke: {
          src: this.addMPS.bind(this),
          id: 'add-mps',
          onDone: {
            actions: [
              assign({ message: (context, event) => event.data })
            ],
            target: 'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP'
          }
        }
      },
      FAILURE: {
        entry: [assign({ statusMessage: (context, event) => 'Failed' }), 'Update Configuration Status'],
        type: 'final'
      },
      SUCCESS: {
        entry: 'Update Configuration Status',
        type: 'final'
      }
    }
  }, {
    guards: {
      isExpectedBadRequest: (context, event) => {
        return event.data?.Envelope.Body.Fault != null
      },
      hasPrivateCerts: (context, event) => context.privateCerts.length > 0,
      tlsEnabled: (context, event) => !(devices[context.clientId].ciraconfig.TLSSettingData[0].Enabled || devices[context.clientId].ciraconfig.TLSSettingData[1].Enabled), /// i dont know
      isLMSTLSSettings: (context, event) => context.message.Envelope.Body.AMT_TLSSettingData?.ElementName === 'Intel(r) AMT LMS TLS Settings',
      is8023TLS: (context, event) => context.message.Envelope.Body.AMT_TLSSettingData?.ElementName === 'Intel(r) AMT 802.3 TLS Settings' && devices[context.clientId].ciraconfig.TLSSettingData[1].Enabled,
      tlsSettingDataEnabled: (context, event) => context.message.Envelope.Body.PullResponse.Items.AMT_TLSSettingData?.[0].Enabled || context.message.Envelope.Body.PullResponse.Items.AMT_TLSSettingData?.[1].Enabled,
      hasMPSEntries: (context, event) => context.message.Envelope.Body.PullResponse.Items?.AMT_ManagementPresenceRemoteSAP != null,
      hasPublicKeyCertificate: (context, event) => context.message.Envelope.Body.PullResponse.Items?.AMT_PublicKeyCertificate != null,
      hasEnvSettings: (context, event) => context.message.Envelope.Body.AMT_EnvironmentDetectionSettingData.DetectionStrings != null,
      isNotDeleting: (context, event) => !context.isDeleting,
      successfulStateChange: (context, event) => context.message.Envelope.Body?.RequestStateChange_OUTPUT?.ReturnValue === 0
      // checkNoCertsExist: (context, event) => !Array.isArray(context.message.Envelope.Body.PullResponse.Items?.AMT_PublicKeyCertificate)
    },
    actions: {
      'Update Configuration Status': (context, event) => this.updateConfigurationStatus.bind(this),
      'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 }
    }
  })

  service = interpret(this.machine).onTransition((state) => {
    console.log(`Current state of CIRA Config State Machine: ${JSON.stringify(state.value)}`)
  }).onChange((data) => {
    console.log('ONCHANGE:')
    console.log(data)
  }).onDone((data) => {
    console.log('ONDONE:')
    console.log(data)
  })

  constructor () {
    this.nodeForge = new NodeForge()
    this.certManager = new CertManager(new Logger('CertManager'), this.nodeForge)
    this.signatureHelper = new SignatureHelper(this.nodeForge)
    this.configurator = new Configurator()
    this.responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
    this.validator = new Validator(new Logger('Validator'), this.configurator)
    this.amt = new AMT.Messages()
    this.ips = new IPS.Messages()
    this.dbFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
    this.logger = new Logger('Activation_State_Machine')
  }

  async invokeWsmanCall (context): Promise<any> {
    let { message, clientId, xmlMessage } = context
    const clientObj = devices[clientId]
    message = context.httpHandler.wrapIt(xmlMessage, clientObj.connectionParams)
    const responseMessage = this.responseMsg.get(clientId, message, 'wsman', 'ok')
    devices[clientId].ClientSocket.send(JSON.stringify(responseMessage))
    clientObj.pendingPromise = new Promise<any>((resolve, reject) => {
      clientObj.resolve = resolve
      clientObj.reject = reject
    })
    return await clientObj.pendingPromise
  }

  async removeRemoteAccessPolicyRuleUserInitiated (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    const selector = { name: 'PolicyRuleName', value: 'User Initiated' }
    context.xmlMessage = this.amt.RemoteAccessPolicyRule(AMT.Methods.DELETE, selector)
    return await this.invokeWsmanCall(context)
  }

  async removeRemoteAccessPolicyRuleAlert (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    const selector = { name: 'PolicyRuleName', value: 'Alert' }
    context.xmlMessage = this.amt.RemoteAccessPolicyRule(AMT.Methods.DELETE, selector)
    return await this.invokeWsmanCall(context)
  }

  async removeRemoteAccessPolicyRulePeriodic (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    const selector = { name: 'PolicyRuleName', value: 'Periodic' }
    context.xmlMessage = this.amt.RemoteAccessPolicyRule(AMT.Methods.DELETE, selector)
    return await this.invokeWsmanCall(context)
  }

  async enumerateManagementPresenceRemoteSAP (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.ManagementPresenceRemoteSAP(AMT.Methods.ENUMERATE)
    return await this.invokeWsmanCall(context)
  }

  async pullManagementPresenceRemoteSAP (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.ManagementPresenceRemoteSAP(AMT.Methods.PULL, context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await this.invokeWsmanCall(context)
  }

  async deleteRemoteAccessService (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    const selector = { name: 'Name', value: context.message.Envelope.Body.PullResponse.Items.AMT_ManagementPresenceRemoteSAP.Name }
    context.xmlMessage = this.amt.ManagementPresenceRemoteSAP(AMT.Methods.DELETE, null, selector)
    return await this.invokeWsmanCall(context)
  }

  async addRemoteAccessService (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    const selector = { name: 'Name', value: context.message.Envelope.Body.PullResponse.Items.AMT_ManagementPresenceRemoteSAP.Name }
    const policy = {
      Trigger: 2, // 2 – Periodic
      TunnelLifeTime: 0, // 0 means that the tunnel should stay open until it is closed
      ExtendedData: 'AAAAAAAAABk=' // Equals to 25 seconds in base 64 with network order.
    }
    context.xmlMessage = this.amt.RemoteAccessService(AMT.Methods.ADD_REMOTE_ACCESS_POLICY_RULE, null, policy, selector)
    return await this.invokeWsmanCall(context)
  }

  async enumeratePublicKeyCertificate (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.PublicKeyCertificate(AMT.Methods.ENUMERATE)
    return await this.invokeWsmanCall(context)
  }

  async pullPublicKeyCertificate (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.PublicKeyCertificate(AMT.Methods.PULL, context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await this.invokeWsmanCall(context)
  }

  async deletePublicKeyCertificate (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    const publicKeyCertificates = context.message.Envelope.Body.PullResponse.Items?.AMT_PublicKeyCertificate
    const selector = { name: 'InstanceID', value: publicKeyCertificates.InstanceID }
    if (Array.isArray(publicKeyCertificates)) {
      selector.value = publicKeyCertificates[0].InstanceID
    }
    context.xmlMessage = this.amt.PublicKeyCertificate(AMT.Methods.DELETE, null, selector)
    return await this.invokeWsmanCall(context)
  }

  async getEnvironmentDetectionSettings (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.EnvironmentDetectionSettingData(AMT.Methods.GET)
    return await this.invokeWsmanCall(context)
  }

  async clearEnvironmentDetectionSettings (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    const envSettings = context.message.Envelope.Body.AMT_EnvironmentDetectionSettingData
    envSettings.DetectionStrings = []
    context.xmlMessage = this.amt.EnvironmentDetectionSettingData(AMT.Methods.PUT, envSettings)
    return await this.invokeWsmanCall(context)
  }

  async putEnvironmentDetectionSettings (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    const envSettings = context.message.Envelope.Body.AMT_EnvironmentDetectionSettingData
    if (EnvReader.GlobalEnvConfig.disableCIRADomainName?.toLowerCase() !== '') {
      envSettings.DetectionStrings = [EnvReader.GlobalEnvConfig.disableCIRADomainName]
    } else {
      envSettings.DetectionStrings = [`${randomUUID()}.com`]
    }
    context.xmlMessage = this.amt.EnvironmentDetectionSettingData(AMT.Methods.PUT, envSettings)
    return await this.invokeWsmanCall(context)
  }

  async addTrustedRootCertificate (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    const configScript: CIRAConfig = devices[context.clientId].ClientData.payload.profile.ciraConfigObject
    context.xmlMessage = this.amt.PublicKeyManagementService(AMT.Methods.ADD_TRUSTED_ROOT_CERTIFICATE, { CertificateBlob: configScript.mpsRootCertificate })
    return await this.invokeWsmanCall(context)
  }

  async addMPS (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    const server: mpsServer = {
      AccessInfo: context.ciraConfig.mpsServerAddress,
      InfoFormat: context.ciraConfig.serverAddressFormat,
      Port: context.ciraConfig.mpsPort,
      AuthMethod: context.ciraConfig.authMethod,
      Username: context.ciraConfig.username,
      Password: context.ciraConfig.password
    }
    if (context.ciraConfig.serverAddressFormat === 3 && context.ciraConfig.commonName) {
      server.CommonName = context.ciraConfig.commonName
    }
    context.xmlMessage = this.amt.RemoteAccessService(AMT.Methods.ADD_MPS, server)
    return await this.invokeWsmanCall(context)
  }

  async enumerateRemoteAccessPolicyAppliesToMPS (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.RemoteAccessPolicyAppliesToMPS(AMT.Methods.ENUMERATE)
    return await this.invokeWsmanCall(context)
  }

  async pullRemoteAccessPolicyAppliesToMPS (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.RemoteAccessPolicyAppliesToMPS(AMT.Methods.PULL, context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await this.invokeWsmanCall(context)
  }

  async putRemoteAccessPolicyAppliesToMPS (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    const data = context.message.Envelope.Body.PullResponse.Items.AMT_RemoteAccessPolicyAppliesToMPS
    data.MpsType = MpsType.Both
    context.xmlMessage = this.amt.RemoteAccessPolicyAppliesToMPS(AMT.Methods.PUT, null, data)
    return await this.invokeWsmanCall(context)
  }

  async userInitiatedConnectionService (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.UserInitiatedConnectionService(AMT.Methods.REQUEST_STATE_CHANGE, 32771)
    return await this.invokeWsmanCall(context)
  }

  async enumerateTLSSettingData (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.TLSSettingData(AMT.Methods.ENUMERATE)
    return await this.invokeWsmanCall(context)
  }

  async pullTLSSettingData (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.TLSSettingData(AMT.Methods.PULL, context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await this.invokeWsmanCall(context)
  }

  async disableTLSSettingData (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    const clientObj = devices[context.clientId]
    clientObj.ciraconfig.TLSSettingData[0].Enabled = false
    clientObj.ciraconfig.TLSSettingData[0].AcceptNonSecureConnections = true
    clientObj.ciraconfig.TLSSettingData[0].MutualAuthentication = false
    delete clientObj.ciraconfig.TLSSettingData[0].TrustedCN
    context.xmlMessage = this.amt.TLSSettingData(AMT.Methods.PUT, null, clientObj.ciraconfig.TLSSettingData[0])
    return await this.invokeWsmanCall(context)
  }

  async commitSetupAndConfigurationService (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.SetupAndConfigurationService(AMT.Methods.COMMIT_CHANGES)
    return await this.invokeWsmanCall(context)
  }

  async disableTLSSettingData2 (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    const clientObj = devices[context.clientId]
    clientObj.ciraconfig.TLSSettingData[1].Enabled = false
    delete clientObj.ciraconfig.TLSSettingData[1].TrustedCN
    context.xmlMessage = this.amt.TLSSettingData(AMT.Methods.PUT, null, clientObj.ciraconfig.TLSSettingData[1])
    return await this.invokeWsmanCall(context)
  }

  async enumerateTLSCredentialContext (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.TLSCredentialContext(AMT.Methods.ENUMERATE)
    return await this.invokeWsmanCall(context)
  }

  async pullTLSCredentialContext (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.TLSCredentialContext(AMT.Methods.PULL, context.message.Envelope.Body.EnumerateResponse.EnumerationContext)
    return await this.invokeWsmanCall(context)
  }

  async deleteTLSCredentialContext (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.TLSCredentialContext(AMT.Methods.DELETE, null, null, context.message.Envelope.Body.PullResponse.Items?.AMT_TLSCredentialContext)
    return await this.invokeWsmanCall(context)
  }

  async enumeratePublicPrivateKeyPair (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.PublicPrivateKeyPair(AMT.Methods.ENUMERATE)
    return await this.invokeWsmanCall(context)
  }

  async pullPublicPrivateKeyPair (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    context.xmlMessage = this.amt.PublicPrivateKeyPair(AMT.Methods.PULL, context.message.Envelope.Body.EnumerateResponse.EnumerationContext)
    return await this.invokeWsmanCall(context)
  }

  async deletePublicPrivateKeyPair (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    // const selector = { name: 'InstanceID', value: devices[context.clientId].ciraconfig.privateCerts[0].InstanceID }
    // devices[context.clientId].ciraconfig.privateCerts = devices[context.clientId].ciraconfig.privateCerts.slice(1)
    const publicPrivateKeyPair = context.message.Envelope.Body.PullResponse.Items?.AMT_PublicPrivateKeyPair
    const selector = { name: 'InstanceID', value: publicPrivateKeyPair.InstanceID }
    if (Array.isArray(publicPrivateKeyPair)) {
      selector.value = publicPrivateKeyPair[0].InstanceID
      context.privateCerts = publicPrivateKeyPair.slice(1)
    } else {
      context.privateCerts = []
    }
    context.xmlMessage = this.amt.PublicPrivateKeyPair(AMT.Methods.DELETE, null, selector)
    return await this.invokeWsmanCall(context)
  }

  updateConfigurationStatus (context: CIRAConfigContext, event: CIRAConfigEvent): void {
    devices[context.clientId].status.CIRAConnection = context.statusMessage
  }
}
