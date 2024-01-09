/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'
import { Environment } from '../utils/Environment'
import { config } from '../test/helper/Config'
import { ClientAction } from '../models/RCS.Config'
import { NetworkConfiguration } from './networkConfiguration'
import { createActor } from 'xstate'
import { HttpHandler } from '../HttpHandler'
import * as common from './common'
import { AMT, CIM } from '@open-amt-cloud-toolkit/wsman-messages'

const clientId = uuid()
Environment.Config = config
describe('Network Configuration', () => {
  let config
  let currentStateIndex: number
  let networkConfig: NetworkConfiguration
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
    networkConfig = new NetworkConfiguration()
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
        'put-general-settings': async (_, event) => await Promise.resolve({ clientId: event.clientId }),
        'enumerate-ethernet-port-settings': Promise.resolve({
          Envelope: {
            Header: {},
            Body: { EnumerateResponse: { EnumerationContext: '09000000-0000-0000-0000-000000000000' } }
          }
        }),
        'error-machine': async (_, event) => await Promise.resolve({ clientId: event.clientId }),
        'pull-ethernet-port-settings': Promise.resolve({
          Envelope: {
            Header: {},
            Body: {
              PullResponse: {
                Items: {
                  AMT_EthernetPortSettings: [
                    { DHCPEnabled: true, ElementName: 'Intel(r) AMT Ethernet Port Settings', InstanceID: 'Intel(r) AMT Ethernet Port Settings 0', IpSyncEnabled: false },
                    { ElementName: 'Intel(r) AMT Ethernet Port Settings', InstanceID: 'Intel(r) AMT Ethernet Port Settings 1', MACAddress: '00-00-00-00-00-00' }
                  ]
                }
              }
            }
          }
        }),
        'wired-network-configuration-machine': Promise.resolve({ clientId }),
        'wifi-network-configuration-machine': Promise.resolve({ clientId })
      },
      guards: {
      },
      actions: {
        'Reset Unauth Count': () => { },
        'Read Ethernet Port Settings': () => { },
        'Read WiFi Endpoint Settings Pull Response': () => { },
        'Increment Retry Count': () => {}
      }
    }
  })

  describe('State machines', () => {
    it('should eventually reach "SUCCESS" state', (done) => {
      const mockNetworkConfigurationMachine = networkConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_GENERAL_SETTINGS',
        'ENUMERATE_ETHERNET_PORT_SETTINGS',
        'PULL_ETHERNET_PORT_SETTINGS',
        'WIRED_CONFIGURATION',
        'SUCCESS'
      ]
      const service = createActor(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
          done()
        }
      })
      service.start()
      service.raise({ type: 'NETWORKCONFIGURATION', clientId })
    })
    it('should eventually reach "FAILED" state for a device', (done) => {
      config.services['put-general-settings'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = networkConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_GENERAL_SETTINGS',
        'FAILED'
      ]
      const service = createActor(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Failed to update amt general settings on device')
          done()
        }
      })
      service.start()
      service.raise({ type: 'NETWORKCONFIGURATION', clientId })
    })
    it('should eventually reach "FAILED" state for a device', (done) => {
      config.services['enumerate-ethernet-port-settings'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = networkConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_GENERAL_SETTINGS',
        'ENUMERATE_ETHERNET_PORT_SETTINGS',
        'FAILED'
      ]
      const service = createActor(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Failed to get enumeration number to ethernet port settings')
          done()
        }
      })
      service.start()
      service.raise({ type: 'NETWORKCONFIGURATION', clientId })
    })
    it('should eventually reach "FAILED" state for a device', (done) => {
      config.services['pull-ethernet-port-settings'] = Promise.reject(new Error())
      const mockNetworkConfigurationMachine = networkConfig.machine.provide(config).withContext(context)
      const flowStates = [
        'ACTIVATION',
        'PUT_GENERAL_SETTINGS',
        'ENUMERATE_ETHERNET_PORT_SETTINGS',
        'PULL_ETHERNET_PORT_SETTINGS',
        'FAILED'
      ]
      const service = createActor(mockNetworkConfigurationMachine).onTransition((state) => {
        expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
        if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
          const status = devices[clientId].status.Network
          expect(status).toEqual('Failed to pull ethernet port settings')
          done()
        }
      })
      service.start()
      service.raise({ type: 'NETWORKCONFIGURATION', clientId })
    })
  })

  describe('Ethernet Port Settings', () => {
    test('should enumerate ethernet port settings', async () => {
      const ethernetPortSettingsSpy = jest.spyOn(context.amt.EthernetPortSettings, 'Enumerate').mockImplementation().mockReturnValue('abcdef')
      await networkConfig.enumerateEthernetPortSettings(context)
      expect(ethernetPortSettingsSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    test('should pull ethernet port settings', async () => {
      context.message = {
        Envelope: {
          Header: {},
          Body: {
            EnumerateResponse: {
              EnumerationContext: '09000000-0000-0000-0000-000000000000'
            }
          }
        }
      }
      const ethernetPortSettingsSpy = jest.spyOn(context.amt.EthernetPortSettings, 'Pull').mockImplementation().mockReturnValue('abcdef')
      await networkConfig.pullEthernetPortSettings(context)
      expect(ethernetPortSettingsSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    test('should read ethernet port settings pull response', () => {
      context.message = {
        Envelope: {
          Header: {},
          Body: {
            PullResponse: {
              Items: {
                AMT_EthernetPortSettings: [
                  {
                    DHCPEnabled: true,
                    ElementName: 'Intel(r) AMT Ethernet Port Settings',
                    InstanceID: 'Intel(r) AMT Ethernet Port Settings 0',
                    IpSyncEnabled: false
                  },
                  {
                    ElementName: 'Intel(r) AMT Ethernet Port Settings',
                    InstanceID: 'Intel(r) AMT Ethernet Port Settings 1',
                    MACAddress: '00-00-00-00-00-00'
                  }
                ]
              },
              EndOfSequence: ''
            }
          }
        }
      }
      networkConfig.readEthernetPortSettings(context, null)
      expect(context.wiredSettings).toBeDefined()
      expect(context.wifiSettings).toBeDefined()
    })
    test('should read ethernet port settings pull response', () => {
      context.message = {
        Envelope: {
          Header: {},
          Body: {
            PullResponse: {
              Items: {
                AMT_EthernetPortSettings: [
                  {
                    ElementName: 'Intel(r) AMT Ethernet Port Settings',
                    InstanceID: 'Intel(r) AMT Ethernet Port Settings 1'
                  },
                  {
                    DHCPEnabled: true,
                    ElementName: 'Intel(r) AMT Ethernet Port Settings',
                    InstanceID: 'Intel(r) AMT Ethernet Port Settings 0',
                    IpSyncEnabled: false
                  }
                ]
              }
            }
          }
        }
      }
      networkConfig.readEthernetPortSettings(context, null)
      expect(context.wiredSettings).toBeDefined()
      expect(context.wifiSettings).toBeDefined()
    })
    test('should read ethernet port settings pull response for wireless only device', () => {
      context.wiredSettings = null
      context.message = {
        Envelope: {
          Header: {},
          Body: {
            PullResponse: {
              Items: {
                AMT_EthernetPortSettings: {
                  ElementName: 'Intel(r) AMT Ethernet Port Settings',
                  InstanceID: 'Intel(r) AMT Ethernet Port Settings 1'
                }
              }
            }
          }
        }
      }
      networkConfig.readEthernetPortSettings(context, null)
      expect(context.wiredSettings).toBeNull()
      expect(context.wifiSettings).toBeDefined()
    })
    test('should read ethernet port settings pull response for wired only device', () => {
      context.wirelessSettings = null
      context.message = {
        Envelope: {
          Header: {},
          Body: {
            PullResponse: {
              Items: {
                AMT_EthernetPortSettings: {
                  ElementName: 'Intel(r) AMT Ethernet Port Settings',
                  InstanceID: 'Intel(r) AMT Ethernet Port Settings 0'
                }
              }
            }
          }
        }
      }
      networkConfig.readEthernetPortSettings(context, null)
      expect(context.wifiSettings).toBeUndefined()
      expect(context.wiredSettings).toBeDefined()
    })
  })

  describe('AMT General Settings', () => {
    let generalSettingsResponse
    beforeEach(() => {
      generalSettingsResponse = {
        AMTNetworkEnabled: 1,
        InstanceID: 'Intel(r) AMT: General Settings',
        NetworkInterfaceEnabled: true,
        RmcpPingResponseEnabled: true,
        SharedFQDN: true
      }
    })
    test('should put amt general settings', async () => {
      context.generalSettings = {
        AMTNetworkEnabled: 1,
        InstanceID: 'Intel(r) AMT: General Settings',
        NetworkInterfaceEnabled: true,
        RmcpPingResponseEnabled: true,
        SharedFQDN: true
      }
      const generalSettingsSpy = jest.spyOn(context.amt.GeneralSettings, 'Put').mockReturnValue('done')
      await networkConfig.putGeneralSettings(context)
      expect(generalSettingsSpy).toHaveBeenCalled()
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    test('Should return false if AMT network is Enabled', async () => {
      context.generalSettings = generalSettingsResponse
      const result = networkConfig.isNotAMTNetworkEnabled(context, null)
      expect(result).toBeFalsy()
    })
    test('Should return true if AMT network is Enabled', async () => {
      context.generalSettings = generalSettingsResponse
      context.generalSettings.SharedFQDN = false
      const result = networkConfig.isNotAMTNetworkEnabled(context, null)
      expect(result).toBeTruthy()
    })
  })
})
