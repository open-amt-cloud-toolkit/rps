/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMT, type CIM, type IPS } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine, send } from 'xstate'
import { type HttpHandler } from '../HttpHandler'
import Logger from '../Logger'
import { type AMTConfiguration } from '../models'
import { devices } from '../WebSocketListener'
import { Error } from './error'
import { Configurator } from '../Configurator'
import { DbCreatorFactory } from '../factories/DbCreatorFactory'
import { invokeWsmanCall } from './common'
import { UNEXPECTED_PARSE_ERROR } from '../utils/constants'
import { getCertFromEnterpriseAssistant, initiateCertRequest, sendEnterpriseAssistantKeyPairResponse } from './enterpriseAssistant'

interface WiredConfigContext {
  amtProfile: AMTConfiguration
  ieee8021xProfile: any
  message: any
  clientId: string
  xmlMessage: any
  statusMessage: string
  errorMessage: string
  generalSettings: AMT.Models.GeneralSettings
  wiredSettings: any
  httpHandler: HttpHandler
  amt?: AMT.Messages
  ips?: IPS.Messages
  cim?: CIM.Messages
  retryCount?: number
  eaResponse: any
  addTrustedRootCertResponse: any
  addCertResponse: any
  keyPairHandle?: string
  targetAfterError: string
  wirelessSettings: any
}

interface WiredConfigEvent {
  type: 'WIREDCONFIG' | 'ONFAILED'
  clientId: string
  data?: any
}
export class WiredConfiguration {
  configurator: Configurator
  logger: Logger
  dbFactory: DbCreatorFactory
  db: any
  error: Error = new Error()

