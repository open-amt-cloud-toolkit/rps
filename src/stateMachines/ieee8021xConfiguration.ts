/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type IPS, type AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine, send } from 'xstate'
import { type HttpHandler } from '../HttpHandler'
import Logger from '../Logger'
import { type AMTConfiguration } from '../models'
import { devices } from '../WebSocketListener'
import { Error } from './error'
import { Configurator } from '../Configurator'
import { DbCreatorFactory } from '../factories/DbCreatorFactory'
import { invokeEnterpriseAssistantCall, invokeWsmanCall } from './common'
import { UNEXPECTED_PARSE_ERROR } from '../utils/constants'
import { type EnterpriseAssistantMessage } from '../WSEnterpriseAssistantListener'

export interface IEEE8021xConfigContext {
  amtProfile: AMTConfiguration
  ieee8021xProfile: any
  message: any
  clientId: string
  xmlMessage: any
  statusMessage: string
  httpHandler: HttpHandler
  targetAfterError: string
  errorMessage: string
  retryCount?: number
  ips?: IPS.Messages
  amt?: AMT.Messages
  eaResponse: any
  addTrustedRootCertResponse: any
  addCertResponse: any
  keyPairHandle?: string
}

interface IEEE8021xConfigEvent {
  type: 'CONFIGURE_8021X' | 'ONFAILED'
  clientId: string
  data?: any
}
export class IEEE8021xConfiguration {
  configurator: Configurator
  logger: Logger
  dbFactory: DbCreatorFactory
  db: any
  error: Error = new Error()

