import { AMT, IPS } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine, interpret } from 'xstate'
import { ClientAction } from '../models/RCS.Config'
import { HttpHandler } from '../HttpHandler'
import Logger from '../Logger'
import { AMTConfiguration, AMTDeviceDTO, AMTDomain } from '../models'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { EnvReader } from '../utils/EnvReader'
import { MqttProvider } from '../utils/MqttProvider'
import { parseBody } from '../utils/parseWSManResponseBody'
import { devices } from '../WebSocketListener'
import got from 'got/dist/source'
import { CertManager } from '../CertManager'
import { PasswordHelper } from '../utils/PasswordHelper'
import { SignatureHelper } from '../utils/SignatureHelper'
import { send } from 'xstate/lib/actions'
import { Error } from './error'
import { NetworkConfiguration } from './networkConfiguration'
import { NodeForge } from '../NodeForge'
import { Configurator } from '../Configurator'
import { Validator } from '../Validator'
import { HttpZResponseModel } from 'http-z'
import { DbCreatorFactory } from '../repositories/factories/DbCreatorFactory'
import { AMTUserName } from '../utils/constants'

interface ActivationContext {
  profile: AMTConfiguration
  amtDomain: AMTDomain
  message: HttpZResponseModel
  clientId: string
  xmlMessage: string
  response: any
  status: 'success' | 'error'
  errorMessage: string
  generalSettings?: AMT.Models.GeneralSettings
}