  machine =
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
        wirelessSettings: null,
        errorMessage: '',
        targetAfterError: null,
        ieee8021xProfile: null,
        eaResponse: null,
        addTrustedRootCertResponse: null,
        addCertResponse: null
      },
      id: 'wired-network-configuration-machine',
      initial: 'ACTIVATION',
      states: {
        ACTIVATION: {
          on: {
            WIREDCONFIG: {
              actions: [assign({ statusMessage: () => '' }), 'Reset Unauth Count', 'Reset Retry Count'],
              target: 'PUT_ETHERNET_PORT_SETTINGS'
            }
          }
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
              actions: assign({ errorMessage: (context, event) => 'Failed to put to ethernet port settings' }),
              target: 'FAILED'
            }
          }
        },
        CHECK_ETHERNET_PORT_SETTINGS_PUT_RESPONSE: {
          always: [
            {
              cond: 'isNotEthernetSettingsUpdated',
              actions: assign({ errorMessage: (context, event) => 'Failed to put to ethernet port settings' }),
              target: 'FAILED'
            }, {
              cond: 'is8021xProfilesExists',
              target: 'GET_8021X_PROFILE'
            }, {
              target: 'SUCCESS'
            }
          ]
        },
        GET_8021X_PROFILE: {
          invoke: {
            src: this.get8021xProfile.bind(this),
            id: 'get-8021x-profile',
            onDone: {
              actions: assign({ ieee8021xProfile: (context, event) => event.data.Envelope.Body.IPS_IEEE8021xSettings }),
              target: 'ENTERPRISE_ASSISTANT_REQUEST'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to get 8021x wired profile' }),
              target: 'FAILED'
            }
          }
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
              target: 'PUT_8021X_PROFILE'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to add radius server root certificate in 802.1x' }),
              target: 'FAILED'
            }
          }
        },
        PUT_8021X_PROFILE: {
          invoke: {
            src: this.put8021xProfile.bind(this),
            id: 'put-8021x-profile',
            onDone: {
              actions: [assign({ message: (context, event) => event.data }), 'Reset Unauth Count'],
              target: 'SET_CERTIFICATES'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to put 802.1x profile' }),
              target: 'FAILED'
            }
          }
        },
        SET_CERTIFICATES: {
          invoke: {
            src: this.setCertificates.bind(this),
            id: 'set-certificates',
            onDone: {
              actions: [assign({ message: (context, event) => event.data })],
              target: 'SUCCESS'
            },
            onError: {
              actions: assign({ errorMessage: 'Failed to set certificate in 802.1x' }),
              target: 'FAILED'
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
          entry: [assign({ statusMessage: 'Wired Network Configured' }), 'Update Configuration Status'],
          type: 'final'
        }
      }
    }, {
      guards: {
        isNotEthernetSettingsUpdated: (context, event) => {
          const amtEthernetPortSettings: AMT.Models.EthernetPortSettings = context.message.Envelope.Body.AMT_EthernetPortSettings
          if (context.amtProfile.dhcpEnabled === amtEthernetPortSettings.DHCPEnabled && !(context.amtProfile.dhcpEnabled) === amtEthernetPortSettings.SharedStaticIp && amtEthernetPortSettings.IpSyncEnabled) {
            return false
          }
          return true
        },
        is8021xProfilesExists: (context, event) => context.amtProfile.ieee8021xProfileName != null,
        shouldRetry: (context, event) => context.retryCount < 3 && event.data instanceof UNEXPECTED_PARSE_ERROR
      },
      actions: {
        'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 },
        'Reset Retry Count': assign({ retryCount: (context, event) => 0 }),
        'Increment Retry Count': assign({ retryCount: (context, event) => context.retryCount + 1 }),
        'Update Configuration Status': (context, event) => {
          devices[context.clientId].status.Network = context.errorMessage ?? context.statusMessage
        }
      }
    })

  constructor () {
    this.configurator = new Configurator()
    this.dbFactory = new DbCreatorFactory()
    this.logger = new Logger('Network_Configuration_State_Machine')
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
    context.xmlMessage = context.amt.EthernetPortSettings.Put(context.wiredSettings)
    return await invokeWsmanCall(context, 2)
  }

  async get8021xProfile (context: WiredConfigContext, event: WiredConfigEvent): Promise<void> {
    context.xmlMessage = context.ips.IEEE8021xSettings.Get()
    return await invokeWsmanCall(context, 2)
  }

  async put8021xProfile (context: WiredConfigContext, event: WiredConfigEvent): Promise<void> {
    this.logger.info('EA Response :', JSON.stringify(context.eaResponse))
    devices[context.clientId].trustedRootCertificateResponse = context.message.Envelope.Body
    context.addTrustedRootCertResponse = devices[context.clientId].trustedRootCertificateResponse
    context.ieee8021xProfile.Enabled = 2
    context.ieee8021xProfile.AuthenticationProtocol = context.amtProfile.ieee8021xProfileObject.authenticationProtocol
    context.ieee8021xProfile.ElementName = `${context.ieee8021xProfile.ElementName} ${context.amtProfile.ieee8021xProfileName}`
    context.ieee8021xProfile.PxeTimeout = context.amtProfile.ieee8021xProfileObject.pxeTimeout
    context.ieee8021xProfile.Username = context.eaResponse?.username
    context.xmlMessage = context.ips.IEEE8021xSettings.Put(context.ieee8021xProfile)
    return await invokeWsmanCall(context, 2)
  }

  async setCertificates (context: WiredConfigContext, event: WiredConfigEvent): Promise<void> {
    const clientCertReference1 = context.addCertResponse?.AddCertificate_OUTPUT?.CreatedCertificate?.ReferenceParameters?.SelectorSet?.Selector?._
    const rootCertReference1 = context.addTrustedRootCertResponse?.AddTrustedRootCertificate_OUTPUT?.CreatedCertificate?.ReferenceParameters?.SelectorSet?.Selector?._
    const rootCertReference = `<a:Address>default</a:Address><a:ReferenceParameters><w:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyCertificate</w:ResourceURI><w:SelectorSet><w:Selector Name="InstanceID">${rootCertReference1}</w:Selector></w:SelectorSet></a:ReferenceParameters>`
    const clientCertReference = `<a:Address>default</a:Address><a:ReferenceParameters><w:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyCertificate</w:ResourceURI><w:SelectorSet><w:Selector Name="InstanceID">${clientCertReference1}</w:Selector></w:SelectorSet></a:ReferenceParameters>`

    context.xmlMessage = context.ips.IEEE8021xSettings.SetCertificates(rootCertReference, clientCertReference)
    return await invokeWsmanCall(context, 2)
  }

  async generateKeyPair (context: WiredConfigContext, event: WiredConfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicKeyManagementService.GenerateKeyPair({ KeyAlgorithm: 0, KeyLength: 2048 })
    return await invokeWsmanCall(context)
  }

  async enumeratePublicPrivateKeyPair (context: WiredConfigContext, event: WiredConfigEvent): Promise<void> {
    context.keyPairHandle = context.message.Envelope.Body?.GenerateKeyPair_OUTPUT?.KeyPair?.ReferenceParameters?.SelectorSet?.Selector?._
    context.xmlMessage = context.amt.PublicPrivateKeyPair.Enumerate()
    return await invokeWsmanCall(context, 2)
  }

  async pullPublicPrivateKeyPair (context: WiredConfigContext, event: WiredConfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicPrivateKeyPair.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async signCSR (context: WiredConfigContext, event: WiredConfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicKeyManagementService.GeneratePKCS10RequestEx({
      KeyPair: '<a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address><a:ReferenceParameters><w:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicPrivateKeyPair</w:ResourceURI><w:SelectorSet><w:Selector Name="InstanceID">' + (context.message.response.keyInstanceId as string) + '</w:Selector></w:SelectorSet></a:ReferenceParameters>',
      SigningAlgorithm: 1,
      NullSignedCertificateRequest: context.message.response.csr
    })
    return await invokeWsmanCall(context)
  }

  async addCertificate (context: WiredConfigContext, event: WiredConfigEvent): Promise<void> {
    context.eaResponse = event.data.response
    const cert = event.data.response.certificate
    context.xmlMessage = context.amt.PublicKeyManagementService.AddCertificate({ CertificateBlob: cert })
    return await invokeWsmanCall(context)
  }

  async addRadiusServerRootCertificate (context: WiredConfigContext, event: WiredConfigEvent): Promise<void> {
    // To Do: Needs to replace the logic with how we will pull the radius server root certificate
    context.addCertResponse = context.message.Envelope.Body
    devices[context.clientId].trustedRootCertificate = context.eaResponse.rootcert
    const cert = context.eaResponse.rootcert
    context.xmlMessage = context.amt.PublicKeyManagementService.AddTrustedRootCertificate({ CertificateBlob: cert })
    return await invokeWsmanCall(context)
  }
}
