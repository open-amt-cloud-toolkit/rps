import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'
import { EnvReader } from '../utils/EnvReader'
import { config } from '../test/helper/Config'
// import { SignatureHelper } from '../utils/SignatureHelper'
import { ClientAction } from '../models/RCS.Config'
// import { Configurator } from '../Configurator'
import { NetworkConfiguration } from './networkConfiguration'

const clientId = uuid()
EnvReader.GlobalEnvConfig = config
// const configurator = new Configurator()

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
  activationStatus: {},
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

describe('Get profiles', () => {
  let networkConfiguration
  let context
  let AMTProfile
  beforeEach(() => {
    networkConfiguration = new NetworkConfiguration()
    context = { amtProfile: null, wifiProfiles: [], wifiProfileCount: 0, message: '', clientId: clientId, xmlMessage: '', response: '', status: 'wsman', errorMessage: '' }
    AMTProfile = {
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
  })
  test('should return WiFi Profile', async () => {
    context.amtProfile = AMTProfile
    const expectedProfile = {
      profileName: 'home',
      authenticationMethod: 4,
      encryptionMethod: 4,
      ssid: 'test',
      pskPassphrase: 'Intel@123',
      linkPolicy: [14, 16]
    }
    networkConfiguration.db = await networkConfiguration.dbFactory.getDb()
    const getgetByNameSpy = jest.spyOn(networkConfiguration.db.wirelessProfiles, 'getByName').mockImplementation(async () => {
      return expectedProfile
    })
    const getPSKPassphraseSpy = jest.spyOn(networkConfiguration.configurator.secretsManager, 'getSecretAtPath').mockImplementation(async () => {
      return { data: { PSK_PASSPHRASE: 'Intel@123' } }
    })

    const wifiProfile = await networkConfiguration.getWifiProfile(context, null)
    expect(wifiProfile).toBe(expectedProfile)
    expect(getPSKPassphraseSpy).toHaveBeenCalled()
    expect(getgetByNameSpy).toHaveBeenCalled()
  })
})

describe('Ethernet Port Settings', () => {
  let networkConfiguration
  let context
  let AMTProfile
  let invokeWsmanCallSpy
  let ethernetPortSettingsSpy
  beforeEach(() => {
    networkConfiguration = new NetworkConfiguration()
    invokeWsmanCallSpy = jest.spyOn(networkConfiguration, 'invokeWsmanCall').mockImplementation().mockResolvedValue('done')
    ethernetPortSettingsSpy = jest.spyOn(networkConfiguration.amt, 'EthernetPortSettings').mockImplementation().mockReturnValue('abcdef')
    context = { amtProfile: null, wifiProfiles: [], wifiProfileCount: 0, message: '', clientId: clientId, xmlMessage: '', response: '', status: 'wsman', errorMessage: '' }
    AMTProfile = {
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
  })
  test('should enumerate ethernet port settings', async () => {
    await networkConfiguration.enumerateEthernetPortSettings(context)
    expect(ethernetPortSettingsSpy).toHaveBeenCalled()
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  test('should pull ethernet port settings', async () => {
    context.response = {
      Envelope: {
        Header: {},
        Body: {
          EnumerateResponse: {
            EnumerationContext: '09000000-0000-0000-0000-000000000000'
          }
        }
      }
    }
    await networkConfiguration.pullEthernetPortSettings(context)
    expect(ethernetPortSettingsSpy).toHaveBeenCalled()
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  test('should read ethernet port settings pull response', async () => {
    context.response = {
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
    await networkConfiguration.readEthernetPortSettings(context)
    expect(context.wiredSettings).toBeDefined()
    expect(context.wireLessSettings).toBeDefined()
  })

  test('should read ethernet port settings pull response', async () => {
    context.response = {
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
    await networkConfiguration.readEthernetPortSettings(context)
    expect(context.wiredSettings).toBeDefined()
    expect(context.wireLessSettings).toBeDefined()
  })
  test('should read ethernet port settings pull response for wireless only device', async () => {
    context.wiredSettings = null
    context.response = {
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
    await networkConfiguration.readEthernetPortSettings(context)
    expect(context.wiredSettings).toBeNull()
    expect(context.wireLessSettings).toBeDefined()
  })
  test('should read ethernet port settings pull response for wired only device', async () => {
    context.wireLessSettings = null
    context.response = {
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
    await networkConfiguration.readEthernetPortSettings(context)
    expect(context.wireLessSettings).toBeNull()
    expect(context.wiredSettings).toBeDefined()
  })
  test('should put ethernet port settings', async () => {
    context.amtProfile = AMTProfile
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
    await networkConfiguration.putEthernetPortSettings(context)
    expect(ethernetPortSettingsSpy).toHaveBeenCalled()
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
})

describe('WiFi Port Configuration Service', () => {
  let networkConfiguration
  let context
  let invokeWsmanCallSpy
  let WiFiPortConfigurationServiceSpy
  let getWifiProfileSpy
  beforeEach(() => {
    networkConfiguration = new NetworkConfiguration()
    context = { amtProfile: null, wifiProfiles: [], wifiProfileCount: 0, message: '', clientId: clientId, xmlMessage: '', response: '', status: 'wsman', errorMessage: '' }
    invokeWsmanCallSpy = jest.spyOn(networkConfiguration, 'invokeWsmanCall').mockImplementation().mockResolvedValue('done')
    WiFiPortConfigurationServiceSpy = jest.spyOn(networkConfiguration.amt, 'WiFiPortConfigurationService').mockImplementation().mockResolvedValue('done')
    getWifiProfileSpy = jest.spyOn(networkConfiguration, 'getWifiProfile').mockImplementation(async () => {
      return {
        profileName: 'home',
        authenticationMethod: 4,
        encryptionMethod: 4,
        ssid: 'test',
        pskPassphrase: 'Intel@123',
        linkPolicy: [14, 16]
      }
    })
  })
  test('should get WiFi Port Configuration Service', async () => {
    await networkConfiguration.getWiFiPortConfigurationService(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
    expect(WiFiPortConfigurationServiceSpy).toHaveBeenCalled()
  })
  test('should return WiFi Profiles', async () => {
    context.response = {
      Envelope: {
        Header: { },
        Body: { AMT_WiFiPortConfigurationService: { localProfileSynchronizationEnabled: 1 } }
      }
    }
    await networkConfiguration.putWiFiPortConfigurationService(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
    expect(WiFiPortConfigurationServiceSpy).toHaveBeenCalled()
  })
  test('should add a WiFi Profile to AMT', async () => {
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
    await networkConfiguration.addWifiConfigs(context, null)
    expect(getWifiProfileSpy).toHaveBeenCalled()
    expect(WiFiPortConfigurationServiceSpy).toHaveBeenCalled()
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
})

describe('WiFi Endpoint Settings', () => {
  let networkConfiguration
  let context
  let invokeWsmanCallSpy
  let WiFiEndpointSettingsSpy
  beforeEach(() => {
    networkConfiguration = new NetworkConfiguration()
    context = { amtProfile: null, wifiProfiles: [], wifiProfileCount: 0, message: '', clientId: clientId, xmlMessage: '', response: '', status: 'wsman', errorMessage: '', wifiEndPointSettings: [] }
    invokeWsmanCallSpy = jest.spyOn(networkConfiguration, 'invokeWsmanCall').mockImplementation().mockResolvedValue('done')
    WiFiEndpointSettingsSpy = jest.spyOn(networkConfiguration.cim, 'WiFiEndpointSettings').mockImplementation().mockResolvedValue('done')
  })
  test('should get enumeration number for WiFi end point settings', async () => {
    await networkConfiguration.enumerateWiFiEndpointSettings(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
    expect(WiFiEndpointSettingsSpy).toHaveBeenCalled()
  })
  test('should pull WiFi end point settings', async () => {
    context.response = {
      Envelope: {
        Header: {
          Action: { _: 'http://schemas.xmlsoap.org/ws/2004/09/enumeration/EnumerateResponse' },
          ResourceURI: 'http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_WiFiEndpointSettings'
        },
        Body: { EnumerateResponse: { EnumerationContext: '92340000-0000-0000-0000-000000000000' } }
      }
    }
    await networkConfiguration.pullWiFiEndpointSettings(context, null)
    expect(WiFiEndpointSettingsSpy).toHaveBeenCalled()
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  test('Should read WiFi end point settings, if CIM_WiFiEndpointSettings is an array', async () => {
    context.response = {
      Envelope: {
        Header: {},
        Body: { PullResponse: { Items: { CIM_WiFiEndpointSettings: [{ InstanceID: 'home', Priority: 1 }, { InstanceID: 'office', Priority: 2 }] } } }
      }
    }
    await networkConfiguration.readWiFiEndpointSettingsPullResponse(context, null)
    expect(context.wifiEndPointSettings.length).toBe(2)
  })
  test('Should read WiFi end point settings', async () => {
    context.response = {
      Envelope: {
        Header: {},
        Body: { PullResponse: { Items: { CIM_WiFiEndpointSettings: { InstanceID: 'home', Priority: 1 } } } }
      }
    }
    await networkConfiguration.readWiFiEndpointSettingsPullResponse(context, null)
    expect(context.wifiEndPointSettings.length).toBe(1)
  })
  test('Should delete profile from WiFi end point settings', async () => {
    context.wifiEndPointSettings = [{ InstanceID: 'home', Priority: 1 }]
    await networkConfiguration.deleteWiFiProfileOnAMTDevice(context, null)
    expect(context.wifiEndPointSettings.length).toBe(0)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
    expect(WiFiEndpointSettingsSpy).toHaveBeenCalled()
  })
})

describe('AMT General Settings', () => {
  let networkConfiguration
  let context
  let invokeWsmanCallSpy
  let generalSettingsSpy
  let generalSettingsResponse
  beforeEach(() => {
    networkConfiguration = new NetworkConfiguration()
    context = { amtProfile: null, wifiProfiles: [], wifiProfileCount: 0, message: '', clientId: clientId, xmlMessage: '', response: '', status: 'wsman', errorMessage: '', wifiEndPointSettings: [] }
    invokeWsmanCallSpy = jest.spyOn(networkConfiguration, 'invokeWsmanCall').mockImplementation().mockResolvedValue('done')
    generalSettingsSpy = jest.spyOn(networkConfiguration.amt, 'GeneralSettings').mockImplementation().mockResolvedValue('done')
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
    await networkConfiguration.putGeneralSettings(context, null)
    expect(generalSettingsSpy).toHaveBeenCalled()
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  test('Should return false if AMT network is Enabled', async () => {
    context.generalSettings = generalSettingsResponse
    const result = await networkConfiguration.isNotAMTNetworkEnabled(context, null)
    expect(result).toBeFalsy()
  })
  test('Should return true if AMT network is Enabled', async () => {
    context.generalSettings = generalSettingsResponse
    context.generalSettings.SharedFQDN = false
    const result = await networkConfiguration.isNotAMTNetworkEnabled(context, null)
    expect(result).toBeTruthy()
  })
})

describe('CIM WiFi Port', () => {
  let networkConfiguration
  let context
  let invokeWsmanCallSpy
  let wifiPortSpy
  beforeEach(() => {
    networkConfiguration = new NetworkConfiguration()
    context = { amtProfile: null, wifiProfiles: [], wifiProfileCount: 0, message: '', clientId: clientId, xmlMessage: '', response: '', status: 'wsman', errorMessage: '', wifiEndPointSettings: [] }
    invokeWsmanCallSpy = jest.spyOn(networkConfiguration, 'invokeWsmanCall').mockImplementation().mockResolvedValue('done')
    wifiPortSpy = jest.spyOn(networkConfiguration.cim, 'WiFiPort').mockImplementation().mockResolvedValue('done')
  })
  test('should update wifi port', async () => {
    await networkConfiguration.updateWifiPort(context, null)
    expect(wifiPortSpy).toHaveBeenCalled()
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
})
