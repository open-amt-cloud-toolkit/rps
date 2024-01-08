/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine, fromPromise } from 'xstate'
import { HttpHandler } from '../HttpHandler'
import { invokeWsmanCall } from './common'

interface TimeContext {
  message: any
  xmlMessage: string
  clientId: string
  status: string
  statusMessage: string
  errorMessage: string
  httpHandler: HttpHandler
}

interface TimeEvent {
  type: 'TIMETRAVEL' | 'ONFAILED'
  clientId: string
  data: any
}

export class TimeSync {
  machine = createMachine({
    context: {
      message: null,
      xmlMessage: '',
      clientId: '',
      status: '',
      statusMessage: '',
      errorMessage: '',
      httpHandler: new HttpHandler()
    },
    types: {} as {
      context: TimeContext
      events: TimeEvent
      actions: any
    },
    id: 'time-machine',
    initial: 'THE_PAST',
    states: {
      THE_PAST: {
        on: {
          TIMETRAVEL: {
            target: 'GET_LOW_ACCURACY_TIME_SYNCH'
          }
        }
      },
      GET_LOW_ACCURACY_TIME_SYNCH: {
        invoke: {
          id: 'get-low-accuracy-time-synch',
          // src: this.getLowAccuracyTimeSync,
          src: fromPromise(async () => {
            const data = this.getLowAccuracyTimeSync
            return data
          }),
          onDone: [{
            actions: assign({ message: ({ context, event }) => event.data }),
            target: 'GET_LOW_ACCURACY_TIME_SYNCH_RESPONSE'
          }],
          onError: {
            actions: assign({
              message: ({ context, event }) => event.data
            }),
            target: 'FAILED'
          }
        }
      },
      GET_LOW_ACCURACY_TIME_SYNCH_RESPONSE: {
        always: [{
          guard: 'isGetLowAccuracyTimeSynchSuccessful',
          target: 'SET_HIGH_ACCURACY_TIME_SYNCH'
        }, {
          actions: assign({
            errorMessage: 'Failed to GET_LOW_ACCURACY_TIME_SYNC'
          }),
          target: 'FAILED'
        }]
      },
      SET_HIGH_ACCURACY_TIME_SYNCH: {
        invoke: {
          id: 'set-high-accuracy-time-synch',
          // src: this.setHighAccuracyTimeSynch,
          src: fromPromise(async () => {
            const data = this.setHighAccuracyTimeSynch
            return data
          }),
          onDone: [{
            actions: assign({ message: ({ context, event }) => event.data }),
            target: 'SET_HIGH_ACCURACY_TIME_SYNCH_RESPONSE'
          }],
          onError: {
            actions: assign({
              errorMessage: 'Failed to SET_HIGH_ACCURACY_TIME_SYNCH'
            }),
            target: 'FAILED'
          }
        }
      },
      SET_HIGH_ACCURACY_TIME_SYNCH_RESPONSE: {
        always: [{
          guard: 'isSetHighAccuracyTimeSynchSuccessful',
          target: 'SUCCESS'
        }, {
          actions: assign({
            errorMessage: 'Failed to SET_HIGH_ACCURACY_TIME_SYNCH'
          }),
          target: 'FAILED'
        }]
      },
      FAILED: {
        type: 'final'
      },
      SUCCESS: {
        type: 'final'
      }
    }
  }, {
    guards: {
      isGetLowAccuracyTimeSynchSuccessful: ({ context, event }) => context.message.Envelope.Body?.GetLowAccuracyTimeSynch_OUTPUT?.ReturnValue === 0,
      isSetHighAccuracyTimeSynchSuccessful: ({ context, event }) => context.message.Envelope.Body?.SetHighAccuracyTimeSynch_OUTPUT?.ReturnValue === 0
    }
  })

  async setHighAccuracyTimeSynch(context: TimeContext): Promise<void> {
    const Tm1 = Math.round(new Date().getTime() / 1000)
    const Ta0: number = context.message.Envelope.Body.GetLowAccuracyTimeSynch_OUTPUT.Ta0
    const amt = new AMT.Messages()
    context.xmlMessage = amt.TimeSynchronizationService.SetHighAccuracyTimeSynch(Ta0, Tm1, Tm1)
    return await invokeWsmanCall(context)
  }

  async getLowAccuracyTimeSync(context: TimeContext): Promise<void> {
    const amt = new AMT.Messages()
    context.xmlMessage = amt.TimeSynchronizationService.GetLowAccuracyTimeSynch()
    return await invokeWsmanCall(context)
  }
}
