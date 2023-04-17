/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'
import { Environment } from '../utils/Environment'
import { config } from '../test/helper/Config'
import { ClientAction } from '../models/RCS.Config'
import { WiFiConfiguration } from './wifiNetworkConfiguration'
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
        'enumerate-wifi-endpoint-settings': async (_, event) => await Promise.resolve({ clientId: event.clientId }),
        'pull-wifi-endpoint-settings': Promise.resolve({ Envelope: { Body: { PullResponse: { Items: { CIM_WiFiEndpointSettings: null } } } } }),
        'delete-wifi-endpoint-settings': Promise.resolve({ clientId }),
        'request-state-change-for-wifi-port': Promise.resolve({ clientId }),
        'add-wifi-settings': Promise.resolve({ Envelope: { Body: { AddWiFiSettings_OUTPUT: { ReturnValue: 1 } } } }),
        'get-wifi-port-configuration-service': Promise.resolve({
          Envelope: {
            Body: {
              AMT_WiFiPortConfigurationService: {
                localProfileSynchronizationEnabled: 0
              }
            }
          }
        }),
        'put-wifi-port-configuration-service': Promise.resolve({
          Envelope: {
            Body: {
              AMT_WiFiPortConfigurationService: {
                localProfileSynchronizationEnabled: 3
              }
            }
          }
        })
      },
      guards: {
        shouldRetry: () => {}
      },
      actions: {
        'Reset Unauth Count': () => { },
        'Read Ethernet Port Settings': () => { }
      }
    }
  })

  describe('State machines', () => {
    it('should eventually reach "FAILED" state for WIRELESS devices', (done) => {
      context.wifiSettings = {
        ElementName: 'Intel(r) AMT Ethernet Port Settings',
        InstanceID: 'Intel(r) AMT Ethernet Port Settings 1',
        MACAddress: '00-00-00-00-00-00'
      }
      const mockNetworkConfigurationMachine = wifiConfiguration.machine.withConfig(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'ENUMERATE_WIFI_ENDPOINT_SETTINGS',
        'PULL_WIFI_ENDPOINT_SETTINGS',
        'GET_WIFI_PORT_CONFIGURATION_SERVICE',
        'PUT_WIFI_PORT_CONFIGURATION_SERVICE',
        'REQUEST_STATE_CHANGE_FOR_WIFI_PORT',
        'ADD_WIFI_SETTINGS',
        'FAILED'
      ]
      const service = interpret(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Wired Network Configured. Failed to add wifi settings')
          done()
        }
      })
      service.start()
      service.send({ type: 'WIFICONFIG', clientId })
    })
  })

  describe('Get profiles', () => {
    test('should return WiFi Profile', async () => {
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

      const wifiProfile = await wifiConfiguration.getWifiProfile(context.amtProfile.profileName)
      expect(wifiProfile).toBe(expectedProfile)
      expect(getPSKPassphraseSpy).toHaveBeenCalled()
      expect(getByNameSpy).toHaveBeenCalled()
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
    test('should add a WiFi Profile to AMT', async () => {
      const getWifiProfileSpy = jest.spyOn(wifiConfiguration, 'getWifiProfile').mockResolvedValue({
        profileName: 'home',
        authenticationMethod: 4,
        encryptionMethod: 4,
        ssid: 'test',
        pskPassphrase: 'Intel@123',
        linkPolicy: ['14', '16'],
        pskValue: 1,
        tenantId: '',
        ieee8021xProfileName: 'nacProfile'
      })
      const WiFiPortConfigurationServiceSpy = jest.spyOn(context.amt.WiFiPortConfigurationService, 'AddWiFiSettings').mockReturnValue('done')
      await wifiConfiguration.addWifiConfigs(context, null)
      expect(getWifiProfileSpy).toHaveBeenCalled()
      expect(WiFiPortConfigurationServiceSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
  })

  describe('WiFi Endpoint Settings', () => {
    test('should get enumeration number for WiFi end point settings', async () => {
      const WiFiEndpointSettingsSpy = jest.spyOn(context.cim.WiFiEndpointSettings, 'Enumerate').mockReturnValue('done')
      await wifiConfiguration.enumerateWiFiEndpointSettings(context)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
      expect(WiFiEndpointSettingsSpy).toHaveBeenCalled()
    })
    test('should pull WiFi end point settings', async () => {
      context.message = {
        Envelope: {
          Header: {
            Action: { _: 'http://schemas.xmlsoap.org/ws/2004/09/enumeration/EnumerateResponse' },
            ResourceURI: 'http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_WiFiEndpointSettings'
          },
          Body: { EnumerateResponse: { EnumerationContext: '92340000-0000-0000-0000-000000000000' } }
        }
      }
      const WiFiEndpointSettingsSpy = jest.spyOn(context.cim.WiFiEndpointSettings, 'Pull').mockReturnValue('done')
      await wifiConfiguration.pullWiFiEndpointSettings(context)
      expect(WiFiEndpointSettingsSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    test('Should read WiFi end point settings, if CIM_WiFiEndpointSettings is an array', () => {
      context.message = {
        Envelope: {
          Header: {},
          Body: { PullResponse: { Items: { CIM_WiFiEndpointSettings: [{ InstanceID: 'home', Priority: 1 }, { InstanceID: 'office', Priority: 2 }] } } }
        }
      }
      wifiConfiguration.readWiFiEndpointSettingsPullResponse(context, null)
      expect(context.wifiEndPointSettings.length).toBe(2)
    })
    test('Should read WiFi end point settings', () => {
      context.message = {
        Envelope: {
          Header: {},
          Body: { PullResponse: { Items: { CIM_WiFiEndpointSettings: { InstanceID: 'home', Priority: 1 } } } }
        }
      }
      wifiConfiguration.readWiFiEndpointSettingsPullResponse(context, null)
      expect(context.wifiEndPointSettings.length).toBe(1)
    })
    test('Should delete profile from WiFi end point settings', async () => {
      context.wifiEndPointSettings = [{ InstanceID: 'home', Priority: 1 }]
      const WiFiEndpointSettingsSpy = jest.spyOn(context.cim.WiFiEndpointSettings, 'Delete').mockReturnValue('done')
      await wifiConfiguration.deleteWiFiProfileOnAMTDevice(context, null)
      expect(context.wifiEndPointSettings.length).toBe(0)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
      expect(WiFiEndpointSettingsSpy).toHaveBeenCalled()
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
})
