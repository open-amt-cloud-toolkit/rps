/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMT, IPS, CIM } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine, interpret, sendTo } from 'xstate'
import { ClientAction } from '../models/RCS.Config.js'
import { HttpHandler } from '../HttpHandler.js'
import Logger from '../Logger.js'
import { type AMTConfiguration, type AMTDomain } from '../models/index.js'
import { Environment } from '../utils/Environment.js'
import { MqttProvider } from '../utils/MqttProvider.js'
import { devices } from '../WebSocketListener.js'
import got from 'got'
import { CertManager } from '../certManager.js'
import { PasswordHelper } from '../utils/PasswordHelper.js'
import { SignatureHelper } from '../utils/SignatureHelper.js'
import { Error } from './error.js'
import { FeaturesConfiguration } from './featuresConfiguration.js'
import { NodeForge } from '../NodeForge.js'
import { Configurator } from '../Configurator.js'
import { Validator } from '../Validator.js'
import { DbCreatorFactory } from '../factories/DbCreatorFactory.js'
import { AMTUserName, GATEWAY_TIMEOUT_ERROR } from '../utils/constants.js'
import { CIRAConfiguration } from './ciraConfiguration.js'
import { TLS } from './tls.js'
import { invokeWsmanCall } from './common.js'
import ClientResponseMsg from '../utils/ClientResponseMsg.js'
import { Unconfiguration } from './unconfiguration.js'
import { type DeviceCredentials } from '../interfaces/ISecretManagerService.js'
import { NetworkConfiguration } from './networkConfiguration.js'

export interface ActivationContext {
  profile: AMTConfiguration
  amtDomain: AMTDomain
  message: any
  clientId: string
  xmlMessage: string
  status: 'success' | 'error'
  errorMessage: string
  generalSettings?: AMT.Models.GeneralSettings
  targetAfterError: string
  httpHandler: HttpHandler
  isActivated?: boolean
  hasToUpgrade?: boolean
  amt: AMT.Messages
  ips: IPS.Messages
  cim: CIM.Messages
  certChainPfx: any
  tenantId: string
  canActivate: boolean
  friendlyName?: string
}

export interface ActivationEvent {
  type: 'ACTIVATION' | 'ACTIVATED' | 'ONFAILED'
  clientId: string
  data?: any
  tenantId: string
  friendlyName: string
}

export class Activation {
  nodeForge: NodeForge
  certManager: CertManager
  signatureHelper: SignatureHelper
  configurator: Configurator
  validator: Validator
  logger: Logger
  dbFactory: DbCreatorFactory
  db: any
  error: Error = new Error()
  networkConfiguration: NetworkConfiguration = new NetworkConfiguration()
  featuresConfiguration: FeaturesConfiguration = new FeaturesConfiguration()
  cira: CIRAConfiguration = new CIRAConfiguration()
  unconfiguration: Unconfiguration = new Unconfiguration()
  tls: TLS = new TLS()

  machine =

