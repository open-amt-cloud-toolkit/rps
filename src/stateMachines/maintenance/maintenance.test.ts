/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpResponseError } from './common.js'
import { interpret } from 'xstate'

import { devices } from '../../devices.js'
import { waitFor } from 'xstate/lib/waitFor.js'
import { Environment } from '../../utils/Environment.js'
import { config, setupTestClient } from '../../test/helper/Config.js'
import Logger from '../../Logger.js'
import { doneFail, type DoneResponse, doneSuccess } from './doneResponse.js'
import { type SyncTimeEvent, SyncTimeEventType } from './syncTime.js'
import { ChangePasswordEventType } from './changePassword.js'
import { SyncHostNameEventType } from './syncHostName.js'
import { SyncDeviceInfoEventType } from './syncDeviceInfo.js'
import { SyncIPEventType } from './syncIP.js'
import { jest } from '@jest/globals'
import { spyOn } from 'jest-mock'

import { Maintenance, type MaintenanceEvent } from './maintenance.js'

const invokeWsmanCallSpy = jest.fn<any>()
jest.unstable_mockModule('./common.js', () => ({
  invokeWsmanCall: invokeWsmanCallSpy
}))

Environment.Config = config

const HttpBadRequestError = new HttpResponseError('Bad Request', 400)
const clientId = setupTestClient()

beforeEach(() => {
  jest.resetAllMocks()
})

describe('service logging', () => {
  it('should include child state machine', async () => {
    const event: SyncTimeEvent = { type: SyncTimeEventType, clientId }
    const logInfoSpy = spyOn(Logger.prototype, 'info').mockReturnValue(null as any)
    invokeWsmanCallSpy.mockRejectedValueOnce(HttpBadRequestError)
    const maintenance = new Maintenance()
    maintenance.service.start()
    maintenance.service.send(event)
    await waitFor(maintenance.service, (state) => state.matches('DONE'))
    expect(logInfoSpy).toHaveBeenNthCalledWith(1, expect.stringContaining('maintenance: "INITIAL"'))
    expect(logInfoSpy).toHaveBeenNthCalledWith(2, expect.stringContaining('maintenance: "SYNC_TIME"'))
    expect(logInfoSpy).toHaveBeenNthCalledWith(3, expect.stringContaining('sync-time: "GET_LOW_ACCURACY_TIME_SYNCH"'))
  })
})

describe('events and states', () => {
  interface TestInput {
    taskName: string
    event: MaintenanceEvent
    shouldSucceed: boolean
  }

  test.each<TestInput>([
    {
      taskName: 'change-password',
      event: { type: ChangePasswordEventType, clientId, newStaticPassword: 'doesitmattereven' },
      shouldSucceed: false
    },
    {
      taskName: 'sync-host-name',
      event: {
        type: SyncHostNameEventType,
        clientId,
        hostNameInfo: { hostname: 'some-host', dnsSuffixOS: 'teest.com' }
      },
      shouldSucceed: true
    },
    {
      taskName: 'sync-ip',
      event: {
        type: SyncIPEventType,
        clientId,
        targetIPConfig: {
          ipAddress: '192.168.1.100',
          netmask: '255.255.255.0',
          gateway: '192.168.1.100',
          primaryDns: '8.8.8.8',
          secondaryDns: '1.2.3.4'
        }
      },
      shouldSucceed: false
    },
    {
      taskName: 'sync-time',
      event: { type: SyncTimeEventType, clientId },
      shouldSucceed: true
    },
    {
      taskName: 'sync-device-info',
      event: {
        type: SyncDeviceInfoEventType,
        clientId,
        deviceInfo: {
          ver: '16.1.1',
          build: '1111',
          sku: '16xxx',
          currentMode: '0',
          features: 'AMT Pro Corprate',
          ipConfiguration: { ipAddress: '1.1.1.1' }
        }
      },
      shouldSucceed: true
    }
  ])('$taskName should succeed $shouldSucceed', async (ti) => {
    let doneResponse: DoneResponse
    let expectedStatus: any
    if (ti.shouldSucceed) {
      doneResponse = doneSuccess(ti.taskName, 'some additional details')
      expectedStatus = { status: 'success', method: 'success' }
    } else {
      doneResponse = doneFail(ti.taskName, 'some additional details')
      expectedStatus = { status: 'failed', method: 'error' }
    }
    const machineConfig: any = { services: {} }
    machineConfig.services[ti.taskName] = Promise.resolve(doneResponse)
    const maintenance = new Maintenance()
    const mockMachine = maintenance.machine.withConfig(machineConfig)
    const afterDoneSpy = spyOn(maintenance, 'respondAfterDone')
    let clientRspMsg
    spyOn(devices[clientId].ClientSocket, 'send')
      .mockImplementation((arg) => {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        clientRspMsg = JSON.parse(arg.toString())
      })
    const actor = interpret(mockMachine)
    actor.start()
    actor.send(ti.event)
    await waitFor(actor, (state) => state.matches('DONE'))
    expect(afterDoneSpy).toHaveBeenCalledWith(clientId, doneResponse)
    expect(clientRspMsg).toEqual(expect.objectContaining(expectedStatus))
    const msgStatus = JSON.parse(clientRspMsg.message).Status
    expect(msgStatus).toContain(doneResponse.taskName)
    expect(msgStatus).toContain(doneResponse.message)
  })
})
