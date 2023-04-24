/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import * as common from './common'
import { HttpResponseError } from './common'
import { type DoneResponse, StatusFailed } from './doneResponse'
import { PTStatus } from '../../utils/PTStatus'
import {
  type GetLowAccuracyTimeSynchResponse,
  type SetHighAccuracyTimeSynchResponse,
  SyncTime,
  SyncTimeEventType,
  type SyncTimeEvent
} from './syncTime'
import { setupTestClient } from '../../test/helper/Config'
import { runTilDone } from '../../test/helper/xstate'
import resetAllMocks = jest.resetAllMocks

const HttpBadRequestError = new HttpResponseError('Bad Request', 400)

let clientId: string
let doneResponse: DoneResponse
let event: SyncTimeEvent
let implementation: SyncTime
let lowAccuracyRsp: GetLowAccuracyTimeSynchResponse
let highAccuracyRsp: SetHighAccuracyTimeSynchResponse

beforeEach(() => {
  resetAllMocks()
  clientId = setupTestClient()
  implementation = new SyncTime()
  doneResponse = {
    taskName: implementation.machine.context.taskName,
    status: 'SUCCESS',
    message: expect.any(String)
  }
  lowAccuracyRsp = {
    GetLowAccuracyTimeSynch_OUTPUT: {
      ReturnValue: 0,
      Ta0: 0
    }
  }
  highAccuracyRsp = {
    SetHighAccuracyTimeSynch_OUTPUT: {
      ReturnValue: 0
    }
  }
  event = { type: SyncTimeEventType, clientId }
})

const runTheTest = async function (): Promise<void> {
  jest.spyOn(common, 'invokeWsmanCall')
    .mockResolvedValueOnce(lowAccuracyRsp)
    .mockResolvedValueOnce(highAccuracyRsp)
  await runTilDone(implementation.machine, event, doneResponse)
}

it('should succeed synchronizing time', async () => {
  await runTheTest()
})
it('should fail getting low accuracy time sync on bad return value', async () => {
  doneResponse.status = StatusFailed
  lowAccuracyRsp.GetLowAccuracyTimeSynch_OUTPUT.ReturnValue = PTStatus.INTERNAL_ERROR.value
  await runTheTest()
})
it('should fail setting high accuracy time sync on bad return value', async () => {
  doneResponse.status = StatusFailed
  highAccuracyRsp.SetHighAccuracyTimeSynch_OUTPUT.ReturnValue = PTStatus.INTERNAL_ERROR.value
  await runTheTest()
})
it('should fail missing lowAccuracyRsp.GetLowAccuracyTimeSynch_OUTPUT', async () => {
  delete lowAccuracyRsp.GetLowAccuracyTimeSynch_OUTPUT
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail missing highAccuracyRsp.SetHighAccuracyTimeSynch_OUTPUT', async () => {
  delete highAccuracyRsp.SetHighAccuracyTimeSynch_OUTPUT
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail getting low accuracy time sync on http response error', async () => {
  doneResponse.status = StatusFailed
  jest.spyOn(common, 'invokeWsmanCall')
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should fail setting high accuracy time sync on http response error', async () => {
  doneResponse.status = StatusFailed
  jest.spyOn(common, 'invokeWsmanCall')
    .mockResolvedValueOnce(lowAccuracyRsp)
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
