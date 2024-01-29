/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { createMachine, assign } from 'xstate'
import { CertManager } from '../certManager.js'
import { Configurator } from '../Configurator.js'
import { type HttpHandler } from '../HttpHandler.js'
import Logger from '../Logger.js'
import got from 'got'
import { UNEXPECTED_PARSE_ERROR } from '../utils/constants.js'
import { type CIRAConfig, ClientAction } from '../models/RCS.Config.js'
import { NodeForge } from '../NodeForge.js'
import { DbCreatorFactory } from '../factories/DbCreatorFactory.js'
import { Environment } from '../utils/Environment.js'
import { PasswordHelper } from '../utils/PasswordHelper.js'
import { SignatureHelper } from '../utils/SignatureHelper.js'
import { Validator } from '../Validator.js'
import { devices } from '../devices.js'
import { type AMTConfiguration } from '../models/index.js'
import { randomUUID } from 'node:crypto'
import { Error } from './error.js'
import { invokeWsmanCall } from './common.js'
import { type Models } from '@open-amt-cloud-toolkit/wsman-messages/amt'

export interface CIRAConfigContext {
  clientId: string
  status: 'success' | 'error' | 'wsman' | 'heartbeat_request'
  errorMessage: string
  xmlMessage: string // the message we send to the device
  message: any // the parsed json response
  ciraConfig: CIRAConfig
  profile: AMTConfiguration | null
  statusMessage: string
  privateCerts: any[]
  httpHandler: HttpHandler | null
  amt?: AMT.Messages
  retryCount: number
  tenantId: string
}

export interface CIRAConfigEvent {
  type: 'CONFIGURE_CIRA' | 'ONFAILED'
  clientId: string
  data: any
  tenantId: string
}

export enum MPSType {
  ExternalMPS = 0,
  InternalMPS = 1,
  Both = 2
}

