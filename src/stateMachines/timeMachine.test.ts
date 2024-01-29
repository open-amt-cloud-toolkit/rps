/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { interpret } from 'xstate'
import { HttpHandler } from '../HttpHandler.js'
import { devices } from '../devices.js'
import { jest } from '@jest/globals'
import { type TimeSync as TimeSyncType } from './timeMachine.js'
const invokeWsmanCallSpy = jest.fn<any>()
jest.unstable_mockModule('./common.js', () => ({
  invokeWsmanCall: invokeWsmanCallSpy
}))
const { TimeSync } = await import('./timeMachine.js')

describe('TLS State Machine', () => {
  let timeMachine: TimeSyncType
  let config
  let context
  let currentStateIndex = 0

  const clientId = '4c4c4544-004b-4210-8033-b6c04f504633'
  beforeEach(() => {
    currentStateIndex = 0
    devices[clientId] = {
      status: {},
      ClientSocket: { send: jest.fn() },
      tls: {}
    } as any
    context = {
      clientId,
      httpHandler: new HttpHandler(),
      message: null,
      xmlMessage: '',
      errorMessage: '',
      statusMessage: '',
      status: 'success'
    }
    timeMachine = new TimeSync()
    config = {
      services: {
        'get-low-accuracy-time-synch': Promise.resolve({
          Envelope: { Body: { GetLowAccuracyTimeSynchOutput: { ReturnValue: 0 } } }
        }),
        'set-high-accuracy-time-synch': Promise.resolve({
          Envelope: { Body: { SetHighAccuracyTimeSynchOutput: { ReturnValue: 0 } } }
        })
      }
    }
  })
  it('should sync the time', (done) => {
    const timeMachineStateMachine = timeMachine.machine.withConfig(config).withContext(context)
    const flowStates = [
      'THE_PAST',
      'GET_LOW_ACCURACY_TIME_SYNCH',
      'SET_HIGH_ACCURACY_TIME_SYNCH',
      'SUCCESS'
    ]

    const timeMachineService = interpret(timeMachineStateMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    timeMachineService.start()
    timeMachineService.send({ type: 'TIMETRAVEL', clientId, data: null })
  })

  it('should setHighAccuracyTimeSynch', async () => {
    context.message = {
      Envelope: { Body: { GetLowAccuracyTimeSynchOutput: { Ta0: 123456 } } }
    }
    await timeMachine.setHighAccuracyTimeSynch(context)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should getLowAccuracyTimeSync', async () => {
    await timeMachine.getLowAccuracyTimeSync(context)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
})
