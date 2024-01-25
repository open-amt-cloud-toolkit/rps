/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type DoneResponse, StatusFailed } from './doneResponse.js'
import { config, setupTestClient } from '../../test/helper/Config.js'
import { runTilDone } from '../../test/helper/xstate.js'
import { Environment } from '../../utils/Environment.js'
import { jest } from '@jest/globals'
import { type SpyInstance, spyOn } from 'jest-mock'
import got from 'got'

import {
  coalesceMessage,
  commonContext,
  HttpResponseError
} from './common.js'

import {
  type DeviceInfo,
  type SyncDeviceInfoEvent,
  type SyncDeviceInfo as SyncDeviceInfoType
} from './syncDeviceInfo.js'

const invokeWsmanCallSpy = jest.fn<any>()
jest.unstable_mockModule('./common.js', () => ({
  invokeWsmanCall: invokeWsmanCallSpy,
  coalesceMessage,
  commonContext,
  HttpResponseError
}))

const { SyncDeviceInfo, SyncDeviceInfoEventType } = await import ('./syncDeviceInfo.js')

jest.mock('got')

Environment.Config = config

const HttpBadRequestError = new HttpResponseError('Bad Request', 400)

let clientId: string
let doneResponse: DoneResponse
let event: SyncDeviceInfoEvent
let implementation: SyncDeviceInfoType
let deviceInfo: DeviceInfo
let mpsRsp: any
let gotSpy: SpyInstance<any>

beforeEach(() => {
  jest.resetAllMocks()
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
  gotSpy = spyOn(got, 'patch')
})

const runTheTest = async function (): Promise<void> {
  gotSpy.mockResolvedValue(mpsRsp)
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
  invokeWsmanCallSpy.mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