interface ActivationEvent {
  type: 'ACTIVATION' | 'ONFAILED'
  clientId: string
  data?: any
}
export class Activation {
  nodeForge: NodeForge
  certManager: CertManager
  signatureHelper: SignatureHelper
  configurator: Configurator
  responseMsg: ClientResponseMsg
  httpHandler: HttpHandler
  validator: Validator
  amt: AMT.Messages
  ips: IPS.Messages
  logger: Logger
  dbFactory: DbCreatorFactory
  db: any
  error: Error = new Error()
  networkConfiguration: NetworkConfiguration = new NetworkConfiguration()
  provisioned_state = 'PROVISIONED'

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
      response: '',
      status: 'success',
      errorMessage: '',
      generalSettings: null
    },
    id: 'activation-machine',
    initial: 'UNPROVISIONED',
    states: {
      UNPROVISIONED: {
        on: {
          ACTIVATION: {
            actions: assign({ clientId: (context, event) => event.clientId }),
            target: 'GET_AMT_PROFILE'
          }
        }
      },
      GET_AMT_PROFILE: {
        invoke: {
          src: this.getAMTProfile.bind(this),
          id: 'get-amt-profile',
          onDone: [
            {
              actions: assign({
                profile: (context, event) => event.data
              }),
              target: 'CHECK_PROFILE_TYPE'
            }
          ],
          onError: {
            actions: assign({ errorMessage: 'Failed to get amt profile from database' }),
            target: 'FAILED'
          }
        }
      },
      CHECK_PROFILE_TYPE: {
        always: [
          {
            cond: 'isAdminMode',
            target: 'GET_AMT_DOMAIN_CERT'
          }, {
            target: 'GET_GENERAL_SETTINGS'
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
            target: 'GET_GENERAL_SETTINGS'
          },
          {
            actions: assign({ errorMessage: 'Failed to extract domain certificate' }),
            target: 'FAILED'
          }
        ]
      },
      GET_GENERAL_SETTINGS: {
        invoke: {
          src: this.getGeneralSettings.bind(this),
          id: 'send-generalsettings',
          onDone: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'READ_GENERAL_SETTINGS'
          },
          onError: {
            actions: assign({
              message: (context, event) => event.data
            }),
            target: 'ERROR'
          }
        }
      },
      READ_GENERAL_SETTINGS: {
        entry: ['Convert WSMan XML response to JSON', 'Read General Settings'],
        always: {
          target: 'CHECK_DIGEST_REALM'
        }
      },
      CHECK_DIGEST_REALM: {
        always: [
          {
            cond: 'isDigestRealmInvalid',
            target: 'INVALID_DIGEST_REALM'
          },
          {
            cond: 'isAdminMode',
            target: 'IPS_HOST_BASED_SETUP_SERVICE'
          },
          {
            target: 'SETUP'
          }
        ]
      },
      IPS_HOST_BASED_SETUP_SERVICE: {
        invoke: {
          src: this.getHostBasedSetupService.bind(this),
          id: 'send-hostbasedsetup',
          onDone: [
            {
              actions: [
                assign({ message: (context, event) => event.data }),
                'Convert WSMan XML response to JSON',
                'Read Host Based Setup Service'
              ],
              target: 'ADDNEXTCERTINCHAIN'
            }
          ],
          onError: [
            {
              target: 'ERROR'
            }
          ]
        }
      },
      ADDNEXTCERTINCHAIN: {
        invoke: {
          src: this.getNextCERTInChain.bind(this),
          id: 'send-certificate',
          onDone: [
            {
              actions: [
                assign({ message: (context, event) => event.data }),
                'Convert WSMan XML response to JSON'
              ],
              target: 'CHECKCERTCHAINRESPONSE'
            }
          ],
          onError: 'ERROR'
        }
      },
      CHECKCERTCHAINRESPONSE: {
        always: [
          {
            cond: 'isCertNotAdded',
            actions: assign({ errorMessage: (context, event) => `Device ${devices[context.clientId].uuid} activation failed. Error while adding the certificates to AMT.` }),
            target: 'FAILED'
          },
          {
            cond: 'maxCertLength',
            target: 'ADDNEXTCERTINCHAIN'
          },
          {
            target: 'ADMINSETUP'
          }
        ]
      },
      ADMINSETUP: {
        invoke: {
          src: this.getAdminSetup.bind(this),
          id: 'send-adminsetup',
          onDone: [
            {
              actions: [
                assign({ message: (context, event) => event.data }),
                'Convert WSMan XML response to JSON'
              ],
              target: 'CHECK_ADMINSETUP'
            }
          ],
          onError: 'ERROR'
        }
      },
      CHECK_ADMINSETUP: {
        always: [
          {
            cond: 'isDeviceAdminModeActivated',
            actions: [
              (context, event) => { devices[context.clientId].status.Status = 'Admin control mode.' },
              'Set activation status'
            ],
            target: 'SAVE_DEVICE_TO_VAULT'
          },
          {
            actions: assign({ errorMessage: 'Failed to activate in admin control mode.' }),
            target: 'FAILED'
          }
        ]
      },
      SETUP: {
        invoke: {
          src: this.getClientSetup.bind(this),
          id: 'send-setup',
          onDone: [
            {
              actions: [
                assign({ message: (context, event) => event.data }),
                'Convert WSMan XML response to JSON'
              ],
              target: 'CHECK_SETUP'
            }
          ],
          onError: 'ERROR'
        }
      },
      CHECK_SETUP: {
        always: [
          {
            cond: 'isDeviceClientModeActivated',
            actions: [
              (context, event) => { devices[context.clientId].status.Status = 'Client control mode.' },
              'Set activation status'
            ],
            target: 'SAVE_DEVICE_TO_VAULT'
          },
          {
            actions: assign({ errorMessage: 'Failed to activate in client control mode.' }),
            target: 'FAILED'
          }
        ]
      },
      SAVE_DEVICE_TO_VAULT: {
        invoke: {
          src: this.saveDeviceInfoToVault.bind(this),
          id: 'save-device-vault',
          onDone: 'SAVE_DEVICE_TO_MPS',
          onError: 'SAVE_DEVICE_TO_VAULT_FAILURE'
        }
      },
      SAVE_DEVICE_TO_MPS: {
        invoke: {
          src: this.saveDeviceInfoToMPS.bind(this),
          id: 'save-device-mps',
          onDone: 'DELAYED_TRANSITION',
          onError: 'SAVE_DEVICE_TO_MPS_FAILURE'
        }
      },
      SAVE_DEVICE_TO_VAULT_FAILURE: {
        entry: assign({ errorMessage: 'Failed to save device information to Vault' }),
        always: 'FAILED'
      },
      SAVE_DEVICE_TO_MPS_FAILURE: {
        entry: assign({ errorMessage: 'Failed to save device information to MPS' }),
        always: 'FAILED'
      },
      DELAYED_TRANSITION: {
        after: {
          10000: { target: 'UPDATE_CREDENTIALS' }
        }
      },
      NETWORKCONFIGURATION: {
        entry: send({ type: 'NETWORKCONFIGURATION' }, { to: 'network-configuration-machine' }),
        invoke: {
          src: this.networkConfiguration.machine,
          id: 'network-configuration-machine',
          data: {
            amtProfile: (context, event) => context.profile,
            generalSettings: (context, event) => context.generalSettings,
            clientId: (context, event) => context.clientId
          },
          onDone: 'PROVISIONED'
        },
        on: {
          ONFAILED: 'FAILED'
        }
      },
      ERROR: {
        entry: send({ type: 'PARSE' }, { to: 'error-machine' }),
        invoke: {
          src: this.error.machine,
          id: 'error-machine',
          data: {
            message: (context, event) => event.data,
            clientId: (context, event) => context.clientId
          },
          onDone: 'GET_GENERAL_SETTINGS'
        },
        on: {
          ONFAILED: 'FAILED'
        }
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
      },
      PROVISIONED: {
        entry: [
          assign({ status: (context, event) => 'success' }),
          'Send Message to Device'
        ],
        type: 'final'
      }
    }
  }, {
    guards: {
      isAdminMode: (context, event) => context.profile.activation === ClientAction.ADMINCTLMODE,
      isCertExtracted: (context, event) => devices[context.clientId].certObj != null,
      isDigestRealmInvalid: (context, event) => !this.validator.isDigestRealmValid(devices[context.clientId].ClientData.payload.digestRealm),
      maxCertLength: (context, event) => devices[context.clientId].count <= devices[context.clientId].certObj.certChain.length,
      isDeviceAdminModeActivated: (context, event) => context.response.Envelope.Body.AdminSetup_OUTPUT.ReturnValue === 0,
      isDeviceClientModeActivated: (context, event) => context.response.Envelope.Body.Setup_OUTPUT.ReturnValue === 0,
      isCertNotAdded: (context, event) => context.response.Envelope.Body.AddNextCertInChain_OUTPUT.ReturnValue !== 0
    },
    actions: {
      'Convert WSMan XML response to JSON': this.convertToJson.bind(this),
      'Read General Settings': this.readGeneralSettings.bind(this),
      'Read Host Based Setup Service': this.readHostBasedSetupService.bind(this),
      'Set activation status': this.setActivationStatus.bind(this),
      'Send Message to Device': this.sendMessageToDevice.bind(this),
      'Get Provisioning CertObj': this.GetProvisioningCertObj.bind(this),
      'Update AMT Credentials': this.updateCredentials.bind(this)
    }
  })

  service = interpret(this.machine).onTransition((state) => {
    console.log(`Current state of Activation Machine: ${JSON.stringify(state.value)}`)
  }).onChange((data) => {
    console.log('ONCHANGE:')
    console.log(data)
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
    this.responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
    this.httpHandler = new HttpHandler()
    this.validator = new Validator(new Logger('Validator'), this.configurator)
    this.amt = new AMT.Messages()
    this.ips = new IPS.Messages()
    this.dbFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
    this.logger = new Logger('Activation_State_Machine')
  }

  updateCredentials (context: ActivationContext, event: ActivationEvent): void {
    devices[context.clientId].connectionParams.username = AMTUserName
    devices[context.clientId].connectionParams.password = devices[context.clientId].amtPassword
  }

  async getAMTProfile (context: ActivationContext, event: ActivationEvent): Promise<AMTConfiguration> {
    this.db = await this.dbFactory.getDb()
    const profile = await this.configurator.profileManager.getAmtProfile(devices[context.clientId].ClientData.payload.profile.profileName)
    return await Promise.resolve(profile)
  }

  async getAMTDomainCert (context: ActivationContext, event: ActivationEvent): Promise<AMTDomain> {
    const domain = await this.configurator.domainCredentialManager.getProvisioningCert(devices[context.clientId].ClientData.payload.fqdn)
    return await Promise.resolve(domain)
  }

  sendMessageToDevice (context, event): void {
    const { clientId, status } = context
    const clientObj = devices[clientId]
    let method = null
    if (status === 'success') {
      method = 'success'
    } else if (status === 'error') {
      clientObj.status.Status = context.errorMessage !== '' ? context.errorMessage : 'Failed'
      method = 'failed'
    }
    const responseMessage = this.responseMsg.get(clientId, null, status, method, JSON.stringify(clientObj.status))
    this.logger.info(JSON.stringify(responseMessage, null, '\t'))
    devices[clientId].ClientSocket.send(JSON.stringify(responseMessage))
  }

  createSignedString (clientId: string): boolean {
    const clientObj = devices[clientId]
    clientObj.nonce = PasswordHelper.generateNonce()
    const arr: Buffer[] = [clientObj.ClientData.payload.fwNonce, clientObj.nonce]
    try {
      clientObj.signature = this.signatureHelper.signString(Buffer.concat(arr), clientObj.certObj.privateKey)
      return true
    } catch (err) {
      MqttProvider.publishEvent('fail', ['Activator'], 'Failed to activate', clientObj.uuid)
      return false
    }
  }

  async getGeneralSettings (context): Promise<any> {
    context.xmlMessage = this.amt.GeneralSettings(AMT.Methods.GET)
    return await this.invokeWsmanCall(context)
  }

  async getHostBasedSetupService (context): Promise<any> {
    context.xmlMessage = this.ips.HostBasedSetupService(IPS.Methods.GET)
    return await this.invokeWsmanCall(context)
  }

  async getNextCERTInChain (context): Promise<any> {
    context.xmlMessage = await this.injectCertificate(context.clientId)
    return await this.invokeWsmanCall(context)
  }

  async getPassword (clientId: string): Promise<string> {
    const clientObj = devices[clientId]
    const amtPassword: string = await this.configurator.profileManager.getAmtPassword(clientObj.ClientData.payload.profile.profileName)
    clientObj.amtPassword = amtPassword
    const data: string = `admin:${clientObj.ClientData.payload.digestRealm}:${amtPassword}`
    const password = SignatureHelper.createMd5Hash(data)
    return password
  }

  async getAdminSetup (context): Promise<any> {
    const { clientId } = context
    const password = await this.getPassword(clientId)
    this.createSignedString(clientId)
    const clientObj = devices[clientId]
    context.xmlMessage = this.ips.HostBasedSetupService(IPS.Methods.ADMIN_SETUP, 2, password, clientObj.nonce.toString('base64'), 2, clientObj.signature)
    return await this.invokeWsmanCall(context)
  }

  async getClientSetup (context): Promise<any> {
    const { clientId } = context
    const password = await this.getPassword(clientId)
    context.xmlMessage = this.ips.HostBasedSetupService(IPS.Methods.SETUP, 2, password)
    return await this.invokeWsmanCall(context)
  }

  async invokeWsmanCall (context): Promise<any> {
    let { message, clientId, xmlMessage } = context
    const clientObj = devices[clientId]
    message = this.httpHandler.wrapIt(xmlMessage, clientObj.connectionParams)
    const responseMessage = this.responseMsg.get(clientId, message, 'wsman', 'ok')
    devices[clientId].ClientSocket.send(JSON.stringify(responseMessage))
    clientObj.pendingPromise = new Promise<any>((resolve, reject) => {
      clientObj.resolve = resolve
      clientObj.reject = reject
    })
    return await clientObj.pendingPromise
  }

  injectCertificate (clientId: string): string {
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
      xmlRequestBody = this.ips.HostBasedSetupService(IPS.Methods.ADD_NEXT_CERT_IN_CHAIN, null, null, null, null, null, clientObj.certObj.certChain[clientObj.count - 1], isLeaf, isRoot)
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
      const certChainPfx = this.certManager.dumpPfx(pfxobj)
      // check that provisioning certificate root matches one of the trusted roots from AMT
      for (const hash in devices[clientId].ClientData.payload.certHashes) {
        if (devices[clientId].ClientData.payload.certHashes[hash]?.toLowerCase() === certChainPfx.fingerprint?.toLowerCase()) {
          devices[clientId].certObj = certChainPfx.provisioningCertificateObj
        }
      }
    } catch (error) {
      this.logger.error(`Device ${devices[clientId].uuid} Failed to get provisioning certificate.`)
      devices[clientId].certObj = null
    }
  }

  convertToJson (context: ActivationContext, event: ActivationEvent): void {
    const xmlBody = parseBody(context.message)
    // parse WSMan xml response to json
    context.response = this.httpHandler.parseXML(xmlBody)
  }

  readGeneralSettings (context: ActivationContext, event: ActivationEvent): void {
    const clientObj = devices[context.clientId]
    context.generalSettings = context.response.Envelope.Body.AMT_GeneralSettings
    clientObj.ClientData.payload.digestRealm = context.generalSettings.DigestRealm
    clientObj.hostname = clientObj.ClientData.payload.hostname
  }

  readHostBasedSetupService (context: ActivationContext, event: ActivationEvent): void {
    const resBody = context.response.Envelope.Body
    const clientObj = devices[context.clientId]
    clientObj.ClientData.payload.fwNonce = Buffer.from(resBody.IPS_HostBasedSetupService.ConfigurationNonce, 'base64')
    clientObj.ClientData.payload.modes = resBody.IPS_HostBasedSetupService.AllowedControlModes
  }

  setActivationStatus (context: ActivationContext, event: ActivationEvent): void {
    const clientObj = devices[context.clientId]
    this.logger.debug(`Device ${clientObj.uuid} activated in ${clientObj.status.Status}.`)
    clientObj.activationStatus.activated = true
    MqttProvider.publishEvent('success', ['Activator', 'execute'], `Device activated in ${clientObj.status.Status}`, clientObj.uuid)
  }

  async saveDeviceInfoToVault (context: ActivationContext, event: ActivationEvent): Promise<boolean> {
    const clientObj = devices[context.clientId]
    if (this.configurator?.amtDeviceRepository) {
      const amtDevice: AMTDeviceDTO = {
        guid: clientObj.uuid,
        name: clientObj.hostname,
        mpsuser: clientObj.mpsUsername,
        mpspass: clientObj.mpsPassword,
        amtuser: EnvReader.GlobalEnvConfig.amtusername,
        amtpass: clientObj.amtPassword,
        mebxpass: clientObj.action === ClientAction.ADMINCTLMODE ? clientObj.mebxPassword : null
      }
      await this.configurator.amtDeviceRepository.insert(amtDevice)
      return true
    } else {
      MqttProvider.publishEvent('fail', ['Activator'], 'Unable to write device', clientObj.uuid)
      this.logger.error('unable to write device')
    }
    return false
  }

  async saveDeviceInfoToMPS (context: ActivationContext, event: ActivationEvent): Promise<boolean> {
    const { clientId, profile } = context
    const clientObj = devices[clientId]
    /* Register device metadata with MPS */
    try {
      let tags = []
      if (profile?.tags != null) {
        tags = profile.tags
      }
      await got(`${EnvReader.GlobalEnvConfig.mpsServer}/api/v1/devices`, {
        method: 'POST',
        json: {
          guid: clientObj.uuid,
          hostname: clientObj.hostname,
          mpsusername: clientObj.mpsUsername,
          tags: tags,
          tenantId: profile.tenantId
        }
      })
      return true
    } catch (err) {
      MqttProvider.publishEvent('fail', ['Activator'], 'unable to register metadata with MPS', clientObj.uuid)
      this.logger.error('unable to register metadata with MPS', err)
    }
    return false
  }
}
