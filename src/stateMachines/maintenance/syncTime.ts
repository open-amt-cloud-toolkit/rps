/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine } from 'xstate'
import {
  coalesceMessage,
  commonContext,
  type CommonMaintenanceContext,
  invokeWsmanCall
} from './common'
import Logger from '../../Logger'
import * as Task from './doneResponse'
import { getPTStatusName, PTStatus } from '../../utils/PTStatus'

export interface GetLowAccuracyTimeSynchResponse {
  GetLowAccuracyTimeSynch_OUTPUT: {
    ReturnValue: number
    Ta0: number
  }
}

export interface SetHighAccuracyTimeSynchResponse {
  SetHighAccuracyTimeSynch_OUTPUT: {
    ReturnValue: number
  }
}

export const SyncTimeEventType = 'SYNC_TIME'
export type SyncTimeEvent =
  | { type: typeof SyncTimeEventType, clientId: string }

export interface SyncTimeContext extends CommonMaintenanceContext {
  lowAccuracyData: LowAccuracyData
}

class LowAccuracyData {
  Ta0: number
  Tm1: number
}

const amt = new AMT.Messages()
const logger = new Logger('syncTime')

export class SyncTime {
  machine = createMachine<SyncTimeContext, SyncTimeEvent>({
    id: 'sync-time',
    predictableActionArguments: true,
    context: {
      ...commonContext,
      taskName: 'synctime',
      lowAccuracyData: null
    },
    initial: 'INITIAL',
    states: {
      INITIAL: {
        on: {
          SYNC_TIME: {
            actions: assign({ clientId: (context, event) => event.clientId }),
            target: 'GET_LOW_ACCURACY_TIME_SYNCH'
          }
        }
      },
      GET_LOW_ACCURACY_TIME_SYNCH: {
        invoke: {
          id: 'get-low-accuracy-time-synch',
          src: this.getLowAccuracyTimeSync,
          onDone: {
            actions: assign({ lowAccuracyData: (context, event) => event.data }),
            target: 'SET_HIGH_ACCURACY_TIME_SYNCH'
          },
          onError: {
            actions: assign({
              statusMessage: (_, event) => coalesceMessage('at GET_LOW_ACCURACY_TIME_SYNCH', event.data)
            }),
            target: 'FAILED'
          }
        }
      },
      SET_HIGH_ACCURACY_TIME_SYNCH: {
        invoke: {
          id: 'set-high-accuracy-time-synch',
          src: this.setHighAccuracyTimeSynch,
          onDone: {
            target: 'SUCCESS'
          },
          onError: {
            actions: assign({
              statusMessage: (_, event) => coalesceMessage('at SET_HIGH_ACCURACY_TIME_SYNCH', event.data)
            }),
            target: 'FAILED'
          }
        }
      },
      FAILED: {
        type: 'final',
        data: (context) => (Task.doneFail(context.taskName, context.statusMessage))
      },
      SUCCESS: {
        type: 'final',
        data: (context) => (Task.doneSuccess(context.taskName, context.statusMessage))
      }
    }
  })

  async getLowAccuracyTimeSync (context: SyncTimeContext): Promise<LowAccuracyData> {
    const wsmanXml = amt.TimeSynchronizationService.GetLowAccuracyTimeSynch()
    const rsp = await invokeWsmanCall<GetLowAccuracyTimeSynchResponse>(context.clientId, wsmanXml)
    const output = rsp.GetLowAccuracyTimeSynch_OUTPUT
    if (output?.ReturnValue !== PTStatus.SUCCESS.value) {
      const msg = `ReturnValue ${getPTStatusName(output?.ReturnValue)}`
      throw new Error(msg)
    }
    const data: LowAccuracyData = {
      Ta0: output.Ta0,
      Tm1: Math.round(new Date().getTime() / 1000)
    }
    logger.debug(`LowAccuracyData: ${JSON.stringify(data)}`)
    return data
  }

  async setHighAccuracyTimeSynch (context: SyncTimeContext): Promise<void> {
    const Ta0 = context.lowAccuracyData.Ta0
    const Tm1 = context.lowAccuracyData.Tm1
    const Tm2 = Math.round(new Date().getTime() / 1000)
    const wsmanXml = amt.TimeSynchronizationService.SetHighAccuracyTimeSynch(Ta0, Tm1, Tm2)
    logger.debug(`sending SetHighAccuracyTimeSynch: Ta0: ${Ta0} Tm1: ${Tm1} Tm2: ${Tm2}`)
    const wsmanRsp = await invokeWsmanCall<SetHighAccuracyTimeSynchResponse>(context.clientId, wsmanXml)
    const output = wsmanRsp.SetHighAccuracyTimeSynch_OUTPUT
    if (output?.ReturnValue !== PTStatus.SUCCESS.value) {
      const msg = `ReturnValue ${getPTStatusName(output?.ReturnValue)}`
      throw new Error(msg)
    }
    return null
  }
}
