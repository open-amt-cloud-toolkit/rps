/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import * as common from './common'
import { HttpResponseError } from './common'
import got from 'got'
import { type DoneResponse, StatusFailed } from './doneResponse'
import { config, setupTestClient } from '../../test/helper/Config'
import { runTilDone } from '../../test/helper/xstate'
import { type DeviceInfo, SyncDeviceInfo, type SyncDeviceInfoEvent, SyncDeviceInfoEventType } from './syncDeviceInfo'
import { Environment } from '../../utils/Environment'
import resetAllMocks = jest.resetAllMocks

jest.mock('got')

Environment.Config = config

const HttpBadRequestError = new HttpResponseError('Bad Request', 400)

let clientId: string
let doneResponse: DoneResponse
let event: SyncDeviceInfoEvent
let implementation: SyncDeviceInfo
let deviceInfo: DeviceInfo
let mpsRsp: any

beforeEach(() => {
  resetAllMocks()
  clientId = setupTestClient()
  implementation = new SyncDeviceInfo()
  doneResponse = {
    taskName: implementation.machine.context.taskName,
    status: 'SUCCESS',
    message: expect.any(String)
  }
  deviceInfo = {
    ver: '16.1.1',
    build: '1111',
    sku: '16xxx',
    currentMode: '0',
    features: 'AMT Pro Corprate',
    ipConfiguration: { ipAddress: '1.1.1.1' }
  }
  mpsRsp = {
    statusCode: 200,
    statusMessage: 'OK'
  }
  event = { type: SyncDeviceInfoEventType, clientId, deviceInfo }
})

const runTheTest = async function (): Promise<void> {
  jest.spyOn(got, 'patch').mockResolvedValue(mpsRsp)
  await runTilDone(implementation.machine, event, doneResponse)
}

it('should succeed synchronizing device info', async () => {
  await runTheTest()
})

it('should fail on bad response from MPS', async () => {
  mpsRsp.statusCode = 404
  mpsRsp.statusMessage = 'Device not found'
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail put response on http response error', async () => {
  doneResponse.status = StatusFailed
  jest.spyOn(common, 'invokeWsmanCall')
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
