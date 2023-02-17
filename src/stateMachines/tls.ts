/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine, send } from 'xstate'
import { CertManager } from '../certManager'
import { HttpHandler } from '../HttpHandler'
import Logger from '../Logger'
import { type AMTConfiguration, type AMTKeyUsage, type CertAttributes } from '../models'
import { NodeForge } from '../NodeForge'
import { devices } from '../WebSocketListener'
import { type EnterpriseAssistantMessage } from '../WSEnterpriseAssistantListener'
import { invokeEnterpriseAssistantCall, invokeWsmanCall } from './common'
import { Error } from './error'
import { TimeSync } from './timeMachine'
import { TlsSigningAuthority } from '../models/RCS.Config'

export interface TLSContext {
  message: any
  xmlMessage: string
  errorMessage: string
  statusMessage: string
  clientId: string
  httpHandler: HttpHandler
  status: 'success' | 'error' | ''
  tlsSettingData: any[]
  tlsCredentialContext: any
  amtProfile: AMTConfiguration
  unauthCount: number
  amt?: AMT.Messages
}

interface TLSEvent {
  type: 'CONFIGURE_TLS' | 'ONFAILED'
  clientId: string
  data?: any
}/*  */

export class TLS {
  nodeForge: NodeForge
  logger: Logger
  certManager: CertManager
  error: Error = new Error()
  timeSync: TimeSync = new TimeSync()
  machine =
    createMachine<TLSContext, TLSEvent>({
      predictableActionArguments: true,
      preserveActionOrder: true,
      id: 'tls-configuration-machine',
      initial: 'PROVISIONED',
      context: {
        clientId: '',
        unauthCount: 0,
        status: 'success',
        message: null,
        httpHandler: new HttpHandler(),
        xmlMessage: '',
        errorMessage: '',
        statusMessage: '',
        tlsSettingData: null,
        tlsCredentialContext: null,
        amtProfile: null
      },
      states: {
        PROVISIONED: {
          on: {
            CONFIGURE_TLS: {
              target: 'ENUMERATE_PUBLIC_KEY_CERTIFICATE'
            }
          }
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
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to enumerate public key certificates'
              }),
              target: 'FAILED'
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
              target: 'CHECK_CERT_MODE'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to pull public key certificates'
              }),
              target: 'FAILED'
            }
          }
        },
        CHECK_CERT_MODE: {
          always: [{
            cond: 'useTLSEnterpriseAssistantCert',
            target: 'ENTERPRISE_ASSISTANT_REQUEST'
          }, 'ADD_TRUSTED_ROOT_CERTIFICATE']
        },
        CHECK_CERT_MODE_AFTER_REQUEST: {
          always: [{
            cond: 'useTLSEnterpriseAssistantCert',
            target: 'ENTERPRISE_ASSISTANT_RESPONSE'
          }, 'ADD_CERTIFICATE']
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
              actions: assign({
                errorMessage: 'Failed to initiate cert request with enterprise assistant'
              }),
              target: 'FAILED'
            }
          }
        },
        ENTERPRISE_ASSISTANT_RESPONSE: {
          invoke: {
            src: this.sendEnterpriseAssistantKeyPairResponse.bind(this),
            id: 'enterprise-assistant-response',
            onDone: {
              actions: [
                assign({ message: (context, event) => event.data })
              ],
              target: 'SIGN_CSR'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to send key pair to enterprise assistant'
              }),
              target: 'FAILED'
            }
          }
        },
        SIGN_CSR: {
          invoke: {
            src: this.signCSR.bind(this),
            id: 'sign-csr',
            onDone: {
              actions: [
                assign({ message: (context, event) => event.data })
              ],
              target: 'GET_CERT_FROM_ENTERPRISE_ASSISTANT'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to have AMT sign CSR'
              }),
              target: 'FAILED'
            }
          }
        },
        GET_CERT_FROM_ENTERPRISE_ASSISTANT: {
          invoke: {
            src: this.getCertFromEnterpriseAssistant.bind(this),
            id: 'get-cert-from-enterprise-assistant',
            onDone: {
              actions: [
                assign({ message: (context, event) => event.data })
              ],
              target: 'ADD_CERTIFICATE'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to get cert from Microsoft CA'
              }),
              target: 'FAILED'
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
              target: 'GENERATE_KEY_PAIR'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to add trusted root certificates'
              }),
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
                errorMessage: 'Failed to generate key pair'
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
                errorMessage: 'Failed to enumerate public private key pair'
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
              actions: [
                assign({ message: (context, event) => event.data })
              ],
              target: 'PULL_PUBLIC_PRIVATE_KEY_PAIR_RESPONSE'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to pull public private key pair'
              }),
              target: 'FAILED'
            }
          }
        },
        PULL_PUBLIC_PRIVATE_KEY_PAIR_RESPONSE: {
          always: [{
            cond: 'hasPublicPrivateKeyPairs',
            target: 'CHECK_CERT_MODE_AFTER_REQUEST'
          }, 'CREATE_TLS_CREDENTIAL_CONTEXT']
        },
        ADD_CERTIFICATE: {
          invoke: {
            src: this.addCertificate.bind(this),
            id: 'add-certificate',
            onDone: {
              actions: [
                assign({ message: (context, event) => event.data })
              ],
              target: 'CREATE_TLS_CREDENTIAL_CONTEXT'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to add certificate'
              }),
              target: 'FAILED'
            }
          }
        },
        CREATE_TLS_CREDENTIAL_CONTEXT: {
          invoke: {
            src: this.createTLSCredentialContext.bind(this),
            id: 'create-tls-credential-context',
            onDone: {
              actions: [
                assign({ message: (context, event) => event.data })
              ],
              target: 'SYNC_TIME'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to create TLS credential context'
              }),
              target: 'FAILED'
            }
          }
        },
        SYNC_TIME: {
          entry: send({ type: 'TIMETRAVEL' }, { to: 'time-machine' }),
          invoke: {
            src: this.timeSync.machine,
            id: 'time-machine',
            data: {
              clientId: (context, event) => context.clientId,
              httpHandler: (context, event) => context.httpHandler
            },
            onDone: 'ENUMERATE_TLS_DATA'
          },
          on: {
            ONFAILED: 'FAILED'
          }
        },
        ENUMERATE_TLS_DATA: {
          invoke: {
            src: this.enumerateTlsData.bind(this),
            id: 'enumerate-tls-data',
            onDone: {
              actions: [
                assign({ message: (context, event) => event.data })
              ],
              target: 'PULL_TLS_DATA'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to enumerate TLS data'
              }),
              target: 'FAILED'
            }
          }
        },
        PULL_TLS_DATA: {
          invoke: {
            src: this.pullTLSData.bind(this),
            id: 'pull-tls-data',
            onDone: {
              actions: [
                assign({ message: (context, event) => event.data, tlsSettingData: (context, event) => event.data.Envelope.Body.PullResponse.Items.AMT_TLSSettingData })
              ],
              target: 'PUT_REMOTE_TLS_DATA'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to pull TLS data'
              }),
              target: 'FAILED'
            }
          }
        },
        PUT_REMOTE_TLS_DATA: {
          invoke: {
            src: this.putRemoteTLSData.bind(this),
            id: 'put-remote-tls-data',
            onDone: {
              actions: [
                assign({ message: (context, event) => event.data })
              ],
              target: 'WAIT_A_BIT' // should this be commit_changes? and then circle back to setting local tls data
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to update remote TLS data'
              }),
              target: 'FAILED'
            }
          }
        },
        WAIT_A_BIT: {
          after: {
            5000: 'PUT_LOCAL_TLS_DATA'
          }
        },
        PUT_LOCAL_TLS_DATA: {
          invoke: {
            src: this.putLocalTLSData.bind(this),
            id: 'put-local-tls-data',
            onDone: {
              actions: [
                assign({ message: (context, event) => event.data })
              ],
              target: 'COMMIT_CHANGES'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to update local TLS data'
              }),
              target: 'FAILED'
            }
          }
        },
        COMMIT_CHANGES: {
          invoke: {
            src: this.commitChanges.bind(this),
            id: 'commit-changes',
            onDone: {
              actions: [
                assign({ message: (context, event) => event.data })
              ],
              target: 'SUCCESS'
            },
            onError: {
              actions: assign({
                errorMessage: 'Failed to commit changes'
              }),
              target: 'FAILED'
            }
          }
        },
        ERROR: {
          entry: send({ type: 'PARSE' }, { to: 'error-machine' }),
          invoke: {
            src: 'this.error.machine',
            id: 'error-machine',
            data: {
              unauthCount: (context, event) => 0,
              message: (context, event) => event.data,
              clientId: (context, event) => context.clientId
            },
            onDone: 'ENUMERATE_PUBLIC_KEY_CERTIFICATE' // To do: Need to test as it might not require anymore.
          },
          on: {
            ONFAILED: 'FAILED'
          }
        },
        FAILED: {
          entry: [assign({ status: (context, event) => 'error' }), 'Update Configuration Status'],
          type: 'final'
        },
        SUCCESS: {
          entry: [assign({ statusMessage: (context, event) => 'Configured', status: 'success' }), 'Update Configuration Status'],
          type: 'final'
        }
      }
    }, {
      guards: {
        hasPublicPrivateKeyPairs: (context, event) => context.message.Envelope.Body.PullResponse.Items !== '',
        useTLSEnterpriseAssistantCert: (context, event) => context.amtProfile.tlsSigningAuthority === TlsSigningAuthority.MICROSOFT_CA
      },
      actions: {
        'Update Configuration Status': this.updateConfigurationStatus.bind(this)
      }
    })

  async getCertFromEnterpriseAssistant (context: TLSContext, event: TLSEvent): Promise<EnterpriseAssistantMessage> {
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

  async signCSR (context: TLSContext, event: TLSEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicKeyManagementService.GeneratePKCS10RequestEx({
      KeyPair: '<a:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</a:Address><a:ReferenceParameters><w:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicPrivateKeyPair</w:ResourceURI><w:SelectorSet><w:Selector Name="InstanceID">' + (context.message.response.keyInstanceId as string) + '</w:Selector></w:SelectorSet></a:ReferenceParameters>',
      SigningAlgorithm: 1,
      NullSignedCertificateRequest: context.message.response.csr
    })
    return await invokeWsmanCall(context)
  }

  async initiateCertRequest (context: TLSContext, event: TLSEvent): Promise<EnterpriseAssistantMessage> {
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

  async sendEnterpriseAssistantKeyPairResponse (context: TLSContext, event: TLSEvent): Promise<EnterpriseAssistantMessage> {
    const clientObj = devices[context.clientId]
    const potentialArray = context.message.Envelope.Body.PullResponse.Items.AMT_PublicPrivateKeyPair
    if (Array.isArray(potentialArray)) {
      clientObj.tls.PublicPrivateKeyPair = potentialArray
    } else {
      clientObj.tls.PublicPrivateKeyPair = [potentialArray]
    }
    const DERKey = clientObj.tls.PublicPrivateKeyPair[0]?.DERKey

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
      keyInstanceId: 'Intel(r) AMT Key: Handle: 0', // todo: don't hardcode this, pull it from the response
      ver: ''
    }
    return await invokeEnterpriseAssistantCall(context)
  }

  constructor () {
    this.nodeForge = new NodeForge()
    this.certManager = new CertManager(new Logger('CertManager'), this.nodeForge)
  }

  async addCertificate (context: TLSContext, event: TLSEvent): Promise<void> {
    const clientObj = devices[context.clientId]

    let cert = ''
    if (context.amtProfile.tlsSigningAuthority === TlsSigningAuthority.SELF_SIGNED || context.amtProfile.tlsSigningAuthority == null) {
      const potentialArray = context.message.Envelope.Body.PullResponse.Items.AMT_PublicPrivateKeyPair
      if (Array.isArray(potentialArray)) {
        clientObj.tls.PublicPrivateKeyPair = potentialArray
      } else {
        clientObj.tls.PublicPrivateKeyPair = [potentialArray]
      }
      const DERKey = clientObj.tls.PublicPrivateKeyPair[0]?.DERKey
      const certAttributes: CertAttributes = { CN: 'AMT', O: 'None', ST: 'None', C: 'None' }
      const issuerAttributes: CertAttributes = { CN: clientObj.uuid ?? 'Untrusted Root Certificate' }

      const keyUsages: AMTKeyUsage = {
        name: 'extKeyUsage',
        '2.16.840.1.113741.1.2.1': false,
        '2.16.840.1.113741.1.2.2': false,
        '2.16.840.1.113741.1.2.3': false,
        serverAuth: true,
        clientAuth: false,
        emailProtection: false,
        codeSigning: false,
        timeStamping: false
      }
      const certResult = this.certManager.amtCertSignWithCAKey(DERKey, null, certAttributes, issuerAttributes, keyUsages)
      cert = certResult.pem.substring(27, certResult.pem.length - 25)
    } else {
      cert = event.data.response.certificate
    }

    context.xmlMessage = context.amt.PublicKeyManagementService.AddCertificate({ CertificateBlob: cert })

    return await invokeWsmanCall(context)
  }

  async generateKeyPair (context: TLSContext, event: TLSEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicKeyManagementService.GenerateKeyPair({ KeyAlgorithm: 0, KeyLength: 2048 })
    return await invokeWsmanCall(context)
  }

  async addTrustedRootCertificate (context: TLSContext, event: TLSEvent): Promise<void> {
    const tlsCerts = devices[context.clientId].ClientData.payload.profile.tlsCerts
    context.xmlMessage = context.amt.PublicKeyManagementService.AddTrustedRootCertificate({ CertificateBlob: tlsCerts.ROOT_CERTIFICATE.certbin })
    return await invokeWsmanCall(context)
  }

  async enumerateTLSCredentialContext (context: TLSContext, event: TLSEvent): Promise<void> {
    context.xmlMessage = context.amt.TLSCredentialContext.Enumerate()
    return await invokeWsmanCall(context)
  }

  async pullTLSCredentialContext (context: TLSContext, event: TLSEvent): Promise<void> {
    context.xmlMessage = context.amt.TLSCredentialContext.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async createTLSCredentialContext (context: TLSContext, event: TLSEvent): Promise<void> {
    // TODO: 802.1x shoudl be set here right?

    const certHandle = event.data.Envelope.Body?.AddCertificate_OUTPUT?.CreatedCertificate?.ReferenceParameters?.SelectorSet?.Selector?._ ?? 'Intel(r) AMT Certificate: Handle: 1'
    context.xmlMessage = context.amt.TLSCredentialContext.Create(certHandle)
    return await invokeWsmanCall(context)
  }

  async enumeratePublicKeyCertificate (context: TLSContext, event: TLSEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicKeyCertificate.Enumerate()
    return await invokeWsmanCall(context)
  }

  async pullPublicKeyCertificate (context: TLSContext, event: TLSEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicKeyCertificate.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async enumeratePublicPrivateKeyPair (context: TLSContext, event: TLSEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicPrivateKeyPair.Enumerate()
    return await invokeWsmanCall(context)
  }

  async pullPublicPrivateKeyPair (context: TLSContext, event: TLSEvent): Promise<void> {
    context.xmlMessage = context.amt.PublicPrivateKeyPair.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  updateConfigurationStatus (context: TLSContext): void {
    if (context.status === 'success') {
      devices[context.clientId].status.TLSConfiguration = context.statusMessage
    } else if (context.status === 'error') {
      devices[context.clientId].status.TLSConfiguration = context.errorMessage !== '' ? context.errorMessage : 'Failed'
    }
  }

  async enumerateTlsData (context: TLSContext, event: TLSEvent): Promise<void> {
    context.xmlMessage = context.amt.TLSSettingData.Enumerate()
    return await invokeWsmanCall(context)
  }

  async pullTLSData (context: TLSContext, event: TLSEvent): Promise<void> {
    context.xmlMessage = context.amt.TLSSettingData.Pull(context.message.Envelope.Body?.EnumerateResponse?.EnumerationContext)
    return await invokeWsmanCall(context)
  }

  async putRemoteTLSData (context: TLSContext, event: TLSEvent): Promise<void> {
    // Set remote TLS data on AMT
    context.tlsSettingData[0].Enabled = true
    context.tlsSettingData[0].AcceptNonSecureConnections = (context.amtProfile.tlsMode !== 1 && context.amtProfile.tlsMode !== 3) // TODO: check what these values should explicitly be
    context.tlsSettingData[0].MutualAuthentication = (context.amtProfile.tlsMode === 3 || context.amtProfile.tlsMode === 4)

    context.xmlMessage = context.amt.TLSSettingData.Put(context.tlsSettingData[0])
    return await invokeWsmanCall(context)
  }

  async putLocalTLSData (context: TLSContext, event: TLSEvent): Promise<void> {
    context.tlsSettingData[1].Enabled = true

    // if (Array.isArray(context.tlsSettingData[1].TrustedCN) && context.tlsSettingData[1].TrustedCN.length > 0) {
    //   context.tlsSettingData[1].TrustedCN.push(commonName)
    // } else {
    //   context.tlsSettingData[1].TrustedCN = [commonName]
    // }
    // }
    context.xmlMessage = context.amt.TLSSettingData.Put(context.tlsSettingData[1])
    return await invokeWsmanCall(context)
  }

  async commitChanges (context: TLSContext, event: TLSEvent): Promise<void> {
    context.xmlMessage = context.amt.SetupAndConfigurationService.CommitChanges()
    return await invokeWsmanCall(context)
  }
}
