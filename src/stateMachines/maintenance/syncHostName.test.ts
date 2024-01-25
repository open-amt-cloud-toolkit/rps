/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { HttpResponseError, commonContext, coalesceMessage } from './common.js'
import { type DoneResponse, StatusFailed } from './doneResponse.js'
import { config, setupTestClient } from '../../test/helper/Config.js'
import { runTilDone } from '../../test/helper/xstate.js'
import { Environment } from '../../utils/Environment.js'
import { jest } from '@jest/globals'

import { type HostNameInfo, type SyncHostName as SyncHostNameType, type SyncHostNameEvent } from './syncHostName.js'

const invokeWsmanCallSpy = jest.fn<any>()
jest.unstable_mockModule('./common.js', () => ({
  invokeWsmanCall: invokeWsmanCallSpy,
  HttpResponseError,
  commonContext,
  coalesceMessage
}))

const { SyncHostName, SyncHostNameEventType } = await import ('./syncHostName.js')

jest.mock('got')

Environment.Config = config

const HttpBadRequestError = new HttpResponseError('Bad Request', 400)

let clientId: string
let doneResponse: DoneResponse
let event: SyncHostNameEvent
let implementation: SyncHostNameType
let hostNameInfo: HostNameInfo
let generalSettingsRsp: AMT.Models.GeneralSettingsResponse
let putRsp: any
let mpsRsp: any

beforeEach(() => {
  jest.resetAllMocks()
  clientId = setupTestClient()
  implementation = new SyncHostName()
  doneResponse = {
    taskName: implementation.machine.context.taskName,
    status: 'SUCCESS',
    message: expect.any(String)
  }
  hostNameInfo = {
    hostname: 'new.host.com',
    dnsSuffixOS: 'new.suffix.com'
  }
  generalSettingsRsp = {
    AMT_GeneralSettings: {
      HostName: 'old.host.com'
    }
  }
  putRsp = {
    AMT_GeneralSettings: {
      HostName: hostNameInfo.hostname
    }
  }
  mpsRsp = {
    statusCode: 200,
    statusMessage: 'OK'
  }
  event = { type: SyncHostNameEventType, clientId, hostNameInfo }
})

const runTheTest = async function (): Promise<void> {
  invokeWsmanCallSpy
    .mockResolvedValueOnce(generalSettingsRsp)
    .mockResolvedValueOnce(putRsp)
  // spyOn(gotClient, 'patch').mockResolvedValue(mpsRsp)
  await runTilDone(implementation.machine, event, doneResponse)
}

it('should succeed synchronizing host name', async () => {
  await runTheTest()
})
it('should fail on bad general settings response', async () => {
  delete generalSettingsRsp.AMT_GeneralSettings
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail on invalid hostname', async () => {
  delete hostNameInfo.hostname
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should "fail" if already synchronized invalid hostname', async () => {
  hostNameInfo.hostname = generalSettingsRsp.AMT_GeneralSettings.HostName
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail put on bad AMT_GeneralSettings response', async () => {
  delete putRsp.AMT_GeneralSettings
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail on bad response from MPS', async () => {
  mpsRsp.statusCode = 404
  mpsRsp.statusMessage = 'Device not found'
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail getting general settings on http response error', async () => {
  doneResponse.status = StatusFailed
  invokeWsmanCallSpy.mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should fail put response on http response error', async () => {
  doneResponse.status = StatusFailed
  invokeWsmanCallSpy
    .mockResolvedValueOnce(generalSettingsRsp)
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
