/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type Enumerate } from '@open-amt-cloud-toolkit/wsman-messages/models/common'
import { type AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import * as common from './common'
import { HttpResponseError } from './common'
import { type DoneResponse, StatusFailed, StatusSuccess } from './doneResponse'
import { UnexpectedParseError } from '../../utils/constants'
import {
  type EthernetPortSettingsPullResponse,
  type IPConfiguration,
  MessageAlreadySynchronized,
  MessageNoWiredSettingsOnDevice,
  MessageWirelessOnly,
  SyncIP,
  type SyncIPEvent, SyncIPEventType
} from './syncIP'
import { runTilDone } from '../../test/helper/xstate'
import { setupTestClient } from '../../test/helper/Config'
import resetAllMocks = jest.resetAllMocks

const HttpBadRequestError = new HttpResponseError('Bad Request', 400)

let clientId: string
let doneResponse: DoneResponse
let event: SyncIPEvent
let implementation: SyncIP
let targetIPConfig: IPConfiguration
let enumerateRsp: Enumerate
let wiredPortSettings: AMT.Models.EthernetPortSettings
let wirelessPortSettings: AMT.Models.EthernetPortSettings
let pullRsp: EthernetPortSettingsPullResponse
let putRsp: any

beforeEach(() => {
  resetAllMocks()
  clientId = setupTestClient()
  implementation = new SyncIP()
  doneResponse = {
    taskName: implementation.machine.context.taskName,
    status: 'SUCCESS',
    message: expect.any(String)
  }
  enumerateRsp = {
    EnumerateResponse: {
      EnumerationContext: 'ABCDEF0123456789'
    }
  }
  targetIPConfig = {
    ipAddress: '192.168.1.100',
    netmask: '',
    gateway: '',
    primaryDns: '',
    secondaryDns: ''
  }
  wiredPortSettings = {
    ElementName: 'Intel(r) AMT Ethernet Port Settings',
    InstanceID: 'Intel(r) AMT Ethernet Port Settings 0',
    IpSyncEnabled: true,
    LinkIsUp: true,
    LinkPolicy: [1, 14, 16],
    MACAddress: '70-b5-e8-61-f5-20',
    PhysicalConnectionType: 0,
    DHCPEnabled: false,
    SharedStaticIp: true,
    IPAddress: '192.168.1.80',
    SubnetMask: '255.255.255.0',
    DefaultGateway: '192.168.1.1',
    PrimaryDNS: '192.168.1.1',
    SecondaryDNS: '192.168.1.1'
  }
  wirelessPortSettings = {
    ConsoleTcpMaxRetransmissions: 5,
    DHCPEnabled: true,
    ElementName: 'Intel(r) AMT Ethernet Port Settings',
    InstanceID: 'Intel(r) AMT Ethernet Port Settings 1',
    LinkControl: 2,
    LinkIsUp: false,
    LinkPolicy: [1, 14, 16],
    LinkPreference: 2,
    MACAddress: '00-00-00-00-00-00',
    PhysicalConnectionType: 3,
    SharedMAC: true,
    WLANLinkProtectionLevel: 1
  }
  pullRsp = {
    PullResponse: {
      Items: {
        AMT_EthernetPortSettings: [wiredPortSettings, wirelessPortSettings]
      },
      EndOfSequence: 'EOS'
    }
  }
  putRsp = wiredPortSettings
  event = { type: SyncIPEventType, clientId, targetIPConfig }
})

const runTheTest = async function (): Promise<void> {
  jest.spyOn(common, 'invokeWsmanCall')
    .mockResolvedValueOnce(enumerateRsp)
    .mockResolvedValueOnce(pullRsp)
    .mockResolvedValueOnce(putRsp)
  await runTilDone(implementation.machine, event, doneResponse)
}

it('should succeed synchronizing static ip', async () => {
  doneResponse.status = StatusSuccess
  await runTheTest()
})
it('should succeed synchronizing DHCP', async () => {
  wiredPortSettings.DHCPEnabled = true
  doneResponse.status = StatusSuccess
  await runTheTest()
})
it('should fail missing event.targetIPConfig.ipAddress', async () => {
  delete event.targetIPConfig.ipAddress
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail missing event.targetIPConfig', async () => {
  // need this twice to hit all the branches in
  delete event.targetIPConfig
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail missing enumerateRsp.EnumerateResponse', async () => {
  delete enumerateRsp.EnumerateResponse
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail missing pullRsp.PullResponse.Items.AMT_EthernetPortSettings', async () => {
  delete pullRsp.PullResponse.Items.AMT_EthernetPortSettings
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail missing pullRsp.PullResponse.Items', async () => {
  delete pullRsp.PullResponse.Items
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail missing pullRsp.PullResponse', async () => {
  delete pullRsp.PullResponse
  doneResponse.status = StatusFailed
  await runTheTest()
})
it(`should fail on ${MessageNoWiredSettingsOnDevice}`, async () => {
  pullRsp.PullResponse.Items.AMT_EthernetPortSettings = wirelessPortSettings
  doneResponse.status = StatusFailed
  await runTheTest()
})
it(`should fail on ${MessageWirelessOnly}`, async () => {
  wiredPortSettings.MACAddress = null
  doneResponse.status = StatusFailed
  await runTheTest()
})
it(`should fail on ${MessageAlreadySynchronized}`, async () => {
  targetIPConfig.ipAddress = wiredPortSettings.IPAddress
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail on bad put response', async () => {
  putRsp = null
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail enumerate response on http response error', async () => {
  doneResponse.status = StatusFailed
  jest.spyOn(common, 'invokeWsmanCall')
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should fail pull response on http response error', async () => {
  doneResponse.status = StatusFailed
  jest.spyOn(common, 'invokeWsmanCall')
    .mockResolvedValueOnce(enumerateRsp)
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should fail put response on http response error', async () => {
  doneResponse.status = StatusFailed
  jest.spyOn(common, 'invokeWsmanCall')
    .mockResolvedValueOnce(enumerateRsp)
    .mockResolvedValueOnce(pullRsp)
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should succeed after UnexpectedParseError', async () => {
  doneResponse.status = StatusSuccess
  jest.spyOn(common, 'invokeWsmanCall')
    .mockResolvedValueOnce(enumerateRsp)
    .mockRejectedValueOnce(new UnexpectedParseError())
    .mockResolvedValueOnce(enumerateRsp)
    .mockRejectedValueOnce(new UnexpectedParseError())
    .mockResolvedValueOnce(enumerateRsp)
    .mockResolvedValueOnce(pullRsp)
    .mockResolvedValueOnce(putRsp)
  await runTilDone(implementation.machine, event, doneResponse)
})
