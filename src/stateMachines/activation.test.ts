/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMT, CIM, IPS } from '@open-amt-cloud-toolkit/wsman-messages'
import { Activation, type ActivationContext } from './activation'
import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'
import { Environment } from '../utils/Environment'
import { config } from '../test/helper/Config'
import { NodeForge } from '../NodeForge'
import { CertManager } from '../certManager'
import Logger from '../Logger'
import { PasswordHelper } from '../utils/PasswordHelper'
import { ClientAction } from '../models/RCS.Config'
import { HttpHandler } from '../HttpHandler'
import ClientResponseMsg from '../utils/ClientResponseMsg'
import { interpret } from 'xstate'
import { AMTUserName, GATEWAY_TIMEOUT_ERROR } from '../utils/constants'
import * as common from './common'
import { Configurator } from '../Configurator'
import got from 'got'

jest.mock('got')
const clientId = uuid()
Environment.Config = config
describe('Activation State Machine', () => {
  let activation: Activation
  let context: ActivationContext
  let invokeWsmanCallSpy: jest.SpyInstance
  let responseMessageSpy: jest.SpyInstance
  let sendSpy: jest.SpyInstance
  let signStringSpy: jest.SpyInstance
  let getPasswordSpy: jest.SpyInstance
  let config
  const configurator = new Configurator()
  let currentStateIndex: number
  const cert = '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'

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
            'eb04cf5eb1f39afa762f2bb120f296cba520c1b97db1589565b81cb9a17b7244',
            '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c'
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
      tenantId: '',
      canActivate: true,
      message: '',
      clientId,
      xmlMessage: '',
      status: 'success',
      errorMessage: '',
      targetAfterError: '',
      amt: new AMT.Messages(),
      ips: new IPS.Messages(),
      cim: new CIM.Messages(),
      certChainPfx: null,
      friendlyName: null
    }

    invokeWsmanCallSpy = jest.spyOn(common, 'invokeWsmanCall').mockResolvedValue(null)
    getPasswordSpy = jest.spyOn(activation, 'getPassword').mockResolvedValue('abcdef')
    responseMessageSpy = jest.spyOn(ClientResponseMsg, 'get').mockReturnValue({} as any)
    sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send').mockReturnValue()
    signStringSpy = jest.spyOn(activation.signatureHelper, 'signString').mockReturnValue('abcdef')
    currentStateIndex = 0
    config = {
      services: {
        'get-amt-profile': Promise.resolve({
          clientId,
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
        'get-activationstatus': Promise.resolve({ clientId }),
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
    it('should return AMT Profile', async () => {
      const expectedProfile = {
        profileName: 'profile1',
        activation: ClientAction.ADMINCTLMODE,
        tenantId: '',
        tags: ['acm']
      }
      const getAMTProfileSpy = jest.spyOn(activation.configurator.profileManager, 'getAmtProfile').mockImplementation(async () => expectedProfile)
      const profile = await activation.getAMTProfile(context, null)
      expect(profile).toBe(expectedProfile)
      expect(getAMTProfileSpy).toHaveBeenCalled()
    })
    it('should return AMT Password', async () => {
      getPasswordSpy.mockRestore()
      const getAmtPasswordSpy = jest.spyOn(activation.configurator.profileManager, 'getAmtPassword').mockImplementation(async () => 'P@ssw0rd')
      const getMebxPasswordSpy = jest.spyOn(activation.configurator.profileManager, 'getMEBxPassword').mockImplementation(async () => 'P@ssw0rd')
      const profile = await activation.getPassword(context)
      expect(profile).toBeDefined()
      expect(getAmtPasswordSpy).toHaveBeenCalled()
      expect(getMebxPasswordSpy).toHaveBeenCalled()
    })
    it('should return Domain Profile', async () => {
      const expectedProfile = {
        profileName: 'vpro',
        domainSuffix: 'vprodemo.com',
        provisioningCert: cert,
        provisioningCertStorageFormat: 'raw',
        provisioningCertPassword: 'P@ssw0rd',
        tenantId: ''
      }
      const getProvisioningCertSpy = jest.spyOn(activation.configurator.domainCredentialManager, 'getProvisioningCert').mockImplementation(async () => expectedProfile)
      const profile = await activation.getAMTDomainCert(context, null)
      expect(profile).toBe(expectedProfile)
      expect(getProvisioningCertSpy).toHaveBeenCalled()
    })
  })

  describe('createSignedString', () => {
    it('should return valid signed string when certificate is valid', async () => {
      const clientObj = devices[clientId]
      clientObj.ClientData.payload.fwNonce = PasswordHelper.generateNonce()
      clientObj.nonce = PasswordHelper.generateNonce()
      const nodeForge = new NodeForge()
      const certManager = new CertManager(new Logger('CertManager'), nodeForge)

      // convert the certificate pfx to an object
      const pfxobj = certManager.convertPfxToObject(cert, 'P@ssw0rd')
      clientObj.certObj.privateKey = pfxobj.keys[0]
      context.certChainPfx = certManager.dumpPfx(pfxobj)

      const result = activation.createSignedString(clientId, context.certChainPfx.hashAlgorithm)
      expect(result).toBeTruthy()
      expect(clientObj.signature).toBeDefined()
      expect(clientObj.signature).not.toBe('')
    })

    it('should throw error message when certificate is invalid', async () => {
      signStringSpy = jest.spyOn(activation.signatureHelper, 'signString').mockImplementation(() => {
        throw new Error('Unable to create Digital Signature')
      })
      const clientObj = devices[clientId]
      clientObj.signature = undefined
      clientObj.ClientData.payload.fwNonce = PasswordHelper.generateNonce()
      const result = activation.createSignedString(clientId, 'sha1')
      expect(result).toBeFalsy()
      expect(clientObj.signature).toBeUndefined()
      expect(signStringSpy).toHaveBeenCalled()
    })
  })

  describe('send wsman message from RPS to AMT', () => {
    it('should send WSMan to get activation status', async () => {
      context.profile = null
      context.amtDomain = null
      const hostBasedSetupServiceSpy = jest.spyOn(context.ips.HostBasedSetupService, 'Get').mockImplementation().mockReturnValue('abcdef')
      await activation.getActivationStatus(context)
      expect(hostBasedSetupServiceSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send WSMan to get amt general settings', async () => {
      context.profile = null
      context.amtDomain = null
      const generalSettingsSpy = jest.spyOn(context.amt.GeneralSettings, 'Get').mockImplementation().mockReturnValue('abcdef')
      await activation.getGeneralSettings(context)
      expect(generalSettingsSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send WSMan to get host based setup service', async () => {
      context.profile = null
      context.amtDomain = null
      const hostBasedSetupServiceSpy = jest.spyOn(context.ips.HostBasedSetupService, 'Get').mockImplementation().mockReturnValue('abcdef')
      await activation.getHostBasedSetupService(context)
      expect(hostBasedSetupServiceSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send WSMan to add certificate from domain certificate chain', async () => {
      const context = { profile: null, amtDomain: null, message: '', clientId, xmlMessage: '', response: '', status: 'wsman', errorMessage: '' }
      const injectCertificateSpy = jest.spyOn(activation, 'injectCertificate').mockImplementation().mockReturnValue('abcdef')
      await activation.getNextCERTInChain(context)
      expect(injectCertificateSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send WSMan to set up admin mode', async () => {
      const createSignedStringSpy = jest.spyOn(activation, 'createSignedString').mockImplementation(
        (clientId: string, hashAlgorithm: string): boolean => {
          devices[clientId].signature = 'abcdefgh'
          return true
        }
      )
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[clientId].nonce = PasswordHelper.generateNonce()
      await activation.sendAdminSetup(context)
      expect(getPasswordSpy).toHaveBeenCalled()
      expect(createSignedStringSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send WSMan to upgrade from client to admin mode', async () => {
      const createSignedStringSpy = jest.spyOn(activation, 'createSignedString').mockImplementation(
        (clientId: string): boolean => {
          devices[clientId].signature = 'abcdefgh'
          return true
        }
      )
      devices[clientId].nonce = PasswordHelper.generateNonce()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      await activation.sendUpgradeClientToAdmin(context)
      expect(createSignedStringSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send WSMan to change AMT password', async () => {
      await activation.changeAMTPassword(context)
      expect(getPasswordSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send WSMan to set up client mode', async () => {
      await activation.sendClientSetup(context)
      expect(getPasswordSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send WSMan to set MEBx password', async () => {
      devices[context.clientId].mebxPassword = 'password'
      await activation.setMEBxPassword(context)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
  })

  describe('Get Provisioning Certificate Object', () => {
    it('should assign null if unable to convert pfx to object', () => {
      const convertPfxToObjectSpy = jest.spyOn(activation.certManager, 'convertPfxToObject').mockImplementation(() => {
        throw new Error('Decrypting provisioning certificate failed.')
      })
      activation.GetProvisioningCertObj(context, null)
      expect(devices[clientId].certObj).toBeNull()
      expect(convertPfxToObjectSpy).toHaveBeenCalled()
    })
    it('should assign return valid certificate object', () => {
      const certObject = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      const convertPfxToObjectSpy = jest.spyOn(activation.certManager, 'convertPfxToObject').mockImplementation(() => ({ certs: null, keys: null }))
      const dumpPfxSpy = jest.spyOn(activation.certManager, 'dumpPfx').mockImplementation(() => certObject)
      activation.GetProvisioningCertObj(context, null)
      expect(convertPfxToObjectSpy).toHaveBeenCalled()
      expect(dumpPfxSpy).toHaveBeenCalled()
      expect(context.certChainPfx).toBe(certObject)
    })
    it('should return valid provisioning certificate', async () => {
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      activation.compareCertHashes(context, null)
      expect(devices[clientId].certObj).toBe(context.certChainPfx.provisioningCertificateObj)
    })
    it('should return valid provisioning certificate if a sha1 hash matches', async () => {
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[clientId].ClientData.payload.certHashes = ['e7685634efacf69ace939a6b255b7b4fabef42935b50a265acb5cb6027e44e70', '47d7b7db23f3e300189f54802482b1bd18b945ef']
      activation.compareCertHashes(context, null)
      expect(devices[clientId].certObj).toBe(context.certChainPfx.provisioningCertificateObj)
    })
  })

  describe('save Device Information to MPS database', () => {
    it('should return true on successful post to MPS', async () => {
      jest.spyOn(got, 'post').mockResolvedValue({ })
      const response = await activation.saveDeviceInfoToMPS(context, null)
      expect(response).toBe(true)
    })
    it('should handle got exception on non 2XX,3XX response from post to MPS', async () => {
      jest.spyOn(got, 'post').mockRejectedValue(new Error('SomeError'))
      const response = await activation.saveDeviceInfoToMPS(context, null)
      expect(response).toBe(false)
    })
  })

  describe('save Device Information to vault', () => {
    it(`should return true if saved for ${ClientAction.ADMINCTLMODE}`, async () => {
      const insertSpy = jest.spyOn(configurator.secretsManager, 'writeSecretWithObject').mockImplementation(async () => true)
      const response = await activation.saveDeviceInfoToSecretProvider(context, null)
      expect(insertSpy).toHaveBeenCalled()
      expect(response).toBe(true)
    })
    it(`should return true if saved for ${ClientAction.CLIENTCTLMODE}`, async () => {
      const insertSpy = jest.spyOn(configurator.secretsManager, 'writeSecretWithObject').mockImplementation(async () => true)
      const clientObj = devices[clientId]
      clientObj.action = ClientAction.ADMINCTLMODE
      const response = await activation.saveDeviceInfoToSecretProvider(context, null)
      expect(insertSpy).toHaveBeenCalled()
      expect(response).toBe(true)
    })
    it('should return false if not able to save data', async () => {
      const err = new Error('Unable to save')
      jest.spyOn(configurator.secretsManager, 'writeSecretWithObject').mockRejectedValueOnce(err)
      await expect(activation.saveDeviceInfoToSecretProvider(context, null)).rejects.toBe(err)
    })
  })

  describe('inject Certificate', () => {
    it('should return wsman message when certchain is not null', async () => {
      const clientObj = devices[clientId]
      clientObj.count = 1
      clientObj.certObj = {} as any
      clientObj.certObj.certChain = ['leaf', 'inter1', 'root']
      const hostBasedSetupServiceSpy = jest.spyOn(context.ips.HostBasedSetupService, 'AddNextCertInChain').mockReturnValue('abcdef')
      const response = activation.injectCertificate(clientId, context.ips)
      expect(response).toBeDefined()
      expect(clientObj.count).toBe(2)
      expect(hostBasedSetupServiceSpy).toHaveBeenCalled()
    })
    it('should return wsman message when certchain is not null and cert chain length is less than count', async () => {
      const clientObj = devices[clientId]
      clientObj.count = 2
      clientObj.certObj = {} as any
      clientObj.certObj.certChain = ['leaf', 'inter1', 'root']
      const hostBasedSetupServiceSpy = jest.spyOn(context.ips.HostBasedSetupService, 'AddNextCertInChain').mockReturnValue('abcdef')
      const response = activation.injectCertificate(clientId, context.ips)
      expect(response).toBeDefined()
      expect(clientObj.count).toBe(3)
      expect(hostBasedSetupServiceSpy).toHaveBeenCalled()
    })
    it('should return wsman message when certchain is not null and cert chain length is equal to count', async () => {
      const clientObj = devices[clientId]
      clientObj.count = 3
      clientObj.certObj = {} as any
      clientObj.certObj.certChain = ['leaf', 'inter1', 'root']
      const hostBasedSetupServiceSpy = jest.spyOn(context.ips.HostBasedSetupService, 'AddNextCertInChain').mockReturnValue('abcdef')
      const response = activation.injectCertificate(clientId, context.ips)
      expect(response).toBeDefined()
      expect(clientObj.count).toBe(4)
      expect(clientObj.certObj.certChain.length).toBeLessThan(clientObj.count)
      expect(hostBasedSetupServiceSpy).toHaveBeenCalled()
    })
  })

  describe('read response', () => {
    it('should read amt general settings', () => {
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
    it('should read ips host based set up', async () => {
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

    it('should set activation status', () => {
      devices[context.clientId].status.Status = 'Admin control mode.'
      activation.setActivationStatus(context, null)
      expect(devices[clientId].activationStatus).toBeTruthy()
    })
  })

  describe('test state machine', () => {
    afterEach(() => {
      jest.useRealTimers()
    })
    it('should eventually reach "PROVISIONED" for ccm activation TLS', (done) => {
      jest.useFakeTimers()
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
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('PROVISIONED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      ccmActivationService.start()
      ccmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })

    it('should eventually reach "PROVISIONED" in Admin mode', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
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
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('PROVISIONED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })

    it('should eventually reach "PROVISIONED" in Upgrade to Admin mode', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj

      config.guards = {
        isAdminMode: () => true,
        maxCertLength: () => false,
        canUpgrade: () => true,
        isUpgraded: () => true,
        hasCIRAProfile: () => true,
        isDeviceActivatedInCCM: () => true,
        isDeviceActivatedInACM: () => true,
        hasToUpgrade: () => true
      }

      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'GET_AMT_DOMAIN_CERT',
        'GET_GENERAL_SETTINGS',
        'IPS_HOST_BASED_SETUP_SERVICE',
        'ADD_NEXT_CERT_IN_CHAIN',
        'UPGRADE_TO_ADMIN_SETUP',
        'CHANGE_AMT_PASSWORD',
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
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('PROVISIONED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })

    it('should eventually reach "FAILED" from get AMT domain state', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj

      config.guards = {
        isActivated: () => true,
        isAdminMode: () => true,
        maxCertLength: () => false,
        canUpgrade: () => true,
        isUpgraded: () => true
      }

      config.services['get-amt-domain'] = Promise.reject(new Error())
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'CHECK_TENANT_ACCESS',
        'GET_AMT_DOMAIN_CERT',
        'FAILED'
      ]
      const acmActivationService = interpret(mockActivationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })

    it('should eventually reach "FAILED" from get AMT domain state', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj

      config.guards = {
        isActivated: () => true,
        isAdminMode: () => true,
        maxCertLength: () => false,
        canUpgrade: () => false,
        isUpgraded: () => true,
        canActivate: () => true
      }

      config.services['send-generalsettings'] = Promise.reject(new Error())
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'CHECK_TENANT_ACCESS',
        'GET_GENERAL_SETTINGS',
        'ERROR'
      ]
      const acmActivationService = interpret(mockActivationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('ERROR') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })

    it('should eventually reach "ERROR" in Upgrade to Admin mode', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj

      config.guards = {
        isAdminMode: () => true,
        maxCertLength: () => false,
        canUpgrade: () => true,
        isUpgraded: () => true,
        hasCIRAProfile: () => true,
        isDeviceActivatedInCCM: () => true,
        isDeviceActivatedInACM: () => true,
        hasToUpgrade: () => true
      }

      config.services['send-upgrade-to-admin'] = Promise.reject(new Error())
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'GET_AMT_DOMAIN_CERT',
        'GET_GENERAL_SETTINGS',
        'IPS_HOST_BASED_SETUP_SERVICE',
        'ADD_NEXT_CERT_IN_CHAIN',
        'UPGRADE_TO_ADMIN_SETUP',
        'ERROR'
      ]
      const acmActivationService = interpret(mockActivationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('ERROR') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })

    it('should eventually reach "PROVISIONED" in Upgrade to Admin mode if not in ACM', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj

      config.guards = {
        isAdminMode: () => true,
        maxCertLength: () => false,
        canUpgrade: () => true,
        isUpgraded: () => true,
        hasCIRAProfile: () => true,
        isDeviceActivatedInCCM: () => true,
        isDeviceActivatedInACM: () => false,
        hasToUpgrade: () => true
      }

      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'GET_AMT_DOMAIN_CERT',
        'GET_GENERAL_SETTINGS',
        'IPS_HOST_BASED_SETUP_SERVICE',
        'ADD_NEXT_CERT_IN_CHAIN',
        'UPGRADE_TO_ADMIN_SETUP',
        'CHANGE_AMT_PASSWORD',
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
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('PROVISIONED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })

    it('should eventually reach "FAILED" by error in General Setting', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj

      config.guards = {
        isAdminMode: () => true,
        isActivated: () => false
      }

      config.services['send-generalsettings'] = Promise.reject(new Error())
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'GET_AMT_DOMAIN_CERT',
        'GET_GENERAL_SETTINGS',
        'ERROR'
      ]
      const acmActivationService = interpret(mockActivationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('ERROR') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })

    it('should eventually reach "FAILED" if Admin Setup failed', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj

      config.guards = {
        isAdminMode: () => true,
        isCertNotAdded: () => false,
        maxCertLength: () => false,
        canUpgrade: () => false,
        isUpgraded: () => true,
        hasCIRAProfile: () => true,
        isDeviceActivatedInCCM: () => true,
        isDeviceActivatedInACM: () => false,
        isDeviceAdminModeActivated: () => false,
        hasToUpgrade: () => true
      }

      config.services['send-adminsetup'] = Promise.reject(new Error())
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'GET_AMT_DOMAIN_CERT',
        'GET_GENERAL_SETTINGS',
        'IPS_HOST_BASED_SETUP_SERVICE',
        'ADD_NEXT_CERT_IN_CHAIN',
        'ADMIN_SETUP',
        'ERROR'
      ]
      const acmActivationService = interpret(mockActivationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('ERROR') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })

    it('should eventually reach "FAILED" if not in ACM mode', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj

      config.guards = {
        isAdminMode: () => true,
        isCertNotAdded: () => false,
        maxCertLength: () => false,
        canUpgrade: () => false,
        isUpgraded: () => true,
        hasCIRAProfile: () => true,
        isDeviceActivatedInCCM: () => true,
        isDeviceActivatedInACM: () => false,
        isDeviceAdminModeActivated: () => false,
        hasToUpgrade: () => true
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
        'FAILED'
      ]
      const acmActivationService = interpret(mockActivationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })

    it('should eventually reach "PROVISIONED" if device is upgraded to ACM on AMT15 device with hasToUpgrade', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj
      config.guards = {
        isAdminMode: () => true,
        maxCertLength: () => false,
        hasCIRAProfile: () => true,
        isDeviceActivatedInACM: () => true,
        hasToUpgrade: () => true
      }
      config.services['send-adminsetup'] = Promise.reject(new GATEWAY_TIMEOUT_ERROR())
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'GET_AMT_DOMAIN_CERT',
        'GET_GENERAL_SETTINGS',
        'IPS_HOST_BASED_SETUP_SERVICE',
        'ADD_NEXT_CERT_IN_CHAIN',
        'ADMIN_SETUP',
        'CHECK_ACTIVATION_ON_AMT',
        'CHANGE_AMT_PASSWORD',
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
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('PROVISIONED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })
    it('should eventually reach "ERROR" if Check Activation fails', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj
      config.guards = {
        isAdminMode: () => true,
        maxCertLength: () => false,
        hasCIRAProfile: () => true,
        isDeviceActivatedInACM: () => true,
        hasToUpgrade: () => true
      }
      config.services['get-activationstatus'] = Promise.reject(new Error())
      config.services['send-adminsetup'] = Promise.reject(new GATEWAY_TIMEOUT_ERROR())
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'GET_AMT_DOMAIN_CERT',
        'GET_GENERAL_SETTINGS',
        'IPS_HOST_BASED_SETUP_SERVICE',
        'ADD_NEXT_CERT_IN_CHAIN',
        'ADMIN_SETUP',
        'CHECK_ACTIVATION_ON_AMT',
        'ERROR'
      ]
      const acmActivationService = interpret(mockActivationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('ERROR') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })

    it('should eventually reach "PROVISIONED" if device is upgraded to ACM on AMT15 device', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj
      config.guards = {
        isAdminMode: () => true,
        maxCertLength: () => false,
        hasCIRAProfile: () => true,
        isDeviceActivatedInACM: () => true,
        hasToUpgrade: () => false
      }
      config.services['send-adminsetup'] = Promise.reject(new GATEWAY_TIMEOUT_ERROR())
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'GET_AMT_DOMAIN_CERT',
        'GET_GENERAL_SETTINGS',
        'IPS_HOST_BASED_SETUP_SERVICE',
        'ADD_NEXT_CERT_IN_CHAIN',
        'ADMIN_SETUP',
        'CHECK_ACTIVATION_ON_AMT',
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
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('PROVISIONED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })

    it('should eventually reach "PROVISIONED" if device is upgraded to ACM on AMT15 device', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj
      config.guards = {
        isAdminMode: () => true,
        maxCertLength: () => false,
        hasCIRAProfile: () => true,
        isDeviceActivatedInACM: () => true,
        hasToUpgrade: () => false
      }
      config.services['send-adminsetup'] = Promise.reject(new GATEWAY_TIMEOUT_ERROR())
      config.services['send-mebx-password'] = Promise.reject(new Error())
      const mockActivationMachine = activation.machine.withConfig(config).withContext(context)
      const flowStates = [
        'UNPROVISIONED',
        'GET_AMT_PROFILE',
        'GET_AMT_DOMAIN_CERT',
        'GET_GENERAL_SETTINGS',
        'IPS_HOST_BASED_SETUP_SERVICE',
        'ADD_NEXT_CERT_IN_CHAIN',
        'ADMIN_SETUP',
        'CHECK_ACTIVATION_ON_AMT',
        'SET_MEBX_PASSWORD',
        'ERROR'
      ]
      const acmActivationService = interpret(mockActivationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('ERROR') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })

    it('should eventually reach "PROVISIONED" if device is activated in ACM', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
      devices[context.clientId].certObj = context.certChainPfx.provisioningCertificateObj
      config.guards = {
        isAdminMode: () => true,
        maxCertLength: () => false,
        hasCIRAProfile: () => true,
        isDeviceActivatedInACM: () => true
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
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('PROVISIONED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
    })

    it('should eventually reach "PROVISIONED" in Admin mode with CIRA profile', (done) => {
      jest.useFakeTimers()
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
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
        if (state.matches('DELAYED_TRANSITION')) {
          jest.advanceTimersByTime(10000)
        } else if (state.matches('PROVISIONED') && currentStateIndex === flowStates.length) {
          done()
        }
      })

      acmActivationService.start()
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
      jest.runAllTicks()
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
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
    })

    it('should eventually reach "FAILED" at "GET_AMT_PROFILE" if ACTIVATED', (done) => {
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
      acmActivationService.send({ type: 'ACTIVATED', clientId, tenantId: '', friendlyName: null })
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
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
    })

    it('should eventually reach "FAILED" at "CHECKCERTCHAINRESPONSE"', (done) => {
      context.certChainPfx = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: { sha256: '82f2ed575db4abe462499cf550dbff9584980d70a0272894639c3653b9ad932c', sha1: '47d7b7db23f3e300189f54802482b1bd18b945ef' }, hashAlgorithm: 'sha256' }
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
      acmActivationService.send({ type: 'ACTIVATION', clientId, tenantId: '', friendlyName: null })
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
