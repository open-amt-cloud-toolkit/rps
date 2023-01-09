/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { interpret } from 'xstate'
import { HttpHandler } from '../HttpHandler'
import { devices } from '../WebSocketListener'
import * as common from './common'
import { SyncIP } from './syncIP'

describe('TLS State Machine', () => {
  let ipMachine: SyncIP
  let config
  let context
  let currentStateIndex = 0
  let invokeWsmanCallSpy: jest.SpyInstance

  const clientId = '4c4c4544-004b-4210-8033-b6c04f504633'
  beforeEach(() => {
    currentStateIndex = 0
    devices[clientId] = {
      status: {},
      ClientSocket: { send: jest.fn() },
      tls: {}
    } as any
    context = {
      clientId,
      httpHandler: new HttpHandler(),
      message: null,
      xmlMessage: '',
      errorMessage: '',
      statusMessage: '',
      status: 'success',
      ipConfiguration: {
        ipaddress: '192.168.1.180',
        netmask: '255.255.255.0',
        gateway: '',
        primarydns: '',
        secondarydns: ''
      }
    }
    ipMachine = new SyncIP()
    invokeWsmanCallSpy = jest.spyOn(common, 'invokeWsmanCall').mockResolvedValue()
    config = {
      services: {
        'enumerate-ethernet-port-settings': Promise.resolve({
          Envelope: { Body: { EnumerateResponse: { EnumerationContext: '09000000-0000-0000-0000-000000000000' } } }
        }),
        'pull-ethernet-port-settings': Promise.resolve({
          Envelope: {
            Header: {},
            Body: {
              PullResponse: {
                Items: {
                  AMT_EthernetPortSettings: [
                    { DHCPEnabled: true, ElementName: 'Intel(r) AMT Ethernet Port Settings', InstanceID: 'Intel(r) AMT Ethernet Port Settings 0', IpSyncEnabled: false, MACAddress: 'a4-bb-6d-89-52-e4', SharedStaticIp: true },
                    { ElementName: 'Intel(r) AMT Ethernet Port Settings', InstanceID: 'Intel(r) AMT Ethernet Port Settings 1', MACAddress: '00-00-00-00-00-00' }
                  ]
                }
              }
            }
          }
        })
      },
      guards: {
        isNotIPAddressMatched: (context, event) => true
      }
    }
  })
  it('should eventually reach "SUCCESS" state', (done) => {
    const mockIPMachine = ipMachine.machine.withConfig(config).withContext(context)
    const flowStates = [
      'OS_SYNC_IP',
      'ENUMERATE_ETHERNET_PORT_SETTINGS',
      'PULL_ETHERNET_PORT_SETTINGS',
      'PUT_ETHERNET_PORT_SETTINGS',
      'SUCCESS'
    ]
    const service = interpret(mockIPMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
        done()
      }
    })
    service.start()
    service.send({ type: 'SYNC_IP', clientId, data: null })
  })
  it('should enumerateEthernetPortSettings', async () => {
    await ipMachine.enumerateEthernetPortSettings(context)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should pullEthernetPortSettings', async () => {
    context.message = {
      Envelope: { Body: { EnumerateResponse: { EnumerationContext: '09000000-0000-0000-0000-000000000000' } } }
    }
    await ipMachine.pullEthernetPortSettings(context)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should readEthernetPortSettings', async () => {
    context.message = {
      Envelope: {
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
    }
    ipMachine.readEthernetPortSettings(context)
    expect(context.wiredSettings).not.toBeNull()
    expect(context.wirelessSettings).not.toBeNull()
  })
  it('should readEthernetPortSettings - array order changes', async () => {
    context.message = {
      Envelope: {
        Body: {
          PullResponse: {
            Items: {
              AMT_EthernetPortSettings: [
                { ElementName: 'Intel(r) AMT Ethernet Port Settings', InstanceID: 'Intel(r) AMT Ethernet Port Settings 1', MACAddress: '00-00-00-00-00-00' },
                { DHCPEnabled: true, ElementName: 'Intel(r) AMT Ethernet Port Settings', InstanceID: 'Intel(r) AMT Ethernet Port Settings 0', IpSyncEnabled: false }
              ]
            }
          }
        }
      }
    }
    ipMachine.readEthernetPortSettings(context)
    expect(context.wiredSettings).not.toBeNull()
    expect(context.wirelessSettings).not.toBeNull()
  })
  it('should readEthernetPortSettings for only wired device', async () => {
    context.wirelessSettings = null
    context.wiredSettings = null
    context.message = {
      Envelope: {
        Body: {
          PullResponse: {
            Items: {
              AMT_EthernetPortSettings: { ElementName: 'Intel(r) AMT Ethernet Port Settings', InstanceID: 'Intel(r) AMT Ethernet Port Settings 1', MACAddress: '00-00-00-00-00-00' }
            }
          }
        }
      }
    }
    ipMachine.readEthernetPortSettings(context)
    expect(context.wirelessSettings).not.toBeNull()
    expect(context.wiredSettings).toBeNull()
  })
  it('should readEthernetPortSettings for wireless deivces only', async () => {
    context.wiredSettings = null
    context.wirelessSettings = null
    context.message = {
      Envelope: {
        Body: {
          PullResponse: {
            Items: {
              AMT_EthernetPortSettings: { DHCPEnabled: true, ElementName: 'Intel(r) AMT Ethernet Port Settings', InstanceID: 'Intel(r) AMT Ethernet Port Settings 0', IpSyncEnabled: false }
            }
          }
        }
      }
    }
    ipMachine.readEthernetPortSettings(context)
    expect(context.wirelessSettings).toBeNull()
    expect(context.wiredSettings).not.toBeNull()
  })

  it('should putEthernetPortSettings', async () => {
    context.wiredSettings = {
      DHCPEnabled: false,
      IpSyncEnabled: true,
      SharedStaticIp: true,
      IPAddress: '192.168.1.80',
      SubnetMask: '255.255.255.0',
      DefaultGateway: '192.168.1.1',
      PrimaryDNS: '192.168.1.1',
      SecondaryDNS: '192.168.1.1'
    }
    await ipMachine.putEthernetPortSettings(context)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
})