// TODO: [tech debt] - name confusion/collision
// CIRAConfiguration means different things in different places
export class CIRAConfiguration {
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
    createMachine<CIRAConfigContext, CIRAConfigEvent>({
      preserveActionOrder: true,
      predictableActionArguments: true,
      // todo: the actual context comes in from the parent and clobbers this one
      // xstate version 5 should fix this.
      context: {
        clientId: '',
        httpHandler: null,
        status: 'success',
        errorMessage: '',
        xmlMessage: '',
        statusMessage: '',
        message: null,
        ciraConfig: {} as any,
        profile: null,
        privateCerts: [],
        tenantId: '',
        retryCount: 0
      },
      id: 'cira-machine',
      initial: 'CIRACONFIGURED',
      states: {
        CIRACONFIGURED: {
          on: {
            CONFIGURE_CIRA: {
              // reset retry will create retryCount on the context
              actions: ['Reset Unauth Count', 'Reset Retry Count'],
              target: 'GET_CIRA_CONFIG'
            }
          }
        },
        GET_CIRA_CONFIG: {
          invoke: {
            // TODO: [tech debt] coupling, would expect a direct call to the persistence with the name of the cira config to retrieve it rather than use (amt) profile manager
            src: async (context, event) => {
              const profileName = context.profile?.profileName != null ? context.profile.profileName : null
              await this.configurator.profileManager.getCiraConfiguration(profileName, context.tenantId)
            },
            id: 'get-cira-config',
            onDone: {
              actions: assign({ ciraConfig: (context, event) => event.data }),
              target: 'SET_MPS_PASSWORD'
            },
            onError: 'FAILURE'
          }
        },
        SET_MPS_PASSWORD: {
          invoke: {
            src: async (context, _) => {
              const configName = context.ciraConfig?.configName != null ? context.ciraConfig.configName : ''
              await this.configurator.secretsManager.getSecretAtPath(`CIRAConfigs/${configName}`)
            },
            id: 'set-mps-password',
            onDone: {
              actions: assign((context, event) => {
                if (event.data?.MPS_PASSWORD) {
                  context.ciraConfig.password = event.data?.MPS_PASSWORD
                } else {
                  context.ciraConfig.password = PasswordHelper.generateRandomPassword()
                }
                return context
              }),
              target: 'ADD_TRUSTED_ROOT_CERTIFICATE'
            },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed getSecretAtPath' }),
              target: 'FAILURE'
            }
          }
        },
        ADD_TRUSTED_ROOT_CERTIFICATE: {
          invoke: {
            src: this.addTrustedRootCertificate.bind(this),
            id: 'add-trusted-root-certificate',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER'
            },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to add trusted root certificate' }),
              target: 'FAILURE'
            }
          }
        },
        SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER: {
          invoke: {
            src: async (context, event) => await this.configurator.secretsManager.writeSecretWithObject(`devices/${devices[context.clientId].uuid}`, {
              MPS_PASSWORD: context.ciraConfig.password,
              AMT_PASSWORD: devices[context.clientId].amtPassword,
              MEBX_PASSWORD: devices[context.clientId].action === ClientAction.ADMINCTLMODE ? devices[context.clientId].mebxPassword : ''
            }),
            id: 'save-mps-password-to-secret-provider',
            onDone: 'SAVE_DEVICE_TO_MPS',
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to save mps password to secret provider' }),
              target: 'FAILURE'
            }
          }
        },
        SAVE_DEVICE_TO_MPS: {
          invoke: {
            src: async (context, event) => await got(`${Environment.Config.mps_server}/api/v1/devices`, {
              method: 'POST',
              json: {
                guid: devices[context.clientId].uuid,
                hostname: devices[context.clientId].hostname,
                mpsusername: context.ciraConfig.username,
                tags: context.profile != null ? context.profile.tags ?? [] : null,
                tenantId: context.ciraConfig.tenantId
              }
            }),
            id: 'save-device-to-mps',
            onDone: 'ADD_MPS',
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to save device to mps' }),
              target: 'FAILURE'
            }
          }
        },
        ADD_MPS: {
          invoke: {
            src: this.addMPS.bind(this),
            id: 'add-mps',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP'
            },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to add mps' }),
              target: 'FAILURE'
            }
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
              actions: [assign({ message: (context, event) => event.data }), 'Reset Retry Count'],
              target: 'ADD_REMOTE_ACCESS_POLICY_RULE'
            },
            onError: [
              {
                cond: 'shouldRetry',
                actions: 'Increment Retry Count',
                target: 'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP'
              },
              {
                actions: assign({ statusMessage: (context, event) => 'Failed to Pull Management Presence Remote SAP' }),
                target: 'FAILURE'
              }
            ]
          }
        },
        ADD_REMOTE_ACCESS_POLICY_RULE: {
          invoke: {
            src: this.addRemoteAccessPolicyRule.bind(this),
            id: 'add-remote-policy-access-rule',
            onDone: 'ENUMERATE_REMOTE_ACCESS_POLICY_RULE',
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to add remote policy access rule' }),
              target: 'FAILURE'
            }
          }
        },
        ENUMERATE_REMOTE_ACCESS_POLICY_RULE: {
          invoke: {
            src: this.enumerateRemoteAccessPolicyAppliesToMPS.bind(this),
            id: 'enumerate-remote-access-policy-rule',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'PULL_REMOTE_ACCESS_POLICY_RULE'
            },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to enumerate remote access policy rule' }),
              target: 'FAILURE'
            }
          }
        },
        PULL_REMOTE_ACCESS_POLICY_RULE: {
          invoke: {
            src: this.pullRemoteAccessPolicyAppliesToMPS.bind(this),
            id: 'pull-remote-access-policy-rule',
            onDone: {
              actions: [assign({ message: (context, event) => event.data }), 'Reset Retry Count'],
              target: 'PUT_REMOTE_ACCESS_POLICY_RULE'
            },
            onError: [
              {
                cond: 'shouldRetry',
                actions: 'Increment Retry Count',
                target: 'ENUMERATE_REMOTE_ACCESS_POLICY_RULE'
              },
              {
                actions: assign({ statusMessage: (context, event) => 'Failed to pull remote access policy rule' }),
                target: 'FAILURE'
              }
            ]
          }
        },
        PUT_REMOTE_ACCESS_POLICY_RULE: {
          invoke: {
            src: this.putRemoteAccessPolicyAppliesToMPS.bind(this),
            id: 'put-remote-access-policy-rule',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'USER_INITIATED_CONNECTION_SERVICE'
            },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to put remote access policy rule' }),
              target: 'FAILURE'
            }
          }
        },
        USER_INITIATED_CONNECTION_SERVICE: {
          invoke: {
            src: this.userInitiatedConnectionService.bind(this),
            id: 'user-initiated-connection-service',
            onDone: [
              {
                cond: 'userInitiatedConnectionServiceSuccessful',
                target: 'GET_ENVIRONMENT_DETECTION_SETTINGS'
              },
              {
                actions: assign({ statusMessage: (context, event) => 'Failed to set user initiated connection service' }),
                target: 'FAILURE'
              }
            ],
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to set user initiated connection service' }),
              target: 'FAILURE'
            }
          }
        },
        GET_ENVIRONMENT_DETECTION_SETTINGS: {
          invoke: {
            src: this.getEnvironmentDetectionSettings.bind(this),
            id: 'get-environment-detection-settings',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'PUT_ENVIRONMENT_DETECTION_SETTINGS'
            },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to get user initiated connection service' }),
              target: 'FAILURE'
            }
          }
        },
        PUT_ENVIRONMENT_DETECTION_SETTINGS: {
          invoke: {
            src: this.putEnvironmentDetectionSettings.bind(this),
            id: 'put-environment-detection-settings',
            onDone: {
              target: 'SUCCESS'
            },
            onError: {
              actions: assign({ statusMessage: (context, event) => 'Failed to set user initiated connection service' }),
              target: 'FAILURE'
            }
          }
        },
        FAILURE: {
          entry: 'Update Configuration Status',
          type: 'final'
        },
        SUCCESS: {
          entry: [assign({ statusMessage: (context, event) => 'Configured' }), 'Update Configuration Status'],
          type: 'final'
        }
      }
    }, {
      guards: {
        userInitiatedConnectionServiceSuccessful: (_, event) => event.data.Envelope.Body?.RequestStateChange_OUTPUT?.ReturnValue === 0,
        shouldRetry: (context, event) => context.retryCount < 3 && event.data instanceof UNEXPECTED_PARSE_ERROR
      },
      actions: {
        'Update Configuration Status': (context, event) => {
          // TODO: [tech debt] uncouple reference dependency, state machine should return status
          devices[context.clientId].status.CIRAConnection = context.statusMessage
        },
        'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 },
        'Reset Retry Count': assign({ retryCount: (context, event) => 0 }),
        'Increment Retry Count': assign({ retryCount: (context, event) => context.retryCount + 1 })
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

  async enumerateManagementPresenceRemoteSAP (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    if (context.amt != null) {
      context.xmlMessage = context.amt.ManagementPresenceRemoteSAP.Enumerate()
      return await invokeWsmanCall(context)
    } else {
      this.logger.error('Null object in enumerateManagementPresenceRemoteSAP()')
    }
  }

  async pullManagementPresenceRemoteSAP (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    if (context.amt != null) {
      // TODO: [tech debt] uncouple nested dependency for wrapped message
      context.xmlMessage = context.amt.ManagementPresenceRemoteSAP.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
      return await invokeWsmanCall(context)
    } else {
      this.logger.error('Null object in pullManagementPresenceRemoteSAP()')
    }
  }

  async addRemoteAccessPolicyRule (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    if (context.amt != null) {
      const selector = {
        name: 'Name',
        value: context.message.Envelope.Body.PullResponse.Items.AMT_ManagementPresenceRemoteSAP.Name
      }
      const policy: AMT.Models.RemoteAccessPolicyRule = {
        Trigger: 2, // 2 – Periodic
        TunnelLifeTime: 0, // 0 means that the tunnel should stay open until it is closed
        ExtendedData: 'AAAAAAAAABk=' // Equals to 25 seconds in base 64 with network order.
      }
      context.xmlMessage = context.amt.RemoteAccessService.AddRemoteAccessPolicyRule(policy, selector)
      return await invokeWsmanCall(context, 2)
    } else {
      this.logger.error('Null object in addRemoteAccessPolicyRule()')
    }
  }

  async getEnvironmentDetectionSettings (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    if (context.amt != null) {
      context.xmlMessage = context.amt.EnvironmentDetectionSettingData.Get()
      return await invokeWsmanCall(context, 2)
    } else {
      this.logger.error('Null object in getEnvironmentDetectionSettings()')
    }
  }

  async putEnvironmentDetectionSettings (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    if (context.amt != null && Environment.Config != null) {
      const envSettings: AMT.Models.EnvironmentDetectionSettingData = context.message.Envelope.Body.AMT_EnvironmentDetectionSettingData
      if (Environment.Config.disable_cira_domain_name) {
        envSettings.DetectionStrings = [Environment.Config.disable_cira_domain_name]
      } else {
        envSettings.DetectionStrings = [`${randomUUID()}.com`]
      }
      context.xmlMessage = context.amt.EnvironmentDetectionSettingData.Put(envSettings)
      return await invokeWsmanCall(context, 2)
    } else {
      this.logger.error('Null object in putEnvironmentDetectionSettings()')
    }
  }

  async addTrustedRootCertificate (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    if (context.amt != null) {
      context.xmlMessage = context.amt.PublicKeyManagementService.AddTrustedRootCertificate({ CertificateBlob: context.ciraConfig.mpsRootCertificate })
      return await invokeWsmanCall(context, 2)
    } else {
      this.logger.error('Null object in addTrustedRootCertificate()')
    }
  }

  async addMPS (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    if (context.amt != null) {
      const server: Models.MPServer = {
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
      context.xmlMessage = context.amt.RemoteAccessService.AddMPS(server)
      return await invokeWsmanCall(context, 2)
    } else {
      this.logger.error('Null object in addMPS()')
    }
  }

  async enumerateRemoteAccessPolicyAppliesToMPS (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    if (context.amt != null) {
      context.xmlMessage = context.amt.RemoteAccessPolicyAppliesToMPS.Enumerate()
      return await invokeWsmanCall(context, 2)
    } else {
      this.logger.error('Null object in enumerateRemoteAccessPolicyAppliesToMPS()')
    }
  }

  async pullRemoteAccessPolicyAppliesToMPS (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    if (context.amt != null) {
      context.xmlMessage = context.amt.RemoteAccessPolicyAppliesToMPS.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
      return await invokeWsmanCall(context)
    } else {
      this.logger.error('Null object in pullRemoteAccessPolicyAppliesToMPS()')
    }
  }

  async putRemoteAccessPolicyAppliesToMPS (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    if (context.amt != null) {
      const data = context.message.Envelope.Body.PullResponse.Items.AMT_RemoteAccessPolicyAppliesToMPS
      data.MpsType = MPSType.Both
      context.xmlMessage = context.amt.RemoteAccessPolicyAppliesToMPS.Put(data)
      return await invokeWsmanCall(context, 2)
    } else {
      this.logger.error('Null object in putRemoteAccessPolicyAppliesToMPS()')
    }
  }

  async userInitiatedConnectionService (context: CIRAConfigContext, event: CIRAConfigEvent): Promise<void> {
    if (context.amt != null) {
      context.xmlMessage = context.amt.UserInitiatedConnectionService.RequestStateChange(32771)
      return await invokeWsmanCall(context, 2)
    } else {
      this.logger.error('Null object in userInitiatedConnectionService()')
    }
  }
}
