/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type DoneResponse, StatusFailed } from './doneResponse.js'
import { PTStatus } from '../../utils/PTStatus.js'
import { setupTestClient } from '../../test/helper/Config.js'
import { runTilDone } from '../../test/helper/xstate.js'
import { jest } from '@jest/globals'

import {
  HttpResponseError,
  coalesceMessage,
  commonContext
} from './common.js'

import {
  type GetLowAccuracyTimeSynchResponse,
  type SetHighAccuracyTimeSynchResponse,
  type SyncTimeEvent,
  type SyncTime as SyncTimeType
} from './syncTime.js'

const invokeWsmanCallSpy = jest.fn<any>()
jest.unstable_mockModule('./common.js', () => ({
  invokeWsmanCall: invokeWsmanCallSpy,
  HttpResponseError,
  coalesceMessage,
  commonContext
}))

const {
  SyncTime,
  SyncTimeEventType
} = await import ('./syncTime.js')

const HttpBadRequestError = new HttpResponseError('Bad Request', 400)

let clientId: string
let doneResponse: DoneResponse
let event: SyncTimeEvent
let implementation: SyncTimeType
let lowAccuracyRsp: GetLowAccuracyTimeSynchResponse
let highAccuracyRsp: SetHighAccuracyTimeSynchResponse

beforeEach(() => {
  jest.resetAllMocks()
  clientId = setupTestClient()
  implementation = new SyncTime()
  doneResponse = {
    taskName: implementation.machine.context.taskName,
    status: 'SUCCESS',
    message: expect.any(String)
  }
  lowAccuracyRsp = {
    GetLowAccuracyTimeSynchOutput: {
      ReturnValue: 0,
      Ta0: 0
    }
  }
  highAccuracyRsp = {
    SetHighAccuracyTimeSynchOutput: {
      ReturnValue: 0
    }
  }
  event = { type: SyncTimeEventType, clientId }
})

const runTheTest = async function (): Promise<void> {
  invokeWsmanCallSpy
    .mockResolvedValueOnce(lowAccuracyRsp)
    .mockResolvedValueOnce(highAccuracyRsp)
  await runTilDone(implementation.machine, event, doneResponse)
}

it('should succeed synchronizing time', async () => {
  await runTheTest()
})
it('should fail getting low accuracy time sync on bad return value', async () => {
  doneResponse.status = StatusFailed
  lowAccuracyRsp.GetLowAccuracyTimeSynchOutput.ReturnValue = PTStatus.INTERNAL_ERROR.value
  await runTheTest()
})
it('should fail setting high accuracy time sync on bad return value', async () => {
  doneResponse.status = StatusFailed
  highAccuracyRsp.SetHighAccuracyTimeSynchOutput.ReturnValue = PTStatus.INTERNAL_ERROR.value
  await runTheTest()
})
it('should fail missing lowAccuracyRsp.GetLowAccuracyTimeSynchOutput', async () => {
  const { GetLowAccuracyTimeSynchOutput, ...newLowAccuracyRsp } = lowAccuracyRsp
  lowAccuracyRsp = newLowAccuracyRsp as any
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail missing highAccuracyRsp.SetHighAccuracyTimeSynchOutput', async () => {
  const { SetHighAccuracyTimeSynchOutput, ...newHighAccuracyRsp } = highAccuracyRsp
  highAccuracyRsp = newHighAccuracyRsp as any
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail getting low accuracy time sync on http response error', async () => {
  doneResponse.status = StatusFailed
  invokeWsmanCallSpy
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should fail setting high accuracy time sync on http response error', async () => {
  doneResponse.status = StatusFailed
  invokeWsmanCallSpy
    .mockResolvedValueOnce(lowAccuracyRsp)
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
