/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import {
  coalesceMessage,
  commonContext,
  isDigestRealmValid,
  HttpResponseError
} from './common.js'

import { type AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { SecretManagerCreatorFactory } from '../../factories/SecretManagerCreatorFactory.js'
import { type DeviceCredentials, type ISecretManagerService } from '../../interfaces/ISecretManagerService.js'
import { PTStatus } from '../../utils/PTStatus.js'
import { type DoneResponse, StatusFailed, StatusSuccess } from './doneResponse.js'
import { runTilDone } from '../../test/helper/xstate.js'
import { config, setupTestClient } from '../../test/helper/Config.js'
import { Environment } from '../../utils/Environment.js'
import { jest } from '@jest/globals'
import { type SpyInstance, spyOn } from 'jest-mock'
import got from 'got'

import {
  type ChangePassword as ChangePasswordAsType,
  type ChangePasswordEvent,
  type SetAdminACLEntryExResponse
} from './changePassword.js'

const invokeWsmanCallSpy = jest.fn<any>() // () => generalSettingsRsp
jest.unstable_mockModule('./common.js', () => ({
  invokeWsmanCall: invokeWsmanCallSpy,
  HttpResponseError,
  coalesceMessage,
  commonContext,
  isDigestRealmValid
}))

const { ChangePassword, ChangePasswordEventType } = await import ('./changePassword.js')

// jest.mock('got')
Environment.Config = config

const HttpBadRequestError = new HttpResponseError('Bad Request', 400)

let clientId: string
let doneResponse: DoneResponse
let generalSettingsRsp: AMT.Models.GeneralSettingsResponse
let deviceCredentials: DeviceCredentials
let event: ChangePasswordEvent
let implementation: ChangePasswordAsType
let setAdminACLEntryExResponse: SetAdminACLEntryExResponse
let secretWriterSpy: SpyInstance<any>
let secretGetterSpy: SpyInstance<any>
let mpsRspErr: any
let mpsRsp
let deleteSpy: SpyInstance<any>

beforeEach(() => {
  jest.resetAllMocks()
  clientId = setupTestClient()
  implementation = new ChangePassword()
  generalSettingsRsp = {
    AMT_GeneralSettings: {
      DigestRealm: 'Digest:ABCDEF0123456789ABCDEF0123456789'
    }
  }
  deviceCredentials = {
    AMT_PASSWORD: 'existingAMTPassword',
    MEBX_PASSWORD: 'existingMEBXPassword'
  }
  event = {
    type: ChangePasswordEventType,
    clientId,
    newStaticPassword: 'testStaticPassword'
  }
  doneResponse = {
    taskName: implementation.machine.context.taskName,
    status: 'SUCCESS',
    message: expect.any(String)
  }
  setAdminACLEntryExResponse = {
    SetAdminAclEntryEx_OUTPUT: { ReturnValue: 0 }
  }
  // only concerened with DigestRealm
  mpsRsp = {
    statusCode: 200,
    statusMessage: 'OK'
  }
  mpsRspErr = {
    response: {
      statusCode: 404,
      statusMessage: 'Bad Request'
    }
  }
  const mockSecretsManager: ISecretManagerService = {
    deleteSecretAtPath: jest.fn<any>(),
    getSecretFromKey: jest.fn<any>(),
    health: jest.fn<any>(),
    writeSecretWithObject: jest.fn<any>(),
    getSecretAtPath: jest.fn<any>()
  }
  spyOn(SecretManagerCreatorFactory.prototype, 'getSecretManager')
    .mockResolvedValue(mockSecretsManager)
  secretGetterSpy = spyOn(mockSecretsManager, 'getSecretAtPath').mockResolvedValue(deviceCredentials)
  secretWriterSpy = spyOn(mockSecretsManager, 'writeSecretWithObject').mockResolvedValue(deviceCredentials)

  deleteSpy = spyOn(got, 'delete')
})

const runTheTest = async function (): Promise<void> {
  invokeWsmanCallSpy
    .mockResolvedValue(generalSettingsRsp)
    .mockResolvedValueOnce(setAdminACLEntryExResponse)
  deleteSpy.mockResolvedValue(mpsRsp)
  await runTilDone(implementation.machine, event, doneResponse)
}

it('should succeed changing password to the newStaticPassword', async () => {
  await runTheTest()
})
it('should succeed changing password to something random on empty newStaticPassword', async () => {
  event.newStaticPassword = null
  await runTheTest()
})
it('should fail on bad general settings response', async () => {
  delete generalSettingsRsp.AMT_GeneralSettings
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail on bad digest realm', async () => {
  generalSettingsRsp.AMT_GeneralSettings.DigestRealm = 'this is bad'
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail on non-zero SetAdminAclEntryEx_OUTPUT.ReturnValue', async () => {
  setAdminACLEntryExResponse.SetAdminAclEntryEx_OUTPUT.ReturnValue = PTStatus.INVALID_PASSWORD.value
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail on bad SetAdminAclEntryEx_OUTPUT', async () => {
  delete setAdminACLEntryExResponse.SetAdminAclEntryEx_OUTPUT
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should pass on empty credentials in secret manager', async () => {
  const expectedCredentials: DeviceCredentials = {
    AMT_PASSWORD: event.newStaticPassword,
    MEBX_PASSWORD: ''
  }
  secretGetterSpy.mockResolvedValue('null')
  secretWriterSpy.mockResolvedValue(expectedCredentials)
  doneResponse.status = StatusSuccess
  await runTheTest()
})
it('should fail on null response from secret manager write', async () => {
  secretWriterSpy.mockResolvedValue(null)
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail getting general settings on http response error', async () => {
  doneResponse.status = StatusFailed
  invokeWsmanCallSpy.mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should fail settting AdminACLEntryEx on http response error', async () => {
  doneResponse.status = StatusFailed
  invokeWsmanCallSpy
    .mockResolvedValueOnce(generalSettingsRsp)
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should succeed with when refreshing MPS succeeds with 200', async () => {
  doneResponse.status = StatusSuccess
  invokeWsmanCallSpy
    .mockResolvedValueOnce(generalSettingsRsp)
    .mockResolvedValueOnce(setAdminACLEntryExResponse)
  deleteSpy.mockResolvedValue(mpsRsp)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should succeed with when refreshing MPS fails with 404', async () => {
  doneResponse.status = StatusSuccess
  invokeWsmanCallSpy
    .mockResolvedValueOnce(generalSettingsRsp)
    .mockResolvedValueOnce(setAdminACLEntryExResponse)
  deleteSpy.mockRejectedValue(mpsRspErr)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should fail when refreshing MPS fails with 500', async () => {
  doneResponse.status = StatusFailed
  mpsRspErr.response.statusCode = 500
  mpsRspErr.response.statusMessage = 'Bad Request'
  invokeWsmanCallSpy
    .mockResolvedValueOnce(generalSettingsRsp)
    .mockResolvedValueOnce(setAdminACLEntryExResponse)
  deleteSpy.mockRejectedValue(mpsRspErr)
  await runTilDone(implementation.machine, event, doneResponse)
})