  machine =
    createMachine<IEEE8021xConfigContext, IEEE8021xConfigEvent>({
      preserveActionOrder: true,
      predictableActionArguments: true,
      context: {
        httpHandler: null,
        amtProfile: null,
        message: null,
        clientId: '',
        xmlMessage: null,
        statusMessage: '',
        errorMessage: '',
        targetAfterError: null,
        ieee8021xProfile: null,
        eaResponse: null,
        addTrustedRootCertResponse: null,
        addCertResponse: null
      },
      id: 'IEEE8021x-configuration-machine',
      initial: 'ACTIVATION',
      states: {
        ACTIVATION: {
          on: {
            CONFIGURE_8021X: {
              actions: ['Reset Unauth Count', 'Reset Retry Count'],
              target: 'CHECK_8021X_PROFILE'
            }
          }
        },
        CHECK_8021X_PROFILE: {
          always: [
            {
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
              actions: [assign({ message: (context, event) => event.data }), 'Reset Unauth Count'],
              target: 'ENTERPRISE_ASSISTANT_REQUEST'
            },
            onError: {
              actions: assign({ message: (context, event) => event.data, targetAfterError: (context, event) => 'GET_8021X_PROFILE' }),
              target: 'FAILED'
            }
          }
        },
        ENTERPRISE_ASSISTANT_REQUEST: {
          invoke: {
            src: this.initiateCertRequest.bind(this),
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
              actions: [
                assign({ message: (context, event) => event.data })
              ],
              target: 'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to generate key pair in 802.1x'
              }),
              target: 'FAILED'
            }
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
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to enumerate public private key pair in 802.1x'
              }),
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
            src: this.sendEnterpriseAssistantKeyPairResponse.bind(this),
            id: 'enterprise-assistant-response',
            onDone: {
              actions: [assign({ message: (context, event) => event.data })],
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
              actions: [assign({ message: (context, event) => event.data })],
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
            src: this.getCertFromEnterpriseAssistant.bind(this),
            id: 'get-cert-from-enterprise-assistant',
            onDone: {
              actions: [assign({ message: (context, event) => event.data })],
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
              actions: [
                assign({ message: (context, event) => event.data })
              ],
              target: 'ADD_RADIUS_SERVER_ROOT_CERTIFICATE'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to add certificate in 802.1x'
              }),
              target: 'FAILED'
            }
          }
        },
        ADD_RADIUS_SERVER_ROOT_CERTIFICATE: {
          invoke: {
            src: this.addRadiusServerRootCertificate.bind(this),
            id: 'add-radius-server-root-certificate',
            onDone: {
              actions: [
                assign({ message: (context, event) => event.data })
              ],
              target: 'PUT_8021X_PROFILE'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to add radius server root certificate in 802.1x'
              }),
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
            },
            onDone: 'GET_8021X_PROFILE'
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
          type: 'final'
        }
      }
    }, {
      guards: {
        is8021xProfilesExists: (context, event) => context.amtProfile.ieee8021xProfileName != null,
        shouldRetry: (context, event) => context.retryCount < 3 && event.data === UNEXPECTED_PARSE_ERROR
      },
      actions: {
        'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 },
        'Update Configuration Status': (context, event) => {
          const status = devices[context.clientId].status.Network
          devices[context.clientId].status.Network = status == null ? context.statusMessage : `${status}. ${context.errorMessage}`
        },
        'Reset Retry Count': assign({ retryCount: (context, event) => 0 }),
        'Increment Retry Count': assign({ retryCount: (context, event) => context.retryCount + 1 })
      }
    })

  constructor () {
    this.configurator = new Configurator()
    this.dbFactory = new DbCreatorFactory()
    this.logger = new Logger('8021x_Configuration_State_Machine')
  }

  async get8021xProfile (context: IEEE8021xConfigContext, event: IEEE8021xConfigEvent): Promise<void> {
    context.xmlMessage = context.ips.IEEE8021xSettings.Get()
    return await invokeWsmanCall(context, 2)
  }

  async put8021xProfile (context: IEEE8021xConfigContext, event: IEEE8021xConfigEvent): Promise<void> {
    this.logger.info('EA Response :', JSON.stringify(context.eaResponse))
    context.addTrustedRootCertResponse = context.message.Envelope.Body
    context.ieee8021xProfile.Enabled = 2
    context.ieee8021xProfile.AuthenticationProtocol = context.amtProfile.ieee8021xProfileObject.authenticationProtocol
    context.ieee8021xProfile.ElementName = `${context.ieee8021xProfile.ElementName} ${context.amtProfile.ieee8021xProfileName}`
    context.ieee8021xProfile.PxeTimeout = context.amtProfile.ieee8021xProfileObject.pxeTimeout
    context.ieee8021xProfile.Username = context.eaResponse?.username
    context.xmlMessage = context.ips.IEEE8021xSettings.Put(context.ieee8021xProfile)
    return await invokeWsmanCall(context, 2)
  }

  async setCertificates (context: IEEE8021xConfigContext, event: IEEE8021xConfigEvent): Promise<void> {
    const clientCertReference1 = context.addCertResponse?.AddCertificate_OUTPUT?.CreatedCertificate?.ReferenceParameters?.SelectorSet?.Selector?._
    const rootCertReference1 = context.addTrustedRootCertResponse?.AddTrustedRootCertificate_OUTPUT?.CreatedCertificate?.ReferenceParameters?.SelectorSet?.Selector?._
    const rootCertReference = `<a:Address>default</a:Address><a:ReferenceParameters><w:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyCertificate</w:ResourceURI><w:SelectorSet><w:Selector Name="InstanceID">${rootCertReference1}</w:Selector></w:SelectorSet></a:ReferenceParameters>`
    const clientCertReference = `<a:Address>default</a:Address><a:ReferenceParameters><w:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyCertificate</w:ResourceURI><w:SelectorSet><w:Selector Name="InstanceID">${clientCertReference1}</w:Selector></w:SelectorSet></a:ReferenceParameters>`

    context.xmlMessage = context.ips.IEEE8021xSettings.SetCertificates(rootCertReference, clientCertReference)
    return await invokeWsmanCall(context, 2)
  }

  async initiateCertRequest (context: IEEE8021xConfigContext, event: IEEE8021xConfigEvent): Promise<EnterpriseAssistantMessage> {
    context.ieee8021xProfile = context.message.Envelope.Body.IPS_IEEE8021xSettings
    context.message = {
      action: 'satellite',
      subaction: '802.1x-ProFile-Request',
      satelliteFlags: 2,
      nodeid: context.clientId,
      domain: '',
      reqid: '',
      authProtocol: 0,
      osname: 'win11',
      devname: devices[context.clientId].hostname,
      icon: 1,
      cert: null,
      certid: null,
      ver: ''
    }
    return await invokeEnterpriseAssistantCall(context)
  }

  async generateKeyPair (context: IEEE8021xConfigContext, event: IEEE8021xConfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicKeyManagementService.GenerateKeyPair({ KeyAlgorithm: 0, KeyLength: 2048 })
    return await invokeWsmanCall(context)
  }

  async enumeratePublicPrivateKeyPair (context: IEEE8021xConfigContext, event: IEEE8021xConfigEvent): Promise<void> {
    context.keyPairHandle = context.message.Envelope.Body?.GenerateKeyPair_OUTPUT?.KeyPair?.ReferenceParameters?.SelectorSet?.Selector?._
    context.xmlMessage = context.amt.PublicPrivateKeyPair.Enumerate()
    return await invokeWsmanCall(context, 2)
  }

  async pullPublicPrivateKeyPair (context: IEEE8021xConfigContext, event: IEEE8021xConfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicPrivateKeyPair.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async getCertFromEnterpriseAssistant (context: IEEE8021xConfigContext, event: IEEE8021xConfigEvent): Promise<EnterpriseAssistantMessage> {
    const signedCSR = context.message.Envelope?.Body?.GeneratePKCS10RequestEx_OUTPUT?.SignedCertificateRequest
    context.message = {
      action: 'satellite',
      subaction: '802.1x-CSR-Response',
      satelliteFlags: 2,
      nodeid: context.clientId,
      domain: '',
      reqid: '',
      authProtocol: 0,
      osname: 'win11',
      devname: devices[context.clientId].hostname,
      icon: 1,
      signedcsr: signedCSR,
      ver: ''
    }
    return await invokeEnterpriseAssistantCall(context)
  }

  async signCSR (context: IEEE8021xConfigContext, event: IEEE8021xConfigEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicKeyManagementService.GeneratePKCS10RequestEx({
      KeyPair: '<a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address><a:ReferenceParameters><w:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicPrivateKeyPair</w:ResourceURI><w:SelectorSet><w:Selector Name="InstanceID">' + (context.message.response.keyInstanceId as string) + '</w:Selector></w:SelectorSet></a:ReferenceParameters>',
      SigningAlgorithm: 1,
      NullSignedCertificateRequest: context.message.response.csr
    })
    return await invokeWsmanCall(context)
  }

  async sendEnterpriseAssistantKeyPairResponse (context: IEEE8021xConfigContext, event: IEEE8021xConfigEvent): Promise<EnterpriseAssistantMessage> {
    const clientObj = devices[context.clientId]
    const potentialArray = context.message.Envelope.Body.PullResponse.Items.AMT_PublicPrivateKeyPair
    if (Array.isArray(potentialArray)) {
      clientObj.tls.PublicPrivateKeyPair = potentialArray
    } else {
      clientObj.tls.PublicPrivateKeyPair = [potentialArray]
    }
    const PublicPrivateKeyPair = clientObj.tls.PublicPrivateKeyPair.filter(x => x.InstanceID === context.keyPairHandle)[0]
    const DERKey = PublicPrivateKeyPair?.DERKey

    context.message = {
      action: 'satellite',
      subaction: '802.1x-KeyPair-Response',
      satelliteFlags: 2,
      nodeid: context.clientId,
      domain: '',
      reqid: '',
      devname: devices[context.clientId].hostname,
      authProtocol: 0,
      osname: 'win11',
      icon: 1,
      DERKey,
      keyInstanceId: PublicPrivateKeyPair?.InstanceID,
      ver: ''
    }
    return await invokeEnterpriseAssistantCall(context)
  }

  async addCertificate (context: IEEE8021xConfigContext, event: IEEE8021xConfigEvent): Promise<void> {
    context.eaResponse = event.data.response
    const cert = event.data.response.certificate
    context.xmlMessage = context.amt.PublicKeyManagementService.AddCertificate({ CertificateBlob: cert })
    return await invokeWsmanCall(context)
  }

  async addRadiusServerRootCertificate (context: IEEE8021xConfigContext, event: IEEE8021xConfigEvent): Promise<void> {
    // To Do: Needs to replace the logic with how we will pull the radius server root certificate
    context.addCertResponse = context.message.Envelope.Body
    const cert = context.eaResponse.rootcert
    context.xmlMessage = context.amt.PublicKeyManagementService.AddTrustedRootCertificate({ CertificateBlob: cert })
    return await invokeWsmanCall(context)
  }
}
