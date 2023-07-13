/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'
import { Environment } from '../utils/Environment'
import { config } from '../test/helper/Config'
import { ClientAction } from '../models/RCS.Config'
import { type WiFiConfigEvent, WiFiConfiguration } from './wifiNetworkConfiguration'
import { interpret } from 'xstate'
import { HttpHandler } from '../HttpHandler'
import * as common from './common'
import { AMT, CIM } from '@open-amt-cloud-toolkit/wsman-messages'

const clientId = uuid()
Environment.Config = config
describe('WiFi Network Configuration', () => {
  let config
  let currentStateIndex: number
  let wifiConfiguration: WiFiConfiguration
  let context
  let invokeWsmanCallSpy
  let wifiProfile

  beforeEach(() => {
    wifiProfile = {
      profileName: 'test-profile',
      authenticationMethod: 5,
      encryptionMethod: 3,
      ssid: 'test-ssid',
      priority: 1,
      ieee8021xProfileName: 'test-profile',
      ieee8021xProfileObject: { profileName: 'test-profile', authenticationProtocol: 0 }
    }
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
          action: ClientAction.ADMINCTLMODE
        }
      },
      ciraconfig: {},
      network: {},
      status: {
        Network: 'Wired Network Configured'
      },
      activationStatus: false,
      connectionParams: {
        guid: '4c4c4544-004b-4210-8033-b6c04f504633',
        port: 16992,
        digestChallenge: null,
        username: 'admin',
        password: 'P@ssw0rd'
      },
      uuid: '4c4c4544-004b-4210-8033-b6c04f504633',
      messageId: 1
    }
    wifiConfiguration = new WiFiConfiguration()
    context = {
      amtProfile: null,
      generalSettings: {
        AMTNetworkEnabled: 1,
        RmcpPingResponseEnabled: true,
        SharedFQDN: false
      },
      wiredSettings: {
        DHCPEnabled: true,
        ElementName: 'Intel(r) AMT Ethernet Port Settings',
        InstanceID: 'Intel(r) AMT Ethernet Port Settings 0',
        IpSyncEnabled: false,
        MACAddress: 'a4-bb-6d-89-52-e4'
      },
      wifiProfiles: [],
      wifiProfileCount: 0,
      message: '',
      clientId,
      xmlMessage: '',
      response: '',
      status: 'wsman',
      statusMessage: '',
      httpHandler: new HttpHandler(),
      amt: new AMT.Messages(),
      cim: new CIM.Messages()
    }
    context.amtProfile = {
      profileName: 'acm',
      generateRandomPassword: false,
      activation: ClientAction.ADMINCTLMODE,
      ciraConfigName: 'config1',
      generateRandomMEBxPassword: false,
      tags: ['acm'],
      dhcpEnabled: true,
      ipSyncEnabled: true,
      wifiConfigs: [
        {
          priority: 1,
          profileName: 'home'
        }
      ]
    }
    invokeWsmanCallSpy = jest.spyOn(common, 'invokeWsmanCall').mockResolvedValue(null)
    currentStateIndex = 0
    config = {
      services: {
        'error-machine': async (_, event) => await Promise.resolve({ clientId: event.clientId }),
        'request-state-change-for-wifi-port': Promise.resolve({ clientId }),
        'get-wifi-profile': Promise.resolve({ clientId }),
        'add-wifi-settings': Promise.resolve({ Envelope: { Body: { AddWiFiSettings_OUTPUT: { ReturnValue: 0 } } } }),
        'get-wifi-port-configuration-service': Promise.resolve({ Envelope: { Body: { AMT_WiFiPortConfigurationService: { localProfileSynchronizationEnabled: 0 } } } }),
        'put-wifi-port-configuration-service': Promise.resolve({ Envelope: { Body: { AMT_WiFiPortConfigurationService: { localProfileSynchronizationEnabled: 3 } } } }),
        'enterprise-assistant-request': Promise.resolve({ clientId }),
        'generate-key-pair': Promise.resolve({ clientId }),
        'enumerate-public-private-key-pair': Promise.resolve({ clientId }),
        'pull-public-private-key-pair': Promise.resolve({ clientId }),
        'enterprise-assistant-response': Promise.resolve({ clientId }),
        'sign-csr': Promise.resolve({ clientId }),
        'get-cert-from-enterprise-assistant': Promise.resolve({ clientId }),
        'add-certificate': Promise.resolve({ clientId }),
        'add-radius-server-root-certificate': Promise.resolve({ clientId })
      },
      guards: {
        shouldRetry: () => {},
        isMSCHAPv2: () => false
      },
      actions: {
        'Reset Unauth Count': () => { },
        'Read Ethernet Port Settings': () => { }
      }
    }
  })

  describe('State machines', () => {
    it('should eventually reach "FAILED" state', (done) => {
      devices[clientId].status.Network = undefined
      config.services['get-wifi-port-configuration-service'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'FAILED'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Failed to get WiFi Port Configuration Service')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })

    it('should eventually reach "FAILED" state', (done) => {
      config.services['put-wifi-port-configuration-service'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'FAILED'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Failed to put WiFi Port Configuration Service')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })

    it('should eventually reach "FAILED" state', (done) => {
      config.services['request-state-change-for-wifi-port'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'FAILED'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Failed to update state change for wifi port')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })

    it('should eventually reach "FAILED" state', (done) => {
      config.services['get-wifi-profile'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'FAILED'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Failed to get wifi profile from DB')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })

    it('should eventually reach "FAILED" state', (done) => {
      context.wifiProfile = wifiProfile
      config.services['enterprise-assistant-request'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'FAILED'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Failed to initiate cert request with enterprise assistant in 802.1x')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })

    it('should eventually reach "FAILED" state', (done) => {
      context.wifiProfile = wifiProfile
      config.services['generate-key-pair'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'FAILED'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Failed to generate key pair in 802.1x')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      context.wifiProfile = wifiProfile
      config.services['enumerate-public-private-key-pair'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'FAILED'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Failed to enumerate public private key pair in 802.1x')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })

    it('should eventually reach "FAILED" state', (done) => {
      context.wifiProfile = wifiProfile
      config.services['pull-public-private-key-pair'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'FAILED'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Failed to pull public private key pair in 802.1x')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })

    it('should eventually reach "FAILED" state', (done) => {
      context.wifiProfile = wifiProfile
      config.services['enterprise-assistant-response'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'FAILED'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Failed to send key pair to enterprise assistant in 802.1x')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })

    it('should eventually reach "FAILED" state', (done) => {
      context.wifiProfile = wifiProfile
      config.services['sign-csr'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'FAILED'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Failed to have AMT sign CSR in 802.1x')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })

    it('should eventually reach "FAILED" state', (done) => {
      context.wifiProfile = wifiProfile
      config.services['get-cert-from-enterprise-assistant'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'FAILED'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Failed to get cert from Microsoft CA in 802.1x')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      context.wifiProfile = wifiProfile
      config.services['add-certificate'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'ADD_CERTIFICATE',
        'FAILED'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Failed to add certificate in 802.1x')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })

    it('should eventually reach "FAILED" state', (done) => {
      devices[context.clientId].trustedRootCertificateResponse = null
      devices[context.clientId].trustedRootCertificate = null
      context.wifiProfile = wifiProfile
      config.services['add-radius-server-root-certificate'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'ADD_CERTIFICATE',
        'ADD_RADIUS_SERVER_ROOT_CERTIFICATE',
        'FAILED'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Failed to add radius server root certificate in 802.1x')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })

    it('should add a WiFi profile to AMT.', (done) => {
      context.wifiSettings = {
        ElementName: 'Intel(r) AMT Ethernet Port Settings',
        InstanceID: 'Intel(r) AMT Ethernet Port Settings 1',
        MACAddress: '00-00-00-00-00-00'
      }
      context.wifiProfileName = 'unsupportedEncryption'
      context.wifiProfileCount = 1
      config.guards = {
        is8021xProfileAssociated: () => true,
        isWiFiProfilesExists: () => false,
        isTrustedRootCertifcateExists: () => true,
        isMSCHAPv2: () => false
      }

      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'ADD_CERTIFICATE',
        'ADD_WIFI_SETTINGS',
        'SUCCESS'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Wireless Configured')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })

    it('should fail to add wifi profile when not supported by AMT.', (done) => {
      context.wifiSettings = {
        ElementName: 'Intel(r) AMT Ethernet Port Settings',
        InstanceID: 'Intel(r) AMT Ethernet Port Settings 1',
        MACAddress: '00-00-00-00-00-00'
      }
      config.services['add-wifi-settings'] = Promise.reject(new Error())
      context.wifiProfileName = 'unsupportedEncryption'
      context.wifiProfileCount = 1
      config.guards = {
        is8021xProfileAssociated: () => true,
        isWiFiProfilesExists: () => false,
        isTrustedRootCertifcateExists: () => true,
        isMSCHAPv2: () => false
      }

      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'ADD_CERTIFICATE',
        'ADD_WIFI_SETTINGS',
        'SUCCESS'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Failed to add unsupportedEncryption')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })

    it('should fail and report the detail message with added and failed profiles.', (done) => {
      context.wifiSettings = {
        ElementName: 'Intel(r) AMT Ethernet Port Settings',
        InstanceID: 'Intel(r) AMT Ethernet Port Settings 1',
        MACAddress: '00-00-00-00-00-00'
      }
      config.services['add-wifi-settings'] = Promise.reject(new Error())
      context.profilesAdded = 'profile1, profile3'
      context.profilesFailed = 'profile2'
      context.wifiProfileName = 'profile4'
      context.wifiProfileCount = 1
      config.guards = {
        is8021xProfileAssociated: () => true,
        isWiFiProfilesExists: () => false,
        isTrustedRootCertifcateExists: () => true,
        isMSCHAPv2: () => false
      }

      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'ADD_CERTIFICATE',
        'ADD_WIFI_SETTINGS',
        'SUCCESS'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual(`Wired Network Configured. Added ${context.profilesAdded} WiFi Profiles. Failed to add profile2, profile4`)
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })
    it('should fail and report the detail message with added and return value 1.', (done) => {
      context.wifiSettings = {
        ElementName: 'Intel(r) AMT Ethernet Port Settings',
        InstanceID: 'Intel(r) AMT Ethernet Port Settings 1',
        MACAddress: '00-00-00-00-00-00'
      }
      config.services['add-wifi-settings'] = Promise.resolve({ Envelope: { Body: { AddWiFiSettings_OUTPUT: { ReturnValue: 1 } } } })
      context.profilesAdded = 'profile1, profile3'
      context.wifiProfileName = 'profile5'
      context.wifiProfileCount = 1
      config.guards = {
        is8021xProfileAssociated: () => true,
        isWiFiProfilesExists: () => false,
        isTrustedRootCertifcateExists: () => true,
        isMSCHAPv2: () => false
      }

      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'ADD_CERTIFICATE',
        'ADD_WIFI_SETTINGS',
        'SUCCESS'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual(`Wired Network Configured. Added ${context.profilesAdded} WiFi Profiles. Failed to add profile5`)
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })
    it('should fail and report the detail message with added', (done) => {
      context.wifiSettings = {
        ElementName: 'Intel(r) AMT Ethernet Port Settings',
        InstanceID: 'Intel(r) AMT Ethernet Port Settings 1',
        MACAddress: '00-00-00-00-00-00'
      }
      config.services['add-wifi-settings'] = Promise.resolve({ Envelope: { Body: { AddWiFiSettings_OUTPUT: { ReturnValue: 0 } } } })
      context.profilesAdded = 'profile1'
      context.wifiProfileName = 'profile2'
      context.wifiProfileCount = 1
      config.guards = {
        is8021xProfileAssociated: () => true,
        isWiFiProfilesExists: () => false,
        isTrustedRootCertifcateExists: () => true,
        isMSCHAPv2: () => false
      }

      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'GET_WIFI_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'ADD_CERTIFICATE',
        'ADD_WIFI_SETTINGS',
        'SUCCESS'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Wireless Configured')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })
  })

  describe('Get profiles', () => {
    test('should get WiFi Profile', async () => {
      const expectedProfile = {
        profileName: 'home',
        authenticationMethod: 4,
        encryptionMethod: 4,
        ssid: 'test',
        pskPassphrase: 'Intel@123',
        linkPolicy: [14, 16]
      }
      const mockDb = {
        wirelessProfiles: {
          getByName: jest.fn()
        }
      }

      wifiConfiguration.dbFactory = {
        getDb: async () => mockDb
      } as any
      const getByNameSpy = jest.spyOn(mockDb.wirelessProfiles, 'getByName').mockReturnValue(expectedProfile)
      const getPSKPassphraseSpy = jest.spyOn(wifiConfiguration.configurator.secretsManager, 'getSecretAtPath').mockImplementation(async () => ({ PSK_PASSPHRASE: 'Intel@123' }))

      await wifiConfiguration.getWifiProfile(context, null)
      expect(context.wifiProfile).toBe(expectedProfile)
      expect(getPSKPassphraseSpy).toHaveBeenCalled()
      expect(getByNameSpy).toHaveBeenCalled()
    })

    test('should get WiFi Profile and associated 8021x profile', async () => {
      const expectedProfile = {
        profileName: 'office',
        authenticationMethod: 4,
        encryptionMethod: 4,
        ssid: 'firstfloor',
        ieee8021xProfileName: 'test',
        linkPolicy: [14, 16]
      }
      const ieee8021xProfile = { profileName: 'test', authenticationProtocol: 0 }
      const mockDb = {
        wirelessProfiles: {
          getByName: jest.fn()
        },
        ieee8021xProfiles: {
          getByName: jest.fn()
        }
      }

      wifiConfiguration.dbFactory = {
        getDb: async () => mockDb
      } as any
      const getByNameSpy = jest.spyOn(mockDb.wirelessProfiles, 'getByName').mockReturnValue(expectedProfile)
      const getIEEE8021xProfileByNameSpy = jest.spyOn(mockDb.ieee8021xProfiles, 'getByName').mockReturnValue(ieee8021xProfile)
      const getPSKPassphraseSpy = jest.spyOn(wifiConfiguration.configurator.secretsManager, 'getSecretAtPath').mockImplementation(async () => ({ PSK_PASSPHRASE: 'Intel@123' }))

      await wifiConfiguration.getWifiProfile(context, null)
      expect(context.wifiProfile).toBe(expectedProfile)
      expect(getPSKPassphraseSpy).toHaveBeenCalled()
      expect(getByNameSpy).toHaveBeenCalled()
      expect(getIEEE8021xProfileByNameSpy).toHaveBeenCalled()
    })
  })

  describe('WiFi Port Configuration Service', () => {
    test('should get WiFi Port Configuration Service', async () => {
      const WiFiPortConfigurationServiceSpy = jest.spyOn(context.amt.WiFiPortConfigurationService, 'Get').mockReturnValue('done')
      await wifiConfiguration.getWiFiPortConfigurationService(context, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
      expect(WiFiPortConfigurationServiceSpy).toHaveBeenCalled()
    })
    test('should return WiFi Profiles', async () => {
      context.message = {
        Envelope: {
          Header: {},
          Body: { AMT_WiFiPortConfigurationService: { localProfileSynchronizationEnabled: 1 } }
        }
      }
      const WiFiPortConfigurationServiceSpy = jest.spyOn(context.amt.WiFiPortConfigurationService, 'Put').mockReturnValue('done')
      await wifiConfiguration.putWiFiPortConfigurationService(context, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
      expect(WiFiPortConfigurationServiceSpy).toHaveBeenCalled()
    })
    it('should add WiFi settings to AMT', async () => {
      context.wifiProfileCount = 0
      context.wifiProfile = {
        profileName: 'home',
        authenticationMethod: 6,
        encryptionMethod: 3,
        ssid: 'my-home',
        Priority: 0
      }
      context.addTrustedRootCertResponse = {
        AddTrustedRootCertificate_OUTPUT: {
          CreatedCertificate: {
            ReferenceParameters: {
              SelectorSet: { Selector: { _: 'test-root-cert' } }
            }
          }
        }
      }
      const addWiFiSettingsSpy = jest.spyOn(context.amt.WiFiPortConfigurationService, 'AddWiFiSettings').mockReturnValue('done')
      await wifiConfiguration.addWifiConfigs(context, null)
      expect(addWiFiSettingsSpy).toHaveBeenCalledTimes(1)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should add WiFi settings with 802.1x config to AMT', async () => {
      context.eaResponse = {
        username: 'test-username'
      }
      context.wifiProfileCount = 0
      context.wifiProfile = {
        profileName: 'test-profile',
        authenticationMethod: 5,
        encryptionMethod: 3,
        ssid: 'test-ssid',
        priority: 1,
        ieee8021xProfileName: 'test-profile',
        ieee8021xProfileObject: {
          profileName: 'test-profile',
          authenticationProtocol: 0
        }
      }
      context.addTrustedRootCertResponse = {
        AddTrustedRootCertificate_OUTPUT: {
          CreatedCertificate: {
            ReferenceParameters: {
              SelectorSet: { Selector: { _: 'tesrt-root-cert' } }
            }
          }
        }
      }
      context.addCertResponse = {
        AddCertificate_OUTPUT: {
          CreatedCertificate: {
            ReferenceParameters: {
              SelectorSet: { Selector: { _: 'test-client-cert' } }
            }
          }
        }
      }
      const addWiFiSettingsSpy = jest.spyOn(context.amt.WiFiPortConfigurationService, 'AddWiFiSettings').mockReturnValue('done')
      await wifiConfiguration.addWifiConfigs(context, null)
      expect(addWiFiSettingsSpy).toHaveBeenCalledTimes(1)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
  })

  describe('CIM WiFi Port', () => {
    test('should update wifi port', async () => {
      const wifiPortSpy = jest.spyOn(context.cim.WiFiPort, 'RequestStateChange').mockReturnValue('done')
      await wifiConfiguration.updateWifiPort(context, null)
      expect(wifiPortSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
  })

  describe('certificates', () => {
    it('should generate a key pair', async () => {
      context.amt = { PublicKeyManagementService: { GenerateKeyPair: jest.fn().mockResolvedValue({}) } }
      await wifiConfiguration.generateKeyPair(context, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send a message to pull public private key pairs', async () => {
      context.amt = { PublicPrivateKeyPair: { Pull: jest.fn().mockResolvedValue({}) } }
      context.message = { Envelope: { Body: { EnumeratorResponse: { EnumeratorContext: 'abc' } } } }
      await wifiConfiguration.pullPublicPrivateKeyPair(context, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send a message to get enumerate public private key pairs', async () => {
      context.message = { Envelope: { Body: { GenerateKeyPair_OUTPUT: { KeyPair: { ReferenceParameters: { SelectorSet: { Selector: { _: 'xyz' } } } } } } } }
      context.amt = { PublicPrivateKeyPair: { Enumerate: jest.fn().mockResolvedValue({}) } }
      await wifiConfiguration.enumeratePublicPrivateKeyPair(context, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should addCertificate', async () => {
      context.message = { Envelope: { Body: { PullResponse: { Items: { AMT_PublicPrivateKeyPair: {} } } } } }
      await wifiConfiguration.addCertificate(context, { data: { response: { certificate: 'abcde' } } } as WiFiConfigEvent)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send a WSMan call to add radius server root cert', async () => {
      context.message = { Envelope: { Body: 'abcd' } }
      context.eaResponse = { rootcert: '1234' }
      await wifiConfiguration.addRadiusServerRootCertificate(context, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send a message to sign CSR', async () => {
      context.amt = { PublicKeyManagementService: { GeneratePKCS10RequestEx: jest.fn().mockResolvedValue({}) } }
      context.message = { response: { csr: 'abc' } }
      await wifiConfiguration.signCSR(context, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
  })
})
