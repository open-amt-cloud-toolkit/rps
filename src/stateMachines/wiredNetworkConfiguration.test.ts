/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'
import { Environment } from '../utils/Environment'
import { config } from '../test/helper/Config'
import { ClientAction } from '../models/RCS.Config'
import { WiredConfiguration } from './wiredNetworkConfiguration'
import { createActor } from 'xstate'
import { HttpHandler } from '../HttpHandler'
import * as common from './common'
import { AMT, CIM, IPS } from '@open-amt-cloud-toolkit/wsman-messages'

const clientId = uuid()
Environment.Config = config

describe('Wired Network Configuration', () => {
  let config
  let currentStateIndex: number
  let wiredConfig: WiredConfiguration
  let wiredNetworkConfigContext
  let context
  let invokeWsmanCallSpy
  let event

  beforeEach(() => {
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
      messageId: 1
    }
    event = {
      type: 'WIREDNETWORKCONFIGURATION',
      clientId,
      data: null
    }
    wiredConfig = new WiredConfiguration()
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
    wiredNetworkConfigContext = {
      amtProfile: null,
      ieee8021xProfile: null,
      message: '',
      clientId,
      xmlMessage: '',
      statusMessage: '',
      errorMessage: '',
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
      httpHandler: new HttpHandler(),
      amt: new AMT.Messages(),
      ips: new IPS.Messages(),
      cim: new CIM.Messages(),
      retryCount: null,
      eaResponse: '',
      addTrustedRootCertResponse: '',
      addCertResponse: null,
      keyPairHandle: '',
      targetAfterError: '',
      wirelessSettings: null
    }
    invokeWsmanCallSpy = jest.spyOn(common, 'invokeWsmanCall').mockResolvedValue(null)
    currentStateIndex = 0
    config = {
      services: {
        'put-ethernet-port-settings': Promise.resolve({
          Envelope: {
            Body: {
              AMT_EthernetPortSettings: {
                DHCPEnabled: true,
                IpSyncEnabled: true,
                SharedStaticIp: false
              }
            }
          }
        }),
        'get-8021x-profile': Promise.resolve({
          Envelope: {
            Body: {}
          }
        }),
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
        'error-machine': async (_, event) => await Promise.resolve({ clientId: event.clientId })
      },
      guards: {
        is8021xProfilesExists: () => true,
        isMSCHAPv2: () => false,
        shouldRetry: () => false
      },
      actions: {
        'Reset Unauth Count': () => { },
        'Read Ethernet Port Settings': () => { },
        'Read WiFi Endpoint Settings Pull Response': () => { }
      }
    }
  })

  it('should send a message to pull public private key pairs', async () => {
    wiredNetworkConfigContext.amt = { PublicPrivateKeyPair: { Pull: jest.fn().mockResolvedValue({}) } }
    wiredNetworkConfigContext.message = { Envelope: { Body: { EnumeratorResponse: { EnumeratorContext: 'abc' } } } }
    await wiredConfig.pullPublicPrivateKeyPair(wiredNetworkConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send a message to get enumerate public private key pairs', async () => {
    wiredNetworkConfigContext.message = { Envelope: { Body: { GenerateKeyPair_OUTPUT: { KeyPair: { ReferenceParameters: { SelectorSet: { Selector: { _: 'xyz' } } } } } } } }
    wiredNetworkConfigContext.amt = { PublicPrivateKeyPair: { Enumerate: jest.fn().mockResolvedValue({}) } }
    await wiredConfig.enumeratePublicPrivateKeyPair(wiredNetworkConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should addCertificate', async () => {
    wiredNetworkConfigContext.message = { Envelope: { Body: { PullResponse: { Items: { AMT_PublicPrivateKeyPair: {} } } } } }
    event = { data: { response: { certificate: 'abcde' } } }
    await wiredConfig.addCertificate(wiredNetworkConfigContext, event)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send a WSMan call to add radius server root cert', async () => {
    wiredNetworkConfigContext.message = { Envelope: { Body: 'abcd' } }
    wiredNetworkConfigContext.eaResponse = { rootcert: '1234' }
    await wiredConfig.addRadiusServerRootCertificate(wiredNetworkConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send a message to sign CSR', async () => {
    wiredNetworkConfigContext.amt = { PublicKeyManagementService: { GeneratePKCS10RequestEx: jest.fn().mockResolvedValue({}) } }
    wiredNetworkConfigContext.message = { response: { csr: 'abc' } }
    await wiredConfig.signCSR(wiredNetworkConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send a WSMan call to setCertificate', async () => {
    wiredNetworkConfigContext.addCertResponse = { AddCertificate_OUTPUT: { CreatedCertificate: { ReferenceParameters: { SelectorSet: { Selector: { _: '' } } } } } }
    wiredNetworkConfigContext.addTrustedRootCertificate = { AddCertificate_OUTPUT: { CreatedCertificate: { ReferenceParameters: { SelectorSet: { Selector: { _: '' } } } } } }
    await wiredConfig.setCertificates(wiredNetworkConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send a WSMan call to put 802.1x Profile', async () => {
    wiredNetworkConfigContext.amtProfile = {
      profileName: 'acm',
      amtPassword: 'Intel123!',
      mebxPassword: 'Intel123!',
      activation: 'acmactivate',
      tags: ['acm'],
      dhcpEnabled: true,
      ipSyncEnabled: true,
      ieee8021xProfileName: 'p1',
      tenantId: ''
    }
    wiredNetworkConfigContext.ieee8021xProfile = {
      Enabled: 3,
      AuthenticationProtocol: 0,
      ElementName: '',
      PxeTimeout: 0,
      Username: ''
    }
    wiredNetworkConfigContext.message = { Envelope: { Body: 'abcd' } }
    wiredNetworkConfigContext.amtProfile.ieee8021xProfileObject = { profileName: 'p1', authenticationProtocol: 0, pxeTimeout: 120, tenantId: '', wiredInterface: true }
    await wiredConfig.put8021xProfile(wiredNetworkConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send a WSMan call to get 802.1x Profile', async () => {
    await wiredConfig.get8021xProfile(wiredNetworkConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should generate a key pair', async () => {
    wiredNetworkConfigContext = {
      amt: { PublicKeyManagementService: { GenerateKeyPair: jest.fn().mockResolvedValue({}) } },
      xmlMessage: ''
    }
    await wiredConfig.generateKeyPair(wiredNetworkConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should put ethernet port settings, DHCPEnabled is set to true', async () => {
    context.wiredSettings = {
      DHCPEnabled: true,
      DefaultGateway: '192.168.1.1',
      ElementName: 'Intel(r) AMT Ethernet Port Settings',
      IPAddress: '192.168.1.139',
      InstanceID: 'Intel(r) AMT Ethernet Port Settings 0',
      IpSyncEnabled: false,
      LinkIsUp: true,
      LinkPolicy: [
        1,
        14
      ],
      MACAddress: 'a4-bb-6d-89-52-e4',
      PhysicalConnectionType: 0,
      PrimaryDNS: '192.168.1.1',
      SharedDynamicIP: true,
      SharedMAC: true,
      SharedStaticIp: false,
      SubnetMask: '255.255.255.0'
    }
    const ethernetPortSettingsSpy = jest.spyOn(context.amt.EthernetPortSettings, 'Put').mockImplementation().mockReturnValue('abcdef')
    await wiredConfig.putEthernetPortSettings(context)
    expect(ethernetPortSettingsSpy).toHaveBeenCalled()
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should put ethernet port settings, DHCPEnabled is set to false', async () => {
    context.amtProfile.dhcpEnabled = false
    context.wiredSettings = {
      DHCPEnabled: true,
      DefaultGateway: '192.168.1.1',
      ElementName: 'Intel(r) AMT Ethernet Port Settings',
      IPAddress: '192.168.1.139',
      InstanceID: 'Intel(r) AMT Ethernet Port Settings 0',
      IpSyncEnabled: false,
      LinkIsUp: true,
      LinkPolicy: [
        1,
        14
      ],
      MACAddress: 'a4-bb-6d-89-52-e4',
      PhysicalConnectionType: 0,
      PrimaryDNS: '192.168.1.1',
      SharedDynamicIP: true,
      SharedMAC: true,
      SharedStaticIp: false,
      SubnetMask: '255.255.255.0'
    }
    const ethernetPortSettingsSpy = jest.spyOn(context.amt.EthernetPortSettings, 'Put').mockImplementation().mockReturnValue('abcdef')
    await wiredConfig.putEthernetPortSettings(context)
    expect(ethernetPortSettingsSpy).toHaveBeenCalled()
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should fail putEthernetPortSettings if ipSyncEnabled is false and missing ip address or subnetmask', async () => {
    context.amtProfile.dhcpEnabled = false
    context.amtProfile.ipSyncEnabled = false
    context.wiredSettings = {
      DefaultGateway: '',
      IPAddress: '',
      SubnetMask: ''
    }
    await expect(wiredConfig.putEthernetPortSettings(context)).rejects.toThrow()
    context.wiredSettings = {
      DefaultGateway: '',
      IPAddress: '192.168.1.100',
      SubnetMask: ''
    }
    await expect(wiredConfig.putEthernetPortSettings(context)).rejects.toThrow()
  })
  describe('Wired Network State Machine Tests', () => {
    it('should eventually reach "SUCCESS" state', (done) => {
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_ETHERNET_PORT_SETTINGS',
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
        'SUCCESS'
      ]
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured')
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      config.services['put-ethernet-port-settings'] = Promise.reject(new Error())
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_ETHERNET_PORT_SETTINGS',
        'FAILED'
      ]
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      config.services['get-8021x-profile'] = Promise.reject(new Error())
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_ETHERNET_PORT_SETTINGS',
        'GET_8021X_PROFILE',
        'FAILED'
      ]
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      config.services['enterprise-assistant-request'] = Promise.reject(new Error())
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_ETHERNET_PORT_SETTINGS',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'FAILED'
      ]
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      config.services['generate-key-pair'] = Promise.reject(new Error())
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_ETHERNET_PORT_SETTINGS',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'FAILED'
      ]
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      config.services['enumerate-public-private-key-pair'] = Promise.reject(new Error())
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_ETHERNET_PORT_SETTINGS',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'FAILED'
      ]
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      config.services['pull-public-private-key-pair'] = Promise.reject(new Error())
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_ETHERNET_PORT_SETTINGS',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'FAILED'
      ]
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      config.services['enterprise-assistant-response'] = Promise.reject(new Error())
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_ETHERNET_PORT_SETTINGS',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'FAILED'
      ]
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      config.services['sign-csr'] = Promise.reject(new Error())
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_ETHERNET_PORT_SETTINGS',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'FAILED'
      ]
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      config.services['get-cert-from-enterprise-assistant'] = Promise.reject(new Error())
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_ETHERNET_PORT_SETTINGS',
        'GET_8021X_PROFILE',
        'ENTERPRISE_ASSISTANT_REQUEST',
        'GENERATE_KEY_PAIR',
        'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
        'PULL_PUBLIC_PRIVATE_KEY_PAIR',
        'ENTERPRISE_ASSISTANT_RESPONSE',
        'SIGN_CSR',
        'GET_CERT_FROM_ENTERPRISE_ASSISTANT',
        'FAILED'
      ]
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      config.services['add-certificate'] = Promise.reject(new Error())
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_ETHERNET_PORT_SETTINGS',
        'GET_8021X_PROFILE',
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
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      config.services['add-radius-server-root-certificate'] = Promise.reject(new Error())
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_ETHERNET_PORT_SETTINGS',
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
        'FAILED'
      ]
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      config.services['put-8021x-profile'] = Promise.reject(new Error())
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_ETHERNET_PORT_SETTINGS',
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
        'FAILED'
      ]
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should eventually reach "FAILED" state', (done) => {
      config.services['set-certificates'] = Promise.reject(new Error())
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_ETHERNET_PORT_SETTINGS',
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
        'FAILED'
      ]
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should fail on isNotEthernetSettingsUpdated conditions', (done) => {
      const amtPutResponse = {
        Envelope: {
          Body: {
            AMT_EthernetPortSettings: {
              DHCPEnabled: false,
              IpSyncEnabled: true,
              SharedStaticIp: false
            }
          }
        }
      }
      config.services['put-ethernet-port-settings'] = Promise.resolve(amtPutResponse)
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        if (state.matches('FAILED')) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should fail on isNotEthernetSettingsUpdated conditions', (done) => {
      const amtPutResponse = {
        Envelope: {
          Body: {
            AMT_EthernetPortSettings: {
              DHCPEnabled: true,
              IpSyncEnabled: false,
              SharedStaticIp: false
            }
          }
        }
      }
      config.services['put-ethernet-port-settings'] = Promise.resolve(amtPutResponse)
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        if (state.matches('FAILED')) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should fail on isNotEthernetSettingsUpdated conditions', (done) => {
      const amtPutResponse = {
        Envelope: {
          Body: {
            AMT_EthernetPortSettings: {
              DHCPEnabled: true,
              IpSyncEnabled: true,
              SharedStaticIp: true
            }
          }
        }
      }
      config.services['put-ethernet-port-settings'] = Promise.resolve(amtPutResponse)
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        if (state.matches('FAILED')) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
    it('should fail on isNotEthernetSettingsUpdated conditions', (done) => {
      context.amtProfile.dhcpEnabled = false
      const amtPutResponse = {
        Envelope: {
          Body: {
            AMT_EthernetPortSettings: {
              DHCPEnabled: true,
              IpSyncEnabled: true,
              SharedStaticIp: false
            }
          }
        }
      }
      config.services['put-ethernet-port-settings'] = Promise.resolve(amtPutResponse)
      const mockWiredNetworkConfigurationMachine = wiredConfig.machine.provide(config).withContext(context)
      let prevState = null
      const service = createActor(mockWiredNetworkConfigurationMachine).onTransition((state) => {
        if (state.matches('FAILED')) {
          done()
          expect(prevState.matches('PUT_ETHERNET_PORT_SETTINGS')).toBeTruthy()
        } else {
          prevState = state
        }
      })
      service.start()
      service.raise({ type: 'WIREDCONFIG', clientId })
    })
  })
})
