import { AMT, CIM, IPS } from '@open-amt-cloud-toolkit/wsman-messages'
import { Activation, ActivationContext } from './activation'
import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'
import { EnvReader } from '../utils/EnvReader'
import { config } from '../test/helper/Config'
import { NodeForge } from '../NodeForge'
import { CertManager } from '../certManager'
import Logger from '../Logger'
import { PasswordHelper } from '../utils/PasswordHelper'
import { ClientAction } from '../models/RCS.Config'
import { Configurator } from '../Configurator'
import { HttpHandler } from '../HttpHandler'
import ClientResponseMsg from '../utils/ClientResponseMsg'
import { interpret } from 'xstate'
import { AMTUserName } from '../utils/constants'
import * as common from './common'

const clientId = uuid()
EnvReader.GlobalEnvConfig = config
describe('Activation State Machine', () => {
  let activation: Activation
  let context: ActivationContext
  let invokeWsmanCallSpy: jest.SpyInstance
  let hostBasedSetupServiceSpy: jest.SpyInstance
  let responseMessageSpy: jest.SpyInstance
  let sendSpy: jest.SpyInstance
  let signStringSpy: jest.SpyInstance
  let getPasswordSpy: jest.SpyInstance
  let config
  let currentStateIndex: number
  const configurator = new Configurator()
  const cert = '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'
  jest.setTimeout(15000)
  beforeEach(() => {
    activation = new Activation()
    devices[clientId] = {
      unauthCount: 0,
      ClientId: clientId,
      ClientSocket: { send: jest.fn() } as any,
      ClientData: {
        method: 'activation',
        apiKey: 'key',
        appVersion: '1.2.0',
        protocolVersion: '4.0.0',
        status: 'ok',
        message: "all's good!",
        payload: {
          ver: '11.8.50',
          build: '3425',
          fqdn: 'vprodemo.com',
          password: 'KQGnH+N5qJ8YLqjEFJMnGSgcnFLMv0Tk',
          hostname: 'DESKTOP-9CC12U7',
          currentMode: 0,
          certHashes: [
            'e7685634efacf69ace939a6b255b7b4fabef42935b50a265acb5cb6027e44e70',
            'eb04cf5eb1f39afa762f2bb120f296cba520c1b97db1589565b81cb9a17b7244'
          ],
          sku: '16392',
          uuid: '4bac9510-04a6-4321-bae2-d45ddf07b684',
          username: '$$OsAdmin',
          client: 'PPC',
          profile: 'profile1',
          digestRealm: 'Digest:A3829B3827DE4D33D4449B366831FD01',
          action: ClientAction.ADMINCTLMODE
        }
      },
      ciraconfig: {},
      network: {},
      status: {},
      activationStatus: false,
      connectionParams: {
        guid: '4c4c4544-004b-4210-8033-b6c04f504633',
        port: 16992,
        digestChallenge: null,
        username: 'admin',
        password: 'P@ssw0rd'
      },
      uuid: '4c4c4544-004b-4210-8033-b6c04f504633',
      messageId: 1,
      certObj: {} as any
    }
    context = {
      httpHandler: new HttpHandler(),
      profile: {
        profileName: 'acm',
        amtPassword: 'Intel123!',
        mebxPassword: 'Intel123!',
        activation: 'acmactivate',
        tags: ['acm'],
        dhcpEnabled: true,
        tenantId: ''
      },
      amtDomain: {
        profileName: 'vpro',
        domainSuffix: 'vprodemo.com',
        provisioningCert: cert,
        provisioningCertStorageFormat: 'raw',
        provisioningCertPassword: 'P@ssw0rd',
        tenantId: ''
      },
      message: '',
      clientId: clientId,
      xmlMessage: '',
      status: 'success',
      errorMessage: '',
      targetAfterError: '',
      amt: new AMT.Messages(),
      ips: new IPS.Messages(),
      cim: new CIM.Messages(),
      certChainPfx: null
    }

    invokeWsmanCallSpy = jest.spyOn(common, 'invokeWsmanCall').mockResolvedValue()
    getPasswordSpy = jest.spyOn(activation, 'getPassword').mockResolvedValue('abcdef')
    hostBasedSetupServiceSpy = jest.spyOn(context.ips, 'HostBasedSetupService').mockReturnValue('abcdef')
    responseMessageSpy = jest.spyOn(ClientResponseMsg, 'get').mockReturnValue({} as any)
    sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send').mockReturnValue()
    signStringSpy = jest.spyOn(activation.signatureHelper, 'signString').mockReturnValue('abcdef')
    currentStateIndex = 0
    config = {
      services: {
        'get-amt-profile': Promise.resolve({
          clientId: clientId,
          profile: { profileName: 'ccm', activation: 'ccmactivate', amtPassword: 'Intel123!' }
        }),
        'get-amt-domain': Promise.resolve({
          amtDomain: {
            profileName: 'vpro',
            domainSuffix: 'vprodemo.com',
            provisioningCert: cert,
            provisioningCertStorageFormat: cert,
            provisioningCertPassword: 'P@ssw0rd',
            tenantId: ''
          }
        }),
        'send-generalsettings': Promise.resolve({
          Envelope: {
            Header: {},
            Body: { AMT_GeneralSettings: { DigestRealm: 'Digest:A3829B3827DE4D33D4449B366831FD01' } }
          }
        }),
        'error-machine': async (_, event) =>
          await new Promise((resolve, reject) => {
            setTimeout(() => { resolve({ clientId: event.clientId }) }, 50)
          }),
        'send-hostbasedsetup': Promise.resolve({
          Envelope: {
            Header: {},
            Body: {
              IPS_HostBasedSetupService: {
                AllowedControlModes: [2, 1],
                ConfigurationNonce: 'SkqopmngrtkhdvcteznRbEdgqpc='
              }
            }
          }
        }),
        'send-certificate': Promise.resolve({
          Envelope: {
            Header: {},
            Body: { AddNextCertInChain_OUTPUT: { ReturnValue: 0 } }
          }
        }),
        'send-adminsetup': Promise.resolve({
          Envelope: {
            Header: {},
            Body: { AdminSetup_OUTPUT: { ReturnValue: 0 } }
          }
        }),
        'send-setup': Promise.resolve({
          Envelope: {
            Header: {},
            Body: { Setup_OUTPUT: { ReturnValue: 0 } }
          }
        }),
        'send-to-change-amt-password': Promise.resolve({
          Envelope: {
            Header: {},
            Body: { SetAdminAclEntryEx_OUTPUT: { ReturnValue: 0 } }
          }
        }),
        'save-device-secret-provider': Promise.resolve(true),
        'save-device-to-mps': Promise.resolve(true),
        'unconfiguration-machine': Promise.resolve({ clientId }),
        'network-configuration-machine': Promise.resolve({ clientId }),
        'features-configuration-machine': Promise.resolve({ clientId }),
        'tls-machine': Promise.resolve({ clientId }),
        'cira-machine': Promise.resolve({ clientId }),
        'send-mebx-password': Promise.resolve({ clientId }),
        PROVISIONED: () => {},
        DELAYED_TRANSITION: () => {}
      },
      actions: {
        'Convert WSMan XML response to JSON': () => { },
        'Read General Settings': () => { },
        'Read Host Based Setup Service': () => { },
        'Read Admin Setup Response': () => { },
        'Read Client Setup Response': () => { },
        'Compare Domain Cert Hashes': () => { },
        'Send Message to Device': () => { },
        'Get Provisioning CertObj': () => { }
      },
      guards: {
      }
    }
  })

  describe('Get profiles', () => {
    test('should return AMT Profile', async () => {
      const expectedProfile = {
        profileName: 'profile1',
        activation: ClientAction.ADMINCTLMODE,
        tenantId: '',
        tags: ['acm']
      }
      const getAMTProfileSpy = jest.spyOn(activation.configurator.profileManager, 'getAmtProfile').mockImplementation(async () => {
        return expectedProfile
      })
      const profile = await activation.getAMTProfile(context, null)
      expect(profile).toBe(expectedProfile)
      expect(getAMTProfileSpy).toHaveBeenCalled()
    })
    test('should return AMT Password', async () => {
      getPasswordSpy.mockRestore()
      const getAmtPasswordSpy = jest.spyOn(activation.configurator.profileManager, 'getAmtPassword').mockImplementation(async () => {
        return 'P@ssw0rd'
      })
      const getMebxPasswordSpy = jest.spyOn(activation.configurator.profileManager, 'getMEBxPassword').mockImplementation(async () => {
        return 'P@ssw0rd'
      })
      const profile = await activation.getPassword(context)
      expect(profile).toBeDefined()
      expect(getAmtPasswordSpy).toHaveBeenCalled()
      expect(getMebxPasswordSpy).toHaveBeenCalled()
    })
    test('should return Domain Profile', async () => {
      const expectedProfile = {
        profileName: 'vpro',
        domainSuffix: 'vprodemo.com',
        provisioningCert: cert,
        provisioningCertStorageFormat: 'raw',
        provisioningCertPassword: 'P@ssw0rd',
        tenantId: ''
      }
      const getProvisioningCertSpy = jest.spyOn(activation.configurator.domainCredentialManager, 'getProvisioningCert').mockImplementation(async () => {
        return expectedProfile
      })
      const profile = await activation.getAMTDomainCert(context, null)
      expect(profile).toBe(expectedProfile)
      expect(getProvisioningCertSpy).toHaveBeenCalled()
    })
  })

  describe('createSignedString', () => {
    test('should return valid signed string when certificate is valid', async () => {
      const clientObj = devices[clientId]
      clientObj.ClientData.payload.fwNonce = PasswordHelper.generateNonce()
      clientObj.nonce = PasswordHelper.generateNonce()
      const nodeForge = new NodeForge()
      const certManager = new CertManager(new Logger('CertManager'), nodeForge)

      // convert the certificate pfx to an object
      const pfxobj = certManager.convertPfxToObject(cert, 'Intel123!')
      clientObj.certObj.privateKey = pfxobj.keys[0]
      const result = await activation.createSignedString(clientId)
      expect(result).toBeTruthy()
      expect(clientObj.signature).toBeDefined()
      expect(clientObj.signature).not.toBe('')
    })

    test('should throw error message when certificate is invalid', async () => {
      signStringSpy = jest.spyOn(activation.signatureHelper, 'signString').mockImplementation(() => {
        throw new Error('Unable to create Digital Signature')
      })
      const clientObj = devices[clientId]
      clientObj.signature = undefined
      clientObj.ClientData.payload.fwNonce = PasswordHelper.generateNonce()
      const result = await activation.createSignedString(clientId)
      expect(result).toBeFalsy()
      expect(clientObj.signature).toBeUndefined()
      expect(signStringSpy).toHaveBeenCalled()
    })
  })

  describe('send wsman message from RPS to AMT', () => {
    it('should send WSMan to get amt general settings', async () => {
      context.profile = null
      context.amtDomain = null
      const generalSettingsSpy = jest.spyOn(context.amt, 'GeneralSettings').mockImplementation().mockReturnValue('abcdef')
      await activation.getGeneralSettings(context)
      expect(generalSettingsSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send WSMan to get host based setup service', async () => {
      context.profile = null
      context.amtDomain = null
      const hostBasedSetupServiceSpy = jest.spyOn(context.ips, 'HostBasedSetupService').mockImplementation().mockReturnValue('abcdef')
      await activation.getHostBasedSetupService(context)
      expect(hostBasedSetupServiceSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send WSMan to add certificate from domain certificate chain', async () => {
      const context = { profile: null, amtDomain: null, message: '', clientId: clientId, xmlMessage: '', response: '', status: 'wsman', errorMessage: '' }
      const injectCertificateSpy = jest.spyOn(activation, 'injectCertificate').mockImplementation().mockReturnValue('abcdef')
      await activation.getNextCERTInChain(context)
      expect(injectCertificateSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send WSMan to set up admin mode', async () => {
      const createSignedStringSpy = jest.spyOn(activation, 'createSignedString').mockImplementation(
        (clientId: string): boolean => {
          devices[clientId].signature = 'abcdefgh'
          return true
        }
      )
      devices[clientId].nonce = PasswordHelper.generateNonce()
      await activation.getAdminSetup(context)
      expect(getPasswordSpy).toHaveBeenCalled()
      expect(createSignedStringSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send WSMan to change AMT password', async () => {
      await activation.changeAMTPassword(context)
      expect(getPasswordSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send WSMan to set up client mode', async () => {
      await activation.getClientSetup(context)
      expect(getPasswordSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send WSMan to set MEBx password', async () => {
      await activation.setMEBxPassword(context)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
  })

  describe('Get Provisioning Certificate Object', () => {
    test('should assign null if unable to convert pfx to object', async () => {
      const convertPfxToObjectSpy = jest.spyOn(activation.certManager, 'convertPfxToObject').mockImplementation(() => {
        throw new Error('Decrypting provisioning certificate failed.')
      })
      await activation.GetProvisioningCertObj(context, null)
      expect(devices[clientId].certObj).toBeNull()
      expect(convertPfxToObjectSpy).toHaveBeenCalled()
    })
    test('should assign return valid certificate object', async () => {
      const certObject = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: 'eb04cf5eb1f39afa762f2bb120f296cba520c1b97db1589565b81cb9a17b7244' }
      const convertPfxToObjectSpy = jest.spyOn(activation.certManager, 'convertPfxToObject').mockImplementation(() => {
        return { certs: null, keys: null }
      })
      const dumpPfxSpy = jest.spyOn(activation.certManager, 'dumpPfx').mockImplementation(() => {
        return certObject
      })
      await activation.GetProvisioningCertObj(context, null)
      expect(convertPfxToObjectSpy).toHaveBeenCalled()
      expect(dumpPfxSpy).toHaveBeenCalled()
      expect(context.certChainPfx).toBe(certObject)
    })
    test('should return valid provisioning certificate', async () => {
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: 'eb04cf5eb1f39afa762f2bb120f296cba520c1b97db1589565b81cb9a17b7244' }
      activation.compareCertHashes(context, null)
      expect(devices[clientId].certObj).toBe(context.certChainPfx.provisioningCertificateObj)
    })
  })

  describe('save Device Information to MPS database', () => {
    test(`should return true if saved for ${ClientAction.ADMINCTLMODE}`, async () => {
      const response = await activation.saveDeviceInfoToMPS(context, null)
      expect(response).toBe(false)
    })
  })

  describe('save Device Information to vault', () => {
    test(`should return true if saved for ${ClientAction.ADMINCTLMODE}`, async () => {
      const insertSpy = jest.spyOn(configurator.amtDeviceRepository, 'insert').mockImplementation(async () => true)
      const response = await activation.saveDeviceInfoToSecretProvider(context, null)
      expect(insertSpy).toHaveBeenCalled()
      expect(response).toBe(true)
    })
    test(`should return true if saved for ${ClientAction.CLIENTCTLMODE}`, async () => {
      const insertSpy = jest.spyOn(configurator.amtDeviceRepository, 'insert').mockImplementation(async () => true)
      const clientObj = devices[clientId]
      clientObj.action = ClientAction.ADMINCTLMODE
      const response = await activation.saveDeviceInfoToSecretProvider(context, null)
      expect(insertSpy).toHaveBeenCalled()
      expect(response).toBe(true)
    })
    test('should return false if not able to save data', async () => {
      activation.configurator = null
      const response = await activation.saveDeviceInfoToSecretProvider(context, null)
      expect(response).toBe(false)
    })
  })

  describe('inject Certificate', () => {
    test('should return wsman message when certchain is not null', async () => {
      const clientObj = devices[clientId]
      clientObj.count = 1
      clientObj.certObj = {} as any
      clientObj.certObj.certChain = ['leaf', 'inter1', 'root']
      const response = await activation.injectCertificate(clientId, context.ips)
      expect(response).toBeDefined()
      expect(clientObj.count).toBe(2)
      expect(hostBasedSetupServiceSpy).toHaveBeenCalled()
    })
    test('should return wsman message when certchain is not null and cert chain length is less than count', async () => {
      const clientObj = devices[clientId]
      clientObj.count = 2
      clientObj.certObj = {} as any
      clientObj.certObj.certChain = ['leaf', 'inter1', 'root']
      const response = await activation.injectCertificate(clientId, context.ips)
      expect(response).toBeDefined()
      expect(clientObj.count).toBe(3)
      expect(hostBasedSetupServiceSpy).toHaveBeenCalled()
    })
    test('should return wsman message when certchain is not null and cert chain length is equal to count', async () => {
      const clientObj = devices[clientId]
      clientObj.count = 3
      clientObj.certObj = {} as any
      clientObj.certObj.certChain = ['leaf', 'inter1', 'root']
      const response = await activation.injectCertificate(clientId, context.ips)
      expect(response).toBeDefined()
      expect(clientObj.count).toBe(4)
      expect(clientObj.certObj.certChain.length).toBeLessThan(clientObj.count)
      expect(hostBasedSetupServiceSpy).toHaveBeenCalled()
    })
  })

  describe('read response', () => {
    test('should read amt general settings', () => {
      context.message = {
        Envelope: {
          Header: {},
          Body: {
            AMT_GeneralSettings: {
              DigestRealm: 'Digest:A3829B3827DE4D33D4449B366831FD01'
            }
          }
        },
        statusCode: 200
      }
      activation.readGeneralSettings(context, null)
      expect(devices[clientId].ClientData.payload.digestRealm).toBe('Digest:A3829B3827DE4D33D4449B366831FD01')
      expect(devices[clientId].hostname).toBe('DESKTOP-9CC12U7')
    })
    test('should read ips host based set up', async () => {
      context.message = {
        Envelope: {
          Header: {},
          Body: {
            IPS_HostBasedSetupService: {
              AllowedControlModes: [2, 1],
              ConfigurationNonce: 'SkqopmngrtkhdvcteznRbEdgqpc='
            }
          }
        }
      }
      activation.readHostBasedSetupService(context, null)
      expect(devices[clientId].ClientData.payload.fwNonce).toBeDefined()
      expect(devices[clientId].ClientData.payload.modes).toBeDefined()
    })

    test('should set activation status', () => {
      devices[context.clientId].status.Status = 'Admin control mode.'
      activation.setActivationStatus(context, null)
      expect(devices[clientId].activationStatus).toBeTruthy()
    })
  })

  describe('test state machine', () => {
    it('should eventually reach "PROVISIONED" for ccm activation TLS', (done) => {
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'GET_GENERAL_SETTINGS',
        'SETUP',
        'DELAYED_TRANSITION',
        'SAVE_DEVICE_TO_SECRET_PROVIDER',
        'SAVE_DEVICE_TO_MPS',
        'UNCONFIGURATION',
        'NETWORK_CONFIGURATION',
        'FEATURES_CONFIGURATION',
        'TLS',
        'PROVISIONED'
      ]
      const ccmActivationService = interpret(mockActivationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('PROVISIONED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      ccmActivationService.start()
      ccmActivationService.send({ type: 'ACTIVATION', clientId: clientId })
    })

    it('should eventually reach "PROVISIONED" in Admin mode', (done) => {
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: 'eb04cf5eb1f39afa762f2bb120f296cba520c1b97db1589565b81cb9a17b7244' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj

      config.guards = {
        isAdminMode: () => true,
        maxCertLength: () => false
      }
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'GET_AMT_DOMAIN_CERT',
        'GET_GENERAL_SETTINGS',
        'IPS_HOST_BASED_SETUP_SERVICE',
        'ADD_NEXT_CERT_IN_CHAIN',
        'ADMIN_SETUP',
        'DELAYED_TRANSITION',
        'SET_MEBX_PASSWORD',
        'SAVE_DEVICE_TO_SECRET_PROVIDER',
        'SAVE_DEVICE_TO_MPS',
        'UNCONFIGURATION',
        'NETWORK_CONFIGURATION',
        'FEATURES_CONFIGURATION',
        'TLS',
        'PROVISIONED'
      ]
      const acmActivationService = interpret(mockActivationMachine).onTransition((state) => {
        console.log(state.value)
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('PROVISIONED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId: clientId })
    })

    it('should eventually reach "PROVISIONED" in Admin mode with CIRA profile', (done) => {
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: 'eb04cf5eb1f39afa762f2bb120f296cba520c1b97db1589565b81cb9a17b7244' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj
      config.guards = {
        isAdminMode: () => true,
        maxCertLength: () => false,
        hasCIRAProfile: () => true
      }
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'GET_AMT_DOMAIN_CERT',
        'GET_GENERAL_SETTINGS',
        'IPS_HOST_BASED_SETUP_SERVICE',
        'ADD_NEXT_CERT_IN_CHAIN',
        'ADMIN_SETUP',
        'DELAYED_TRANSITION',
        'SET_MEBX_PASSWORD',
        'SAVE_DEVICE_TO_SECRET_PROVIDER',
        'SAVE_DEVICE_TO_MPS',
        'UNCONFIGURATION',
        'NETWORK_CONFIGURATION',
        'FEATURES_CONFIGURATION',
        'CIRA',
        'PROVISIONED'
      ]
      const acmActivationService = interpret(mockActivationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('PROVISIONED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId: clientId })
    })

    it('should eventually reach "FAILED" at "GET_AMT_PROFILE"', (done) => {
      config.guards = {
        isAdminMode: () => true,
        maxCertLength: () => false
      }
      config.services['get-amt-profile'] = Promise.reject(new Error())
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'FAILED'
      ]
      const acmActivationService = interpret(mockActivationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId: clientId })
    })

    it('should eventually reach "FAILED" at "GET_AMT_DOMAIN_CERT"', (done) => {
      config.guards = {
        isAdminMode: () => true,
        maxCertLength: () => false
      }
      config.services['get-amt-domain'] = Promise.reject(new Error())
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'GET_AMT_DOMAIN_CERT',
        'FAILED'
      ]
      const acmActivationService = interpret(mockActivationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId: clientId })
    })

    it('should eventually reach "FAILED" at "CHECKCERTCHAINRESPONSE"', (done) => {
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: 'eb04cf5eb1f39afa762f2bb120f296cba520c1b97db1589565b81cb9a17b7244' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj
      config.guards = {
        isAdminMode: () => true,
        maxCertLength: () => false,
        isCertNotAdded: () => true
      }
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'GET_AMT_DOMAIN_CERT',
        'GET_GENERAL_SETTINGS',
        'IPS_HOST_BASED_SETUP_SERVICE',
        'ADD_NEXT_CERT_IN_CHAIN',
        'FAILED'
      ]
      const acmActivationService = interpret(mockActivationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId: clientId })
    })

    it('should send success message to device', () => {
      activation.sendMessageToDevice(context, null)
      expect(sendSpy).toHaveBeenCalled()
    })
    it('should update Credentials', () => {
      activation.updateCredentials(context, null)
      expect(devices[context.clientId].connectionParams.username).toBe(AMTUserName)
    })

    it('should send error message to device', () => {
      context.status = 'error'
      context.message = null
      activation.sendMessageToDevice(context, null)
      expect(responseMessageSpy).toHaveBeenCalledWith(context.clientId, context.message, context.status, 'failed', JSON.stringify(devices[clientId].status))
      expect(sendSpy).toHaveBeenCalled()
    })
  })
})