    /** @xstate-layout N4IgpgJg5mDOIC5QEMDGAXAlgN2Vg9gHYC0AtmgBaaFgB0AqgHIAKASgPIBqAkgMrftGAUQAiAYgCCAYQAq3ThLmDEoAA75YmAoRUgAHogCMAVgDMABlrGATADZzt6+cOGA7IYAcHgDQgAnogALB7WtACcjubmxrYm1qaBgQC+Sb5oWLjaZJTUdADiQjIA+gXCrBIAMkW8hXKMebxiEER01Nj4ANZ0sGCEEMQwNABOyAA2PehYhFDwSCDqmtq6BghOgca0HoaBtmGudjHWxr4BCLGutNYers6uIdYHtilpGDh4mETZqFQ0tAXFpSE5SqNRkdQaYjAQyG+CGtFUozwADNYaRaD0+gNelCxhMpjNdAstB8dHMViYLFY7A4nC53F4Tohzpdrrd7o9niB0m8suRvrlaFJBJwgcUABoAWSqMnYRQAUrxBGJCRpiURlohrO5Qg8Yjs9o9rIyzoEwrRzGE4g9DLZXBEwpzuZkSV8fnRWEIJCISkIypVqrVuPVGirFiSNQhTLTLrYzB5zB5jGFTK5jv4mabzZabNbbfbHa9nZ8+W7BQAJIRSADSRRE3AKvGKHsqEuVcyJSzJiFMxlTlzCgUMV0HdtsDPTCF7ploiTCNgtUfMWuSqS5hfexZyv24zF4RTL7EbACEJDURKD6LugTwpEImi1aG1Ot1ev0KBp0AAjZA9CATACuqihmqpKgCswQeOEYQOLEjiGAuqbGi4xiQS4CTxlc6GxgWGQbiQJYCjue4Hsep6iBeV6sDed5QjCcIIsiqLoq+xDvrAX4-pAAFAe2qqdmBQReFBME2tY8HJohE5bIYlxalcWrbB4gSmB4OE8i6BG-F6IjCGKMi3qwdRSGWEhBvevxPl0zGYqgUJYEimCoHgYDAfx+iIPOtA9kmFqzlqaanAOoQJjYSmBPEISqauTp4a6Arabp+mikGxmmYwkLQrC8KIugKJDGiGL9LZQz2Y5zmueGXYINcoQ2h4pgJBECEBUYdiBOE5x7K4gSuHm1hqUW+FbnQXoSkGFHma0hDtFZhXEMgECkNQ3EVeqVU1bQdUNaa9gSS1CDhTJ5iBM4J13K4vXHQNsWaSNIhjYwE20VlDG5Uxc0LUthArbxYZrQJ1X7JtY7bU1e3GmOlimLsVzwdEiYDtdvLDbQE3NBZ03PtZ-Q-WofGVQDG1bY1u0pvtQ4ySdLi2Cm0N7JaTzReuyP8r8T2ZfROV5QVLG4-M+P-e5gO1SDJPNcaPZQ9Yg607sdo2qYSMaSjvASCKIhCNRk2Ppjs3INgYDEBAYDYI5Lm-SBEYUpYNj2JEdKeD4E7Rg1dohG4F0JCpSubqzdCq+rmvcLeGV0dljH5ei+uG8bpu2atoFC9bVJ27SbiO8ag46jsURiQasaMy8uEs6WQIcKw2uWXQz1DHFNAJ1bZg29S9vp+OpypjJsROBYS5hNY+ZM8Xyt+7QZfsBXggAGKmRUogN1Vye2zSzht07pyJhsSZxDY8HGMYCY+0No9BgoFTcN6dYNk2noVK2C8A+FzjmgmT-rLGSYQ5mFpWmJea7CkVchB8DG1mCgZmI9SxMDYFwPgAhhAiAfknCKVh+42H7hEa4+0D4bGCMdMI-dbS9i2EfOu+RCg+j9CCQMwYkHkhQu1W0RwTAeF2NsBwxokyQTEgfOwm8dheFIbdQUwpRRFElNKWUCplAWzcisJwQNEgxHOuJMmnC7i0FsMpcwPYvCsPcA6Ie6lfalmbN6QEwIAxgiDA0OhmpXAqU2DERwSk3CYPXh5MI3CTBLjHPvARUUi7GOPqWYylYaxXyEI2IozY752MjA8C4HgIjQ3iMdMcklTg0zNPGfeLgeo50RkYwaZDaBEX3IeGQJ4zwURqFRYOQh4nhWNOdGMDxWEpl2GYfqxSboowSkIPSBkjImSDPE4wJhNF-20bYLRNIkJiXaiFCwEUaYTKEf0+641CiXnGf3KwPknAENJh4g6vVNp3EcHOXsA8FYbNHhRPZoR97QSOWDFSSFzlmAiDYA+sZ4IriCSU4RAdRBB1vPE+CQNdE6IeIacmF0vL7C8ShUwXjlKpnuaXVg5d4nQUgnaZMNoTqOH2o4UIsYoxJi1A45SgS1zDxMYRRgZ8L61nrFEm+LZ4kqUSOaK4B94IPAiLYThXjLg+L4f4sc9KYolwFDPbgc9EGyIJkLcKWpNFoqptBTw+xOFjnNIOPUA52GOCxQKGBPB+CCHnqqwW9DeybV7MdBILrTBDgWZYK4o4VK2j1cYC19d7WJ3JKczwgCkhAA */
    createMachine<ActivationContext, ActivationEvent>({
      preserveActionOrder: true,
      predictableActionArguments: true,
      context: {
        profile: null,
        amtDomain: null,
        message: null,
        clientId: '',
        xmlMessage: '',
        status: 'success',
        errorMessage: '',
        tenantId: '',
        canActivate: true,
        hasToUpgrade: false,
        generalSettings: null,
        targetAfterError: null,
        httpHandler: new HttpHandler(),
        isActivated: false,
        certChainPfx: null,
        amt: new AMT.Messages(),
        ips: new IPS.Messages(),
        cim: new CIM.Messages(),
        friendlyName: null
      },
      id: 'activation-machine',
      initial: 'UNPROVISIONED',
      states: {
        UNPROVISIONED: {
          on: {
            ACTIVATION: {
              actions: assign({
                clientId: (context, event) => event.clientId,
                isActivated: () => false,
                tenantId: (context, event) => event.tenantId,
                friendlyName: (context, event) => event.friendlyName
              }),
              target: 'GET_AMT_PROFILE'
            },
            ACTIVATED: {
              actions: assign({
                clientId: (context, event) => event.clientId,
                isActivated: () => true,
                tenantId: (context, event) => event.tenantId,
                friendlyName: (context, event) => event.friendlyName
              }),
              target: 'GET_AMT_PROFILE'
            }
          }
        },
        GET_AMT_PROFILE: {
          invoke: {
            src: this.getAMTProfile.bind(this),
            id: 'get-amt-profile',
            onDone: {
              actions: assign({ profile: (context, event) => event.data }),
              target: 'CHECK_PROFILE_TYPE'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to get amt profile from database' }),
              target: 'FAILED'
            }
          }
        },
        CHECK_PROFILE_TYPE: {
          always: [
            {
              cond: 'isActivated',
              target: 'CHECK_TENANT_ACCESS'
            }, {
              cond: 'isAdminMode',
              target: 'GET_AMT_DOMAIN_CERT'
            }, {
              target: 'GET_GENERAL_SETTINGS'
            }
          ]
        },
        CHECK_TENANT_ACCESS: {
          invoke: {
            src: this.getDeviceFromMPS.bind(this),
            id: 'check-tenant-access',
            onDone: {
              actions: assign({ canActivate: (context, event) => event.data }),
              target: 'DETERMINE_CAN_ACTIVATE'
            },
            onError: {
              target: 'GET_GENERAL_SETTINGS'
            }
          }
        },
        DETERMINE_CAN_ACTIVATE: {
          always: [{
            cond: 'canUpgrade',
            actions: assign({ hasToUpgrade: (context, event) => true }),
            target: 'GET_AMT_DOMAIN_CERT'
          }, {
            cond: 'canActivate',
            target: 'GET_GENERAL_SETTINGS'
          }, {
            actions: assign({ errorMessage: 'Device belongs to another tenant. Please unprovision and re-activate device.' }),
            target: 'FAILED'
          }
          ]
        },
        GET_AMT_DOMAIN_CERT: {
          invoke: {
            src: this.getAMTDomainCert.bind(this),
            id: 'get-amt-domain',
            onDone: {
              actions: assign({ amtDomain: (context, event) => event.data }),
              target: 'EXTRACT_DOMAIN_CERT'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to get amt domain certificate from database' }),
              target: 'FAILED'
            }
          }
        },
        EXTRACT_DOMAIN_CERT: {
          entry: 'Get Provisioning CertObj',
          always: [
            {
              cond: 'isCertExtracted',
              actions: (context, event) => { devices[context.clientId].count = 1 },
              target: 'COMPARE_DEVICE_HASHES'
            },
            {
              actions: assign({ errorMessage: 'Failed to extract domain certificate' }),
              target: 'FAILED'
            }
          ]
        },
        COMPARE_DEVICE_HASHES: {
          entry: 'Compare Domain Cert Hashes',
          always: [
            {
              cond: 'isValidCert',
              actions: (context, event) => { devices[context.clientId].count = 1 },
              target: 'GET_GENERAL_SETTINGS'
            },
            {
              actions: assign({ errorMessage: 'Invalid domain certificate, hash does not exists in list of trusted root certificates on AMT' }),
              target: 'FAILED'
            }
          ]
        },
        GET_GENERAL_SETTINGS: {
          invoke: {
            src: this.getGeneralSettings.bind(this),
            id: 'send-generalsettings',
            onDone: {
              actions: [assign({ message: (context, event) => event.data }), 'Reset Unauth Count'],
              target: 'READ_GENERAL_SETTINGS'
            },
            onError: {
              actions: assign({
                message: (context, event) => event.data,
                targetAfterError: (context, event) => 'GET_GENERAL_SETTINGS'
              }),
              target: 'ERROR'
            }
          }
        },
        READ_GENERAL_SETTINGS: {
          entry: 'Read General Settings',
          always: {
            target: 'CHECK_DIGEST_REALM'
          }
        },
        CHECK_DIGEST_REALM: {
          always: [
            {
              cond: 'isDigestRealmInvalid',
              target: 'INVALID_DIGEST_REALM'
            }, {
              cond: 'canUpgrade',
              target: 'IPS_HOST_BASED_SETUP_SERVICE'
            }, {
              cond: 'isActivated',
              target: 'CHANGE_AMT_PASSWORD'
            }, {
              cond: 'isAdminMode',
              target: 'IPS_HOST_BASED_SETUP_SERVICE'
            }, {
              target: 'SETUP'
            }
          ]
        },
        IPS_HOST_BASED_SETUP_SERVICE: {
          invoke: {
            src: this.getHostBasedSetupService.bind(this),
            id: 'send-hostbasedsetup',
            onDone: {
              actions: [assign({ message: (context, event) => event.data }), 'Read Host Based Setup Service'],
              target: 'ADD_NEXT_CERT_IN_CHAIN'
            },
            onError: {
              target: 'ERROR'
            }
          }
        },
        ADD_NEXT_CERT_IN_CHAIN: {
          invoke: {
            src: this.getNextCERTInChain.bind(this),
            id: 'send-certificate',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'CHECK_CERT_CHAIN_RESPONSE'
            },
            onError: {
              target: 'ERROR'
            }
          }
        },
        CHECK_CERT_CHAIN_RESPONSE: {
          always: [
            {
              cond: 'isCertNotAdded',
              actions: assign({ errorMessage: (context, event) => `Device ${devices[context.clientId].uuid} activation failed. Error while adding the certificates to AMT.` }),
              target: 'FAILED'
            }, {
              cond: 'maxCertLength',
              target: 'ADD_NEXT_CERT_IN_CHAIN'
            }, {
              cond: 'canUpgrade',
              target: 'UPGRADE_TO_ADMIN_SETUP'
            }, {
              target: 'ADMIN_SETUP'
            }
          ]
        },
        ADMIN_SETUP: {
          invoke: {
            src: this.sendAdminSetup.bind(this),
            id: 'send-adminsetup',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'CHECK_ADMIN_SETUP'
            },
            onError: [
              {
                cond: (_, event) => event.data instanceof GATEWAY_TIMEOUT_ERROR,
                target: 'CHECK_ACTIVATION_ON_AMT'
              },
              {
                target: 'ERROR'
              }
            ]
          }
        },
        CHECK_ADMIN_SETUP: {
          always: [
            {
              cond: 'isDeviceActivatedInACM',
              actions: [(context, event) => { devices[context.clientId].status.Status = 'Admin control mode.' }, 'Set activation status'],
              target: 'UPDATE_CREDENTIALS'
            },
            {
              cond: 'isDeviceAdminModeActivated',
              actions: [(context, event) => { devices[context.clientId].status.Status = 'Admin control mode.' }, 'Set activation status'],
              target: 'DELAYED_TRANSITION'
            }, {
              actions: assign({ errorMessage: 'Failed to activate in admin control mode.' }),
              target: 'FAILED'
            }
          ]
        },
        UPGRADE_TO_ADMIN_SETUP: {
          invoke: {
            src: this.sendUpgradeClientToAdmin.bind(this),
            id: 'send-upgrade-to-admin',
            onDone: [
              {
                actions: assign({ message: (context, event) => event.data }),
                target: 'CHECK_UPGRADE'
              }
            ],
            onError: [
              {
                cond: (_, event) => event.data instanceof GATEWAY_TIMEOUT_ERROR,
                target: 'CHECK_ACTIVATION_ON_AMT'
              },
              {
                target: 'ERROR'
              }
            ]
          }
        },
        CHECK_UPGRADE: {
          always: [
            {
              cond: 'isDeviceActivatedInACM',
              actions: [(context, event) => { devices[context.clientId].status.Status = 'Upgraded to admin control mode.' }, 'Set activation status'],
              target: 'CHANGE_AMT_PASSWORD'
            },
            {
              cond: 'isUpgraded',
              actions: [(context, event) => { devices[context.clientId].status.Status = 'Upgraded to admin control mode.' }, 'Set activation status'],
              target: 'CHANGE_AMT_PASSWORD'
            }, {
              actions: assign({ errorMessage: 'Failed to upgrade to admin control mode.' }),
              target: 'FAILED'
            }
          ]
        },
        SETUP: {
          invoke: {
            src: this.sendClientSetup.bind(this),
            id: 'send-setup',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'CHECK_SETUP'
            },
            onError: [
              {
                cond: (_, event) => event.data instanceof GATEWAY_TIMEOUT_ERROR,
                target: 'CHECK_ACTIVATION_ON_AMT'
              },
              {
                target: 'ERROR'
              }
            ]
          }
        },
        CHECK_SETUP: {
          always: [
            {
              cond: 'isDeviceActivatedInCCM',
              actions: [(context, event) => { devices[context.clientId].status.Status = 'Client control mode.' }, 'Set activation status'],
              target: 'UPDATE_CREDENTIALS'
            },
            {
              cond: 'isDeviceClientModeActivated',
              actions: [(context, event) => { devices[context.clientId].status.Status = 'Client control mode.' }, 'Set activation status'],
              target: 'DELAYED_TRANSITION'
            }, {
              actions: assign({ errorMessage: 'Failed to activate in client control mode.' }),
              target: 'FAILED'
            }
          ]
        },
        CHECK_ACTIVATION_ON_AMT: {
          invoke: {
            src: this.getActivationStatus.bind(this),
            id: 'get-activationstatus',
            onDone: [
              {
                cond: 'hasToUpgrade',
                actions: assign({ message: (context, event) => event.data }),
                target: 'CHECK_UPGRADE'
              },
              {
                cond: 'isAdminMode',
                actions: assign({ message: (context, event) => event.data }),
                target: 'CHECK_ADMIN_SETUP'
              },
              {
                actions: assign({ message: (context, event) => event.data }),
                target: 'CHECK_SETUP'
              }],
            onError: [
              {
                actions: assign({
                  message: (context, event) => event.data,
                  targetAfterError: (context, event) => 'CHECK_ACTIVATION_ON_AMT'
                }),
                target: 'ERROR'
              }
            ]
          }
        },
        DELAYED_TRANSITION: {
          after: {
            DELAY_TIME_ACTIVATION_SYNC: { target: 'UPDATE_CREDENTIALS' }
          }
        },
        UPDATE_CREDENTIALS: {
          entry: ['Update AMT Credentials'],
          always: [
            {
              cond: 'isAdminMode',
              target: 'SET_MEBX_PASSWORD'
            }, {
              target: 'SAVE_DEVICE_TO_SECRET_PROVIDER'
            }]
        },
        SET_MEBX_PASSWORD: {
          invoke: {
            src: this.setMEBxPassword.bind(this),
            id: 'send-mebx-password',
            onDone: {
              actions: [assign({ message: (context, event) => event.data }), 'Reset Unauth Count'],
              target: 'SAVE_DEVICE_TO_SECRET_PROVIDER'
            },
            onError: {
              actions: assign({
                message: (context, event) => event.data,
                targetAfterError: (context, event) => 'SET_MEBX_PASSWORD'
              }),
              target: 'ERROR'
            }
          }
        },
        SAVE_DEVICE_TO_SECRET_PROVIDER: {
          invoke: {
            src: this.saveDeviceInfoToSecretProvider.bind(this),
            id: 'save-device-secret-provider',
            onDone: 'SAVE_DEVICE_TO_MPS',
            onError: 'SAVE_DEVICE_TO_SECRET_PROVIDER_FAILURE'
          }
        },
        SAVE_DEVICE_TO_MPS: {
          invoke: {
            src: this.saveDeviceInfoToMPS.bind(this),
            id: 'save-device-to-mps',
            onDone: 'UNCONFIGURATION',
            onError: 'SAVE_DEVICE_TO_MPS_FAILURE'
          }
        },
        SAVE_DEVICE_TO_SECRET_PROVIDER_FAILURE: {
          entry: assign({ errorMessage: 'Failed to save device information to Secret Provider' }),
          always: 'FAILED'
        },
        SAVE_DEVICE_TO_MPS_FAILURE: {
          entry: assign({ errorMessage: 'Failed to save device information to MPS' }),
          always: 'FAILED'
        },
        CHANGE_AMT_PASSWORD: {
          invoke: {
            src: this.changeAMTPassword.bind(this),
            id: 'send-to-change-amt-password',
            onDone: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'UPDATE_CREDENTIALS'
            },
            onError: {
              actions: assign({ message: (context, event) => event.data }),
              target: 'ERROR'
            }
          }
        },
        UNCONFIGURATION: {
          entry: sendTo('unconfiguration-machine', { type: 'REMOVECONFIG' }),
          invoke: {
            src: this.unconfiguration.machine,
            id: 'unconfiguration-machine',
            data: {
              clientId: (context, event) => context.clientId,
              profile: (context, event) => context.profile,
              httpHandler: (context, _) => context.httpHandler,
              amt: (context, event) => context.amt,
              ips: (context, event) => context.ips,
              cim: (context, event) => context.cim
            },
            onDone: 'NETWORK_CONFIGURATION'
          }
        },
        NETWORK_CONFIGURATION: {
          entry: sendTo('network-configuration-machine', { type: 'NETWORKCONFIGURATION' }),
          invoke: {
            src: this.networkConfiguration.machine,
            id: 'network-configuration-machine',
            data: {
              amtProfile: (context, event) => context.profile,
              generalSettings: (context, event) => context.generalSettings,
              clientId: (context, event) => context.clientId,
              httpHandler: (context, _) => context.httpHandler,
              amt: (context, event) => context.amt,
              ips: (context, event) => context.ips,
              cim: (context, event) => context.cim
            },
            onDone: 'FEATURES_CONFIGURATION'
          }
        },
        FEATURES_CONFIGURATION: {
          entry: sendTo('features-configuration-machine', { type: 'CONFIGURE_FEATURES' }),
          invoke: {
            src: this.featuresConfiguration.machine,
            id: 'features-configuration-machine',
            data: {
              clientId: (context, event) => context.clientId,
              amtConfiguration: (context, event) => context.profile,
              httpHandler: (context, _) => context.httpHandler,
              amt: (context, event) => context.amt,
              ips: (context, event) => context.ips,
              cim: (context, event) => context.cim
            },
            onDone: [
              {
                cond: 'hasCIRAProfile',
                target: 'CIRA'
              },
              { target: 'TLS' }
            ]
          }
        },
        CIRA: {
          entry: sendTo('cira-machine', { type: 'CONFIGURE_CIRA' }),
          invoke: {
            src: this.cira.machine,
            id: 'cira-machine',
            data: {
              clientId: (context, event) => context.clientId,
              profile: (context, event) => context.profile,
              httpHandler: (context, _) => context.httpHandler,
              amt: (context, event) => context.amt,
              tenantId: (context, event) => context.tenantId
            },
            onDone: 'PROVISIONED'
          }
        },
        TLS: {
          entry: sendTo('tls-machine', { type: 'CONFIGURE_TLS' }),
          invoke: {
            src: this.tls.machine,
            id: 'tls-machine',
            data: {
              clientId: (context, event) => context.clientId,
              amtProfile: (context, event) => context.profile,
              httpHandler: (context, _) => context.httpHandler,
              amt: (context, event) => context.amt
            },
            onDone: 'PROVISIONED'
          }
        },
        PROVISIONED: {
          entry: [
            assign({ status: (context, event) => 'success' }),
            'Send Message to Device'
          ],
          type: 'final'
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
            onDone: 'NEXT_STATE'
          },
          on: {
            ONFAILED: {
              actions: assign({ errorMessage: (context, event) => event.data }),
              target: 'FAILED'
            }
          }
        },
        NEXT_STATE: {
          always: [
            {
              cond: 'isGeneralSettings',
              target: 'GET_GENERAL_SETTINGS'
            }, {
              cond: 'isMebxPassword',
              target: 'SET_MEBX_PASSWORD'
            }, {
              cond: 'isCheckActivationOnAMT',
              target: 'CHECK_ACTIVATION_ON_AMT'
            }]
        },
        INVALID_DIGEST_REALM: {
          entry: assign({ errorMessage: 'Not a valid digest realm.' }),
          always: {
            target: 'FAILED'
          }
        },
        FAILED: {
          entry: [
            assign({ status: (context, event) => 'error' }),
            'Send Message to Device'
          ],
          type: 'final'
        }
      }
    }, {
      delays: {
        DELAY_TIME_ACTIVATION_SYNC: () => Environment.Config.delay_activation_sync
      },
      guards: {
        isAdminMode: (context, event) => context.profile.activation === ClientAction.ADMINCTLMODE,
        isCertExtracted: (context, event) => context.certChainPfx != null,
        isValidCert: (context, event) => devices[context.clientId].certObj != null,
        isDigestRealmInvalid: (context, event) => !this.validator.isDigestRealmValid(devices[context.clientId].ClientData.payload.digestRealm),
        maxCertLength: (context, event) => devices[context.clientId].count <= devices[context.clientId].certObj.certChain.length,
        isDeviceAdminModeActivated: (context, event) => context.message.Envelope.Body?.AdminSetup_OUTPUT?.ReturnValue === 0,
        isDeviceClientModeActivated: (context, event) => context.message.Envelope.Body?.Setup_OUTPUT?.ReturnValue === 0,
        isDeviceActivatedInACM: (context, event) => context.message.Envelope.Body?.IPS_HostBasedSetupService?.CurrentControlMode === 2,
        isDeviceActivatedInCCM: (context, event) => context.message.Envelope.Body?.IPS_HostBasedSetupService?.CurrentControlMode === 1,
        isCertNotAdded: (context, event) => context.message.Envelope.Body.AddNextCertInChain_OUTPUT.ReturnValue !== 0,
        isGeneralSettings: (context, event) => context.targetAfterError === 'GET_GENERAL_SETTINGS',
        isMebxPassword: (context, event) => context.targetAfterError === 'SET_MEBX_PASSWORD',
        isCheckActivationOnAMT: (context, event) => context.targetAfterError === 'CHECK_ACTIVATION_ON_AMT',
        isUpgraded: (context, event) => context.message.Envelope.Body.UpgradeClientToAdmin_OUTPUT.ReturnValue === 0,
        hasCIRAProfile: (context, event) => context.profile.ciraConfigName != null,
        isActivated: (context, event) => context.isActivated,
        canActivate: (context, event) => context.canActivate,
        hasToUpgrade: (context, event) => context.hasToUpgrade,
        canUpgrade: (context, event) => context.isActivated && devices[context.clientId].ClientData.payload.currentMode === 1 && context.profile.activation === ClientAction.ADMINCTLMODE
      },
      actions: {
        'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 },
        'Read General Settings': this.readGeneralSettings.bind(this),
        'Read Host Based Setup Service': this.readHostBasedSetupService.bind(this),
        'Set activation status': this.setActivationStatus.bind(this),
        'Send Message to Device': this.sendMessageToDevice.bind(this),
        'Get Provisioning CertObj': this.GetProvisioningCertObj.bind(this),
        'Compare Domain Cert Hashes': this.compareCertHashes.bind(this),
        'Update AMT Credentials': this.updateCredentials.bind(this)
      }
    })

  service = interpret(this.machine).onTransition((state) => {
    console.log(`Current state of Activation Machine: ${JSON.stringify(state.value)}`)
    if (state.children['unconfiguration-machine'] != null) {
      state.children['unconfiguration-machine'].subscribe((childState) => {
        console.log(`Unconfiguration State: ${childState.value}`)
      })
    }
    if (state.children['IEEE8021x-configuration-machine'] != null) {
      state.children['IEEE8021x-configuration-machine'].subscribe((childState) => {
        console.log(`IEEE8021x configuration State: ${childState.value}`)
      })
    }
    if (state.children['network-configuration-machine'] != null) {
      state.children['network-configuration-machine'].subscribe((childState) => {
        console.log(`Network Configuration Machine: ${childState.value}`)
      })
    }
    if (state.children['features-configuration-machine'] != null) {
      state.children['features-configuration-machine'].subscribe((childState) => {
        console.log(`AMT Features State: ${childState.value}`)
      })
    }
    if (state.children['tls-machine'] != null) {
      state.children['tls-machine'].subscribe((childState) => {
        console.log(`TLS State: ${childState.value}`)
      })
    }
    if (state.children['cira-machine'] != null) {
      state.children['cira-machine'].subscribe((childState) => {
        console.log(`CIRA State: ${childState.value}`)
      })
    }
  }).onDone((data) => {
    console.log('ONDONE:')
    console.log(data)
  }).onEvent((data) => {
    console.log('ONEVENT:')
    console.log(data)
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

  updateCredentials (context: ActivationContext, event: ActivationEvent): void {
    devices[context.clientId].connectionParams.username = AMTUserName
    devices[context.clientId].connectionParams.password = devices[context.clientId].amtPassword
  }

  async getAMTProfile (context: ActivationContext, event: ActivationEvent): Promise<AMTConfiguration> {
    this.db = await this.dbFactory.getDb()
    const profile = await this.configurator.profileManager.getAmtProfile(devices[context.clientId].ClientData.payload.profile.profileName, context.tenantId)
    return profile
  }

  async getDeviceFromMPS (context: ActivationContext, event: ActivationEvent): Promise<any> {
    const clientObj = devices[context.clientId]
    try {
      const result = await got(`${Environment.Config.mps_server}/api/v1/devices/${clientObj.uuid}?tenantId=${context.profile.tenantId}`, {
        method: 'GET'
      })

      if (result?.body != null && result?.body !== '') {
        return true // if we have a result the device is already in their tenant and can activated
      }
      return false // if we have a success repsonse, but no result -- it means the device belongs to another tenant --
      // prevent activation without unprovision first.
    } catch (err) {
      return true // no one has registered this device and can be activated
    }
  }

  async getAMTDomainCert (context: ActivationContext, event: ActivationEvent): Promise<AMTDomain> {
    const domain = await this.configurator.domainCredentialManager.getProvisioningCert(devices[context.clientId].ClientData.payload.fqdn, context.tenantId)
    return domain
  }

  sendMessageToDevice (context: ActivationContext, event: ActivationEvent): void {
    const { clientId, status } = context
    const clientObj = devices[clientId]
    let method = null
    if (status === 'success') {
      method = 'success'
    } else if (status === 'error') {
      clientObj.status.Status = context.errorMessage !== '' ? context.errorMessage : 'Failed'
      method = 'failed'
    }
    const responseMessage = ClientResponseMsg.get(clientId, null, status, method, JSON.stringify(clientObj.status))
    this.logger.info(JSON.stringify(responseMessage, null, '\t'))
    devices[clientId].ClientSocket.send(JSON.stringify(responseMessage))
  }

  createSignedString (clientId: string, hashAlgorithm: string): boolean {
    const clientObj = devices[clientId]
    clientObj.nonce = PasswordHelper.generateNonce()
    const arr: Buffer[] = [clientObj.ClientData.payload.fwNonce, clientObj.nonce]
    try {
      clientObj.signature = this.signatureHelper.signString(Buffer.concat(arr), clientObj.certObj.privateKey, hashAlgorithm)
      return true
    } catch (err) {
      MqttProvider.publishEvent('fail', ['Activator'], 'Failed to activate', clientObj.uuid)
      return false
    }
  }

  async getGeneralSettings (context): Promise<any> {
    const amt: AMT.Messages = context.amt
    context.xmlMessage = amt.GeneralSettings.Get()
    return await invokeWsmanCall(context, 2)
  }

  async getHostBasedSetupService (context): Promise<any> {
    const ips: IPS.Messages = context.ips
    context.xmlMessage = ips.HostBasedSetupService.Get()
    return await invokeWsmanCall(context, 2)
  }

  async getNextCERTInChain (context): Promise<any> {
    context.xmlMessage = this.injectCertificate(context.clientId, context.ips)
    return await invokeWsmanCall(context)
  }

  async getPassword (context): Promise<string> {
    const amtPassword: string = await this.configurator.profileManager.getAmtPassword(context.profile.profileName, context.tenantId)
    devices[context.clientId].amtPassword = amtPassword
    if (context.profile.activation === ClientAction.ADMINCTLMODE) {
      const mebxPassword: string = await this.configurator.profileManager.getMEBxPassword(context.profile.profileName, context.tenantId)
      devices[context.clientId].mebxPassword = mebxPassword
    }
    const data: string = `admin:${devices[context.clientId].ClientData.payload.digestRealm}:${amtPassword}`
    const password = SignatureHelper.createMd5Hash(data)
    return password
  }

  async sendAdminSetup (context): Promise<any> {
    const ips: IPS.Messages = context.ips
    const { clientId, certChainPfx } = context
    const password = await this.getPassword(context)
    this.createSignedString(clientId, certChainPfx.hashAlgorithm)
    const clientObj = devices[clientId]
    context.xmlMessage = ips.HostBasedSetupService.AdminSetup(2, password, clientObj.nonce.toString('base64'), 2, clientObj.signature)
    return await invokeWsmanCall(context)
  }

  async sendUpgradeClientToAdmin (context): Promise<any> {
    const ips: IPS.Messages = context.ips
    const { clientId, certChainPfx } = context
    this.createSignedString(clientId, certChainPfx.hashAlgorithm)
    const clientObj = devices[clientId]
    context.xmlMessage = ips.HostBasedSetupService.UpgradeClientToAdmin(clientObj.nonce.toString('base64'), 2, clientObj.signature)
    return await invokeWsmanCall(context)
  }

  async getActivationStatus (context): Promise<any> {
    const ips: IPS.Messages = context.ips
    context.xmlMessage = ips.HostBasedSetupService.Get()
    return await invokeWsmanCall(context)
  }

  async sendClientSetup (context): Promise<any> {
    const ips: IPS.Messages = context.ips
    const password = await this.getPassword(context)
    context.xmlMessage = ips.HostBasedSetupService.Setup(2, password)
    return await invokeWsmanCall(context)
  }

  async changeAMTPassword (context): Promise<any> {
    const amt: AMT.Messages = context.amt
    const password = await this.getPassword(context)
    // Convert MD5 hash to raw string which utf16
    const result = password.match(/../g).map((v) => String.fromCharCode(parseInt(v, 16))).join('')
    // Encode to base64
    const encodedPassword = Buffer.from(result, 'binary').toString('base64')
    context.xmlMessage = amt.AuthorizationService.SetAdminACLEntryEx(AMTUserName, encodedPassword)
    return await invokeWsmanCall(context)
  }

  async setMEBxPassword (context): Promise<any> {
    const amt = new AMT.Messages()
    context.xmlMessage = amt.SetupAndConfigurationService.SetMEBXPassword(devices[context.clientId].mebxPassword)
    return await invokeWsmanCall(context)
  }

  injectCertificate (clientId: string, ips: IPS.Messages): string {
    const clientObj = devices[clientId]
    // inject certificates in proper order with proper flags
    if (clientObj.count <= clientObj.certObj.certChain.length) {
      let xmlRequestBody = ''
      let isLeaf = false
      let isRoot = false
      if (clientObj.count === 1) {
        isLeaf = true
      } else if (clientObj.count === clientObj.certObj.certChain.length) {
        isRoot = true
      }
      xmlRequestBody = ips.HostBasedSetupService.AddNextCertInChain(clientObj.certObj.certChain[clientObj.count - 1], isLeaf, isRoot)
      ++devices[clientId].count
      this.logger.debug(`xmlRequestBody ${clientObj.uuid} : ${xmlRequestBody}`)
      return xmlRequestBody
    }
  }

  GetProvisioningCertObj (context: ActivationContext, event: ActivationEvent): void {
    const { amtDomain, clientId } = context
    try {
      // read in cert
      const pfxb64: string = Buffer.from(amtDomain.provisioningCert, 'base64').toString('base64')
      // convert the certificate pfx to an object
      const pfxobj = this.certManager.convertPfxToObject(pfxb64, amtDomain.provisioningCertPassword)
      // return the certificate chain pems and private key
      context.certChainPfx = this.certManager.dumpPfx(pfxobj)
    } catch (error) {
      this.logger.error(`Device ${devices[clientId].uuid} Failed to get provisioning certificate.`)
      devices[clientId].certObj = null
    }
  }

  compareCertHashes (context: ActivationContext, event: ActivationEvent): void {
    const { clientId, certChainPfx } = context
    // check that provisioning certificate root matches one of the trusted roots from AMT
    for (const hash in devices[clientId].ClientData.payload.certHashes) {
      if (devices[clientId].ClientData.payload.certHashes[hash]?.toLowerCase() === certChainPfx.fingerprint?.sha256?.toLowerCase()) {
        devices[clientId].certObj = certChainPfx.provisioningCertificateObj
      } else if (devices[clientId].ClientData.payload.certHashes[hash]?.toLowerCase() === certChainPfx.fingerprint?.sha1?.toLowerCase()) {
        devices[clientId].certObj = certChainPfx.provisioningCertificateObj
      }
    }
  }

  readGeneralSettings (context: ActivationContext, event: ActivationEvent): void {
    const clientObj = devices[context.clientId]
    context.generalSettings = context.message.Envelope.Body.AMT_GeneralSettings
    clientObj.ClientData.payload.digestRealm = context.generalSettings.DigestRealm
    clientObj.hostname = clientObj.ClientData.payload.hostname
  }

  readHostBasedSetupService (context: ActivationContext, event: ActivationEvent): void {
    const resBody = context.message.Envelope.Body
    const clientObj = devices[context.clientId]
    clientObj.ClientData.payload.fwNonce = Buffer.from(resBody.IPS_HostBasedSetupService.ConfigurationNonce, 'base64')
    clientObj.ClientData.payload.modes = resBody.IPS_HostBasedSetupService.AllowedControlModes
  }

  setActivationStatus (context: ActivationContext, event: ActivationEvent): void {
    const clientObj = devices[context.clientId]
    this.logger.debug(`Device ${clientObj.uuid} activated in ${clientObj.status.Status}.`)
    clientObj.activationStatus = true
    MqttProvider.publishEvent('success', ['Activator', 'execute'], `Device activated in ${clientObj.status.Status}`, clientObj.uuid)
  }

  async saveDeviceInfoToSecretProvider (context: ActivationContext, event: ActivationEvent): Promise<boolean> {
    const clientObj = devices[context.clientId]

    const data: DeviceCredentials = {
      AMT_PASSWORD: clientObj.amtPassword,
      MEBX_PASSWORD: clientObj.action === ClientAction.ADMINCTLMODE ? clientObj.mebxPassword : null
    }

    await this.configurator.secretsManager.writeSecretWithObject(`devices/${clientObj.uuid}`, data)
    return true
  }

  async saveDeviceInfoToMPS (context: ActivationContext, event: ActivationEvent): Promise<boolean> {
    const { clientId, profile } = context
    const clientObj = devices[clientId]
    /* Register device metadata with MPS */
    try {
      const deviceInfo = {
        fwVersion: clientObj.ClientData.payload.ver,
        fwBuild: clientObj.ClientData.payload.build,
        fwSku: clientObj.ClientData.payload.sku,
        currentMode: clientObj.ClientData.payload.currentMode?.toString(),
        features: clientObj.ClientData.payload.features,
        ipAddress: clientObj.ClientData.payload.ipConfiguration?.ipAddress,
        lastUpdated: new Date()
      }
      const url = `${Environment.Config.mps_server}/api/v1/devices`
      const jsonData: any = {
        guid: clientObj.uuid,
        hostname: clientObj.hostname,
        mpsusername: clientObj.mpsUsername,
        tags: profile?.tags ?? [],
        tenantId: profile.tenantId,
        dnsSuffix: clientObj.ClientData?.payload.fqdn,
        deviceInfo
      }
      // friendlyName with an empty string indicates clearing the value
      // otherwise, do not include the property so an update of the device
      // preserves existing value
      if (context.friendlyName != null) {
        jsonData.friendlyName = context.friendlyName
      }
      await got.post(url, { json: jsonData })
      return true
    } catch (err) {
      MqttProvider.publishEvent('fail', ['Activator'], 'unable to register metadata with MPS', clientObj.uuid)
      this.logger.error('unable to register metadata with MPS', err)
    }
    return false
  }
}
