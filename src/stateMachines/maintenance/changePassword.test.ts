/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import resetAllMocks = jest.resetAllMocks
import * as common from './common'
import { HttpResponseError } from './common'
import { type AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { SecretManagerCreatorFactory } from '../../factories/SecretManagerCreatorFactory'
import { type DeviceCredentials, type ISecretManagerService } from '../../interfaces/ISecretManagerService'
import { PTStatus } from '../../utils/PTStatus'
import { type DoneResponse, StatusFailed, StatusSuccess } from './doneResponse'
import { runTilDone } from '../../test/helper/xstate'
import { setupTestClient } from '../../test/helper/Config'
import {
  ChangePassword,
  type ChangePasswordEvent,
  ChangePasswordEventType,
  type SetAdminACLEntryExResponse
} from './changePassword'

const HttpBadRequestError = new HttpResponseError('Bad Request', 400)

let clientId: string
let doneResponse: DoneResponse
let event: ChangePasswordEvent
let implementation: ChangePassword
let generalSettingsRsp: AMT.Models.GeneralSettingsResponse
let setAdminACLEntryExResponse: SetAdminACLEntryExResponse
let deviceCredentials: DeviceCredentials
let secretWriterSpy: jest.SpyInstance
let secretGetterSpy: jest.SpyInstance

beforeEach(() => {
  resetAllMocks()
  clientId = setupTestClient()
  implementation = new ChangePassword()
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
  generalSettingsRsp = {
    AMT_GeneralSettings: {
      DigestRealm: 'Digest:ABCDEF0123456789ABCDEF0123456789'
    }
  }
  deviceCredentials = {
    AMT_PASSWORD: 'existingAMTPassword',
    MEBX_PASSWORD: 'existingMEBXPassword'

  }
  const mockSecretsManager: ISecretManagerService = {
    deleteSecretAtPath: jest.fn(),
    getSecretFromKey: jest.fn(),
    health: jest.fn(),
    writeSecretWithObject: jest.fn(),
    getSecretAtPath: jest.fn()
  }
  jest.spyOn(SecretManagerCreatorFactory.prototype, 'getSecretManager')
    .mockResolvedValue(mockSecretsManager)
  secretGetterSpy = jest.spyOn(mockSecretsManager, 'getSecretAtPath').mockResolvedValue(deviceCredentials)
  secretWriterSpy = jest.spyOn(mockSecretsManager, 'writeSecretWithObject').mockResolvedValue(deviceCredentials)
})

const runTheTest = async function (): Promise<void> {
  jest.spyOn(common, 'invokeWsmanCall')
    .mockResolvedValueOnce(generalSettingsRsp)
    .mockResolvedValueOnce(setAdminACLEntryExResponse)
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
  secretGetterSpy.mockResolvedValue(null)
  secretWriterSpy.mockResolvedValueOnce(expectedCredentials)
  doneResponse.status = StatusSuccess
  await runTheTest()
  expect(secretWriterSpy).toHaveBeenCalledWith(
    expect.any(String),
    expectedCredentials)
})
it('should fail on null response from secret manager write', async () => {
  secretWriterSpy.mockResolvedValue(null)
  doneResponse.status = StatusFailed
  await runTheTest()
})
it('should fail getting general settings on http response error', async () => {
  doneResponse.status = StatusFailed
  jest.spyOn(common, 'invokeWsmanCall')
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
it('should fail settting AdminACLEntryEx on http response error', async () => {
  doneResponse.status = StatusFailed
  jest.spyOn(common, 'invokeWsmanCall')
    .mockResolvedValueOnce(generalSettingsRsp)
    .mockRejectedValueOnce(HttpBadRequestError)
  await runTilDone(implementation.machine, event, doneResponse)
})
