/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type Enumerate } from '@open-amt-cloud-toolkit/wsman-messages/models/common.js'
import { type AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { type DoneResponse, StatusFailed, StatusSuccess } from './doneResponse.js'
import { UnexpectedParseError } from '../../utils/constants.js'
import { runTilDone } from '../../test/helper/xstate.js'
import { setupTestClient } from '../../test/helper/Config.js'
import { jest } from '@jest/globals'

import {
  HttpResponseError,
  coalesceMessage,
  commonActions,
  commonContext,
  commonGuards
} from './common.js'

import {
  type EthernetPortSettingsPullResponse,
  type IPConfiguration,
  type SyncIPEvent,
  type SyncIP as SyncIPType
} from './syncIP.js'

const invokeWsmanCallSpy = jest.fn<any>()
jest.unstable_mockModule('./common.js', () => ({
  invokeWsmanCall: invokeWsmanCallSpy,
  HttpResponseError,
  coalesceMessage,
  commonActions,
  commonContext,
  commonGuards
}))

const {
  MessageAlreadySynchronized,
  MessageNoWiredSettingsOnDevice,
  MessageWirelessOnly,
  SyncIP,
  SyncIPEventType
} = await import ('./syncIP.js')

const HttpBadRequestError = new HttpResponseError('Bad Request', 400)

let clientId: string
let doneResponse: DoneResponse
let event: SyncIPEvent
let implementation: SyncIPType
let targetIPConfig: IPConfiguration
let enumerateRsp: Enumerate
let wiredPortSettings: AMT.Models.EthernetPortSettings
let wirelessPortSettings: AMT.Models.EthernetPortSettings
let pullRsp: EthernetPortSettingsPullResponse
let putRsp: any

beforeEach(() => {
  jest.resetAllMocks()
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
  invokeWsmanCallSpy
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
  const { ipAddress, ...newTargetIPConfig } = targetIPConfig
  event.targetIPConfig = newTargetIPConfig as any
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
  const { EnumerateResponse, ...newEnumRsp } = enumerateRsp
  enumerateRsp = newEnumRsp as any
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail missing pullRsp.PullResponse.Items.AMT_EthernetPortSettings', async () => {
  pullRsp.PullResponse = { EndOfSequence: 'EOS' } as any
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail missing pullRsp.PullResponse.Items', async () => {
  const { Items, ...newPullResponse } = pullRsp.PullResponse
  pullRsp.PullResponse = newPullResponse as any
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail missing pullRsp.PullResponse', async () => {
  const { PullResponse, ...newPullRsp } = pullRsp
  pullRsp = newPullRsp as any
  doneResponse.status = StatusFailed
  await runTheTest()
})
it(`should fail on ${MessageNoWiredSettingsOnDevice}`, async () => {
  pullRsp.PullResponse.Items.AMT_EthernetPortSettings = wirelessPortSettings
  doneResponse.status = StatusFailed
  await runTheTest()
})
it(`should fail on ${MessageWirelessOnly}`, async () => {
  wiredPortSettings.MACAddress = null as any
  doneResponse.status = StatusFailed
  await runTheTest()
})
it(`should fail on ${MessageAlreadySynchronized}`, async () => {
  targetIPConfig.ipAddress = wiredPortSettings.IPAddress as any
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
  invokeWsmanCallSpy
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should fail pull response on http response error', async () => {
  doneResponse.status = StatusFailed
  invokeWsmanCallSpy
    .mockResolvedValueOnce(enumerateRsp)
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should fail put response on http response error', async () => {
  doneResponse.status = StatusFailed
  invokeWsmanCallSpy
    .mockResolvedValueOnce(enumerateRsp)
    .mockResolvedValueOnce(pullRsp)
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should succeed after UnexpectedParseError', async () => {
  doneResponse.status = StatusSuccess
  invokeWsmanCallSpy
    .mockResolvedValueOnce(enumerateRsp)
    .mockRejectedValueOnce(new UnexpectedParseError())
    .mockResolvedValueOnce(enumerateRsp)
    .mockRejectedValueOnce(new UnexpectedParseError())
    .mockResolvedValueOnce(enumerateRsp)
    .mockResolvedValueOnce(pullRsp)
    .mockResolvedValueOnce(putRsp)
  await runTilDone(implementation.machine, event, doneResponse)
})
