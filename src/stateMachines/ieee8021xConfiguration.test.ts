/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { IEEE8021xConfiguration, type IEEE8021xConfigContext } from './ieee8021xConfiguration'
import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'
import { Environment } from '../utils/Environment'
import { config } from '../test/helper/Config'
import { HttpHandler } from '../HttpHandler'
import { interpret } from 'xstate'
import * as common from './common'
import { AMT, IPS } from '@open-amt-cloud-toolkit/wsman-messages'
const clientId = uuid()
Environment.Config = config

describe('Configuration State Machine', () => {
  let ieee8021xConfiguration
  let currentStateIndex: number
  let invokeWsmanCallSpy: jest.SpyInstance
  let ieee8021xConfigContext: IEEE8021xConfigContext
  let invokeEnterpriseAssistantCallSpy: jest.SpyInstance
  let configuration
  jest.setTimeout(15000)
  beforeEach(() => {
    ieee8021xConfiguration = new IEEE8021xConfiguration()
    invokeWsmanCallSpy = jest.spyOn(common, 'invokeWsmanCall').mockResolvedValue(null)
    invokeEnterpriseAssistantCallSpy = jest.spyOn(common, 'invokeEnterpriseAssistantCall').mockResolvedValue({} as any)
    ieee8021xConfigContext = {
      clientId,
      httpHandler: new HttpHandler(),
      errorMessage: '',
      xmlMessage: '',
      statusMessage: '',
      amt: new AMT.Messages(),
      ips: new IPS.Messages(),
      amtProfile: {
        profileName: 'acm',
        amtPassword: 'Intel123!',
        mebxPassword: 'Intel123!',
        activation: 'acmactivate',
        tags: ['acm'],
        dhcpEnabled: true,
        ieee8021xProfileName: 'p1',
        tenantId: ''
      },
      eaResponse: { rootcert: 'MIIDhTCCAm2gAwIBAgIQSxKZZpPSAo5ACu3OFx0Y8jANBgkqhkiG9w0BAQsFADBVMRMwEQYKCZImiZPyLGQBGRYDY29tMRgwFgYKCZImiZPyLGQBGRYIdnByb2RlbW8xJDAiBgNVBAMTG3Zwcm9kZW1vLVdJTi1QRVFIRjBSTjQwVi1DQTAeFw0yMzAyMDEyMjU1NTVaFw0yODAyMDEyMzA1NTRaMFUxEzARBgoJkiaJk/IsZAEZFgNjb20xGDAWBgoJkiaJk/IsZAEZFgh2cHJvZGVtbzEkMCIGA1UEAxMbdnByb2RlbW8tV0lOLVBFUUhGMFJONDBWLUNBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAz9eNHbevH3k/TorT4+yWJMBrk8t15Ig+yGFJWsZEgXN8/VfN9naeacPjDYxzWZOvUpWRZZMiZTAvctvUo8vi02qy2qVyHhjA+IYyMYsBEN9QNmWjpsfDvwUyJ2W4Zz3IeTjYF9LhOKvr99Z2CvAXqMKR6CmSvnvLyizJW+RkVASOavXMawWKzyKknLAUVLXP9dbT2T80oJ5irtLhOXfGgwJWVTE13V1YJ3erix0PT+cFyNCqDWR1u5JNfgUcJuzrYisBsngfWLYQilxDy8sMUVPGwV4Pz04N30ri1GGsj2BgvnLl9Q17wow5d54funPvnoa6fM33Uiad3jZoL9ABNQIDAQABo1EwTzALBgNVHQ8EBAMCAYYwDwYDVR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUb8R8CBWHno23fZN+Y3PfS4EzW9IwEAYJKwYBBAGCNxUBBAMCAQAwDQYJKoZIhvcNAQELBQADggEBAGIIZtWeThNBTDEmrZcb6yg9U376ImdGaso637RqDzS3nFgudKrl6/cVUDvS+YKp97bK7ryPn9lLRLI66mSw5TgPUOZ7eXfAw9uuULKAPA8eO0wJsDbVKflmTFIr8THrE0Bdyq4cm9swRzKnNiu/mx2w8b3TITHsBVx+xTO5WkW32GRq4jkqYpL3FMbDUjOJ2fP5yqGVIxpUSrh7k5Bxo5eUoOevRmBMTeDeaw/f0Bs2lf/buc+zLtL15Y3ZzIJugWVF/6BtOiknD7olbI9uATq/LrHoPCOdlrxIXqqB0GDDDvOWcLrRECfUQNkH7IE27vsSs7yosCET/gRtF6UV5MU=', username: 'abc' },
      message: { Envelope: { Body: {} } },
      targetAfterError: null,
      ieee8021xProfile: null,
      addTrustedRootCertResponse: null,
      addCertResponse: null

    }
    devices[clientId] = {
      unauthCount: 0,
      ClientId: clientId,
      ClientSocket: { send: jest.fn() } as any,
      ciraconfig: { TLSSettingData: { Enabled: true, AcceptNonSecureConnections: true, MutualAuthentication: true, TrustedCN: null } },
      network: {},
      status: {},
      tls: {},
      hostname: 'WinDev2211Eval',
      activationStatus: false,
      connectionParams: {
        guid: '4c4c4544-004b-4210-8033-b6c04f504633',
        port: 16992,
        digestChallenge: {},
        username: 'admin',
        password: 'P@ssw0rd'
      },
      uuid: '4c4c4544-004b-4210-8033-b6c04f504633',
      messageId: 1
    }
    currentStateIndex = 0
    configuration = {
      services: {
        'get-8021x-profile': Promise.resolve({ clientId }),
        'enterprise-assistant-request': Promise.resolve({ clientId }),
        'generate-key-pair': Promise.resolve({ clientId }),
        'enumerate-public-private-key-pair': Promise.resolve({ clientId }),
        'pull-public-private-key-pair': Promise.resolve({ clientId }),
        'enterprise-assistant-response': Promise.resolve({ clientId }),
        'sign-csr': Promise.resolve({ clientId }),
        'get-cert-from-enterprise-assistant': Promise.resolve({ clientId }),
        'add-certificate': Promise.resolve({ clientId }),
        'add-radius-server-root-certificate': Promise.resolve({ clientId }),
        'put-8021x-profile': Promise.resolve({ clientId }),
        'set-certificates': Promise.resolve({ clientId }),
        'error-machine': Promise.resolve({ clientId })
      },
      actions: {
        'Reset Unauth Count': () => {}
      },
      guards: {
        is8021xProfilesExists: () => true,
        shouldRetry: () => false
      }
    }
  })

  describe('802.1x profiles', () => {
    it('should send a WSMan call to get 802.1x Profile', async () => {
      await ieee8021xConfiguration.get8021xProfile(ieee8021xConfigContext, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send a WSMan call to put 802.1x Profile', async () => {
      ieee8021xConfigContext.ieee8021xProfile = {
        Enabled: 3,
        AuthenticationProtocol: 0,
        ElementName: '',
        PxeTimeout: 0,
        Username: ''
      }
      ieee8021xConfigContext.amtProfile.ieee8021xProfileObject = { profileName: 'p1', authenticationProtocol: 0, pxeTimeout: 120, tenantId: '', wiredInterface: true }
      await ieee8021xConfiguration.put8021xProfile(ieee8021xConfigContext, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send a WSMan call to setCertificate for 802.1x Profile', async () => {
      await ieee8021xConfiguration.setCertificates(ieee8021xConfigContext, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send a WSMan call to add radius server root cert for 802.1x Profile', async () => {
      await ieee8021xConfiguration.addRadiusServerRootCertificate(ieee8021xConfigContext, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
  })

  describe('certificates', () => {
    it('should generate a key pair', async () => {
      const context = {
        amt: { PublicKeyManagementService: { GenerateKeyPair: jest.fn().mockResolvedValue({}) } },
        xmlMessage: ''
      }
      await ieee8021xConfiguration.generateKeyPair(context)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
      expect(context.amt.PublicKeyManagementService.GenerateKeyPair).toHaveBeenCalledWith({ KeyAlgorithm: 0, KeyLength: 2048 })
    })
    it('should send a message to get enumerate public private key pairs', async () => {
      const mockContext = {
        amt: { PublicPrivateKeyPair: { Enumerate: jest.fn().mockResolvedValue({}) } },
        message: { Envelope: { Body: { GenerateKeyPair_OUTPUT: { EnumeKeyPairratorContext: { ReferenceParameters: { SelectorSet: { Selector: { _: 'xyz' } } } } } } } },
        xmlMessage: ''
      }
      await ieee8021xConfiguration.enumeratePublicPrivateKeyPair(mockContext)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send a message to pull public private key pairs', async () => {
      const mockContext = {
        amt: { PublicPrivateKeyPair: { Pull: jest.fn().mockResolvedValue({}) } },
        message: { Envelope: { Body: { EnumeratorResponse: { EnumeratorContext: 'abc' } } } },
        xmlMessage: ''
      }
      await ieee8021xConfiguration.pullPublicPrivateKeyPair(mockContext)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send a message to sign CSR', async () => {
      const mockContext = {
        amt: { PublicKeyManagementService: { GeneratePKCS10RequestEx: jest.fn().mockResolvedValue({}) } },
        message: { response: { csr: 'abc' } }
      }
      await ieee8021xConfiguration.signCSR(mockContext)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
  })

  describe('Enterprise Assistant', () => {
    it('should sendEnterpriseAssistantKeyPairResponse', async () => {
      ieee8021xConfigContext.keyPairHandle = 'Intel(r) AMT Key: Handle: 0'
      ieee8021xConfigContext.message = {
        Envelope: {
          Body: {
            PullResponse: {
              Items: {
                AMT_PublicPrivateKeyPair: [
                  {
                    InstanceID: 'Intel(r) AMT Key: Handle: 0',
                    DERKey: 'DERKey'
                  }
                ]
              }
            }
          }
        }
      }
      const expectedMessage = {
        action: 'satellite',
        subaction: '802.1x-KeyPair-Response',
        satelliteFlags: 2,
        nodeid: ieee8021xConfigContext.clientId,
        domain: '',
        reqid: '',
        devname: 'WinDev2211Eval',
        authProtocol: 0,
        osname: 'win11',
        icon: 1,
        DERKey: 'DERKey',
        keyInstanceId: 'Intel(r) AMT Key: Handle: 0',
        ver: ''
      }
      await ieee8021xConfiguration.sendEnterpriseAssistantKeyPairResponse(ieee8021xConfigContext, null)
      expect(ieee8021xConfigContext.message).toEqual(expectedMessage)
      expect(invokeEnterpriseAssistantCallSpy).toHaveBeenCalled()
      expect(devices[ieee8021xConfigContext.clientId].tls.PublicPrivateKeyPair).toEqual([
        {
          InstanceID: 'Intel(r) AMT Key: Handle: 0',
          DERKey: 'DERKey'
        }
      ])
    })
    it('should getCertFromEnterpriseAssistant', async () => {
      ieee8021xConfigContext.message = {
        Envelope: {
          Body: {
            GeneratePKCS10RequestEx_OUTPUT: {
              SignedCertificateRequest: 'certificate'
            }
          }
        }
      }
      await ieee8021xConfiguration.getCertFromEnterpriseAssistant(ieee8021xConfigContext, null)
      expect(ieee8021xConfigContext.message).toEqual({
        action: 'satellite',
        subaction: '802.1x-CSR-Response',
        satelliteFlags: 2,
        nodeid: ieee8021xConfigContext.clientId,
        domain: '',
        reqid: '',
        authProtocol: 0,
        osname: 'win11',
        devname: 'WinDev2211Eval',
        icon: 1,
        signedcsr: 'certificate',
        ver: ''
      })
      expect(invokeEnterpriseAssistantCallSpy).toHaveBeenCalled()
    })

    it('should initiateCertRequest', async () => {
      await ieee8021xConfiguration.initiateCertRequest(ieee8021xConfigContext, null)
      expect(ieee8021xConfigContext.message).toEqual({
        action: 'satellite',
        subaction: '802.1x-ProFile-Request',
        satelliteFlags: 2,
        nodeid: ieee8021xConfigContext.clientId,
        domain: '',
        reqid: '',
        authProtocol: 0,
        osname: 'win11',
        devname: 'WinDev2211Eval',
        icon: 1,
        cert: null,
        certid: null,
        ver: ''
      })
      expect(invokeEnterpriseAssistantCallSpy).toHaveBeenCalled()
    })
  })

  describe('IEEE8021x configuration machine', () => {
    it('should eventually reach "SUCCESS"', (done) => {
      const mockieee8021xConfigurationMachine = ieee8021xConfiguration.machine.withConfig(configuration).withContext(ieee8021xConfigContext)
      const flowStates = ['ACTIVATION',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'ADD_CERTIFICATE',
        'ADD_RADIUS_SERVER_ROOT_CERTIFICATE',
        'PUT_8021X_PROFILE',
        'SET_CERTIFICATES',
        'SUCCESS']
      const service = interpret(mockieee8021xConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.send({ type: 'CONFIGURE_8021X' })
    })
    it('should reach "SUCCESS" when there is no 802.1x profile', (done) => {
      configuration.guards.is8021xProfilesExists = () => false
      const mockieee8021xConfigurationMachine = ieee8021xConfiguration.machine.withConfig(configuration).withContext(ieee8021xConfigContext)
      const flowStates = [
        'ACTIVATION',
        'SUCCESS']
      const service = interpret(mockieee8021xConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.send({ type: 'CONFIGURE_8021X' })
    })
    it('should eventually reach "FAILED" after Get 802.1x Profile fails', (done) => {
      configuration.services['get-8021x-profile'] = Promise.reject(new Error())
      const mockieee8021xConfigurationMachine = ieee8021xConfiguration.machine.withConfig(configuration).withContext(ieee8021xConfigContext)
      const flowStates = [
        'ACTIVATION',
        'GET_8021X_PROFILE',
        'FAILED']
      const service = interpret(mockieee8021xConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.send({ type: 'CONFIGURE_8021X' })
    })
    it('should eventually reach "FAILED" after enterprise assistant request', (done) => {
      configuration.services['enterprise-assistant-request'] = Promise.reject(new Error())
      const mockieee8021xConfigurationMachine = ieee8021xConfiguration.machine.withConfig(configuration).withContext(ieee8021xConfigContext)
      const flowStates = [
        'ACTIVATION',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'FAILED']
      const service = interpret(mockieee8021xConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.send({ type: 'CONFIGURE_8021X' })
    })
    it('should eventually reach "FAILED" after generate key pair', (done) => {
      configuration.services['generate-key-pair'] = Promise.reject(new Error())
      const mockieee8021xConfigurationMachine = ieee8021xConfiguration.machine.withConfig(configuration).withContext(ieee8021xConfigContext)
      const flowStates = [
        'ACTIVATION',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'FAILED']
      const service = interpret(mockieee8021xConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.send({ type: 'CONFIGURE_8021X' })
    })
    it('should eventually reach "FAILED" after enumerate public private key pair', (done) => {
      configuration.services['enumerate-public-private-key-pair'] = Promise.reject(new Error())
      const mockieee8021xConfigurationMachine = ieee8021xConfiguration.machine.withConfig(configuration).withContext(ieee8021xConfigContext)
      const flowStates = [
        'ACTIVATION',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'FAILED']
      const service = interpret(mockieee8021xConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.send({ type: 'CONFIGURE_8021X' })
    })
    it('should eventually reach "FAILED" after pull public private key pair fails', (done) => {
      configuration.services['pull-public-private-key-pair'] = Promise.reject(new Error())
      const mockieee8021xConfigurationMachine = ieee8021xConfiguration.machine.withConfig(configuration).withContext(ieee8021xConfigContext)
      const flowStates = [
        'ACTIVATION',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'FAILED']
      const service = interpret(mockieee8021xConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.send({ type: 'CONFIGURE_8021X' })
    })
    it('should eventually reach "FAILED" after enterprise assistant response fails', (done) => {
      configuration.services['enterprise-assistant-response'] = Promise.reject(new Error())
      const mockieee8021xConfigurationMachine = ieee8021xConfiguration.machine.withConfig(configuration).withContext(ieee8021xConfigContext)
      const flowStates = [
        'ACTIVATION',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'FAILED']
      const service = interpret(mockieee8021xConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.send({ type: 'CONFIGURE_8021X' })
    })
    it('should eventually reach "FAILED" after sign csr fails', (done) => {
      configuration.services['sign-csr'] = Promise.reject(new Error())
      const mockieee8021xConfigurationMachine = ieee8021xConfiguration.machine.withConfig(configuration).withContext(ieee8021xConfigContext)
      const flowStates = [
        'ACTIVATION',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'FAILED']
      const service = interpret(mockieee8021xConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.send({ type: 'CONFIGURE_8021X' })
    })
    it('should eventually reach "FAILED" after get cert from enterprise assistant fails', (done) => {
      configuration.services['get-cert-from-enterprise-assistant'] = Promise.reject(new Error())
      const mockieee8021xConfigurationMachine = ieee8021xConfiguration.machine.withConfig(configuration).withContext(ieee8021xConfigContext)
      const flowStates = [
        'ACTIVATION',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'FAILED']
      const service = interpret(mockieee8021xConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.send({ type: 'CONFIGURE_8021X' })
    })
    it('should eventually reach "FAILED" after add certificate fails', (done) => {
      configuration.services['add-certificate'] = Promise.reject(new Error())
      const mockieee8021xConfigurationMachine = ieee8021xConfiguration.machine.withConfig(configuration).withContext(ieee8021xConfigContext)
      const flowStates = [
        'ACTIVATION',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'ADD_CERTIFICATE',
        'FAILED']
      const service = interpret(mockieee8021xConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.send({ type: 'CONFIGURE_8021X' })
    })
    it('should eventually reach "FAILED" after add radius server root certificate fails', (done) => {
      configuration.services['add-radius-server-root-certificate'] = Promise.reject(new Error())
      const mockieee8021xConfigurationMachine = ieee8021xConfiguration.machine.withConfig(configuration).withContext(ieee8021xConfigContext)
      const flowStates = [
        'ACTIVATION',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'ADD_CERTIFICATE',
        'ADD_RADIUS_SERVER_ROOT_CERTIFICATE',
        'FAILED']
      const service = interpret(mockieee8021xConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.send({ type: 'CONFIGURE_8021X' })
    })
    it('should eventually reach "FAILED" after put 8021x profile fails', (done) => {
      configuration.services['put-8021x-profile'] = Promise.reject(new Error())
      const mockieee8021xConfigurationMachine = ieee8021xConfiguration.machine.withConfig(configuration).withContext(ieee8021xConfigContext)
      const flowStates = [
        'ACTIVATION',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'ADD_CERTIFICATE',
        'ADD_RADIUS_SERVER_ROOT_CERTIFICATE',
        'PUT_8021X_PROFILE',
        'FAILED']
      const service = interpret(mockieee8021xConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.send({ type: 'CONFIGURE_8021X' })
    })
    it('should eventually reach "FAILED" after set certificates fails', (done) => {
      configuration.services['set-certificates'] = Promise.reject(new Error())
      const mockieee8021xConfigurationMachine = ieee8021xConfiguration.machine.withConfig(configuration).withContext(ieee8021xConfigContext)
      const flowStates = [
        'ACTIVATION',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'ADD_CERTIFICATE',
        'ADD_RADIUS_SERVER_ROOT_CERTIFICATE',
        'PUT_8021X_PROFILE',
        'SET_CERTIFICATES',
        'FAILED']
      const service = interpret(mockieee8021xConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.send({ type: 'CONFIGURE_8021X' })
    })
  })
})
