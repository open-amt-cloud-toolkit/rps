/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import * as common from './common'
import { HttpResponseError } from './common'
import got from 'got'
import { type DoneResponse, StatusFailed } from './doneResponse'
import { config, setupTestClient } from '../../test/helper/Config'
import { runTilDone } from '../../test/helper/xstate'
import { type HostNameInfo, SyncHostName, type SyncHostNameEvent, SyncHostNameEventType } from './syncHostName'
import { Environment } from '../../utils/Environment'
import resetAllMocks = jest.resetAllMocks

jest.mock('got')

Environment.Config = config

const HttpBadRequestError = new HttpResponseError('Bad Request', 400)

let clientId: string
let doneResponse: DoneResponse
let event: SyncHostNameEvent
let implementation: SyncHostName
let hostNameInfo: HostNameInfo
let generalSettingsRsp: AMT.Models.GeneralSettingsResponse
let putRsp: any
let mpsRsp: any

beforeEach(() => {
  resetAllMocks()
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
  jest.spyOn(common, 'invokeWsmanCall')
    .mockResolvedValueOnce(generalSettingsRsp)
    .mockResolvedValueOnce(putRsp)
  jest.spyOn(got, 'patch').mockResolvedValue(mpsRsp)
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
  jest.spyOn(common, 'invokeWsmanCall')
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should fail put response on http response error', async () => {
  doneResponse.status = StatusFailed
  jest.spyOn(common, 'invokeWsmanCall')
    .mockResolvedValueOnce(generalSettingsRsp)
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
