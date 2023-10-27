/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { assign, createMachine } from 'xstate'
import {
  coalesceMessage,
  commonContext,
  type CommonMaintenanceContext,
  HttpResponseError
} from './common'
import Logger from '../../Logger'
import * as Task from './doneResponse'
import { devices } from '../../WebSocketListener'
import got from 'got'
import { Environment } from '../../utils/Environment'

export interface DeviceInfo {
  ver: string
  build: string
  sku: string
  currentMode: string
  features: string
  ipConfiguration: { ipAddress: string }
}

export const SyncDeviceInfoEventType = 'SYNC_DEVICE_INFO'
export type SyncDeviceInfoEvent =
  | { type: typeof SyncDeviceInfoEventType, clientId: string, deviceInfo: DeviceInfo }

export interface SyncDeviceInfoContext extends CommonMaintenanceContext {
  deviceInfo: DeviceInfo
}

const logger = new Logger('syncDeviceInfo')

export class SyncDeviceInfo {
  machine = createMachine<SyncDeviceInfoContext, SyncDeviceInfoEvent>({
    id: 'sync-device-info',
    predictableActionArguments: true,
    context: {
      ...commonContext,
      taskName: 'syncdeviceinfo',
      deviceInfo: null
    },
    initial: 'INITIAL',
    states: {
      INITIAL: {
        on: {
          SYNC_DEVICE_INFO: {
            actions: assign({
              clientId: (context, event) => event.clientId,
              deviceInfo: (context, event) => event.deviceInfo
            }),
            target: 'SAVE_TO_MPS'
          }
        }
      },
      SAVE_TO_MPS: {
        invoke: {
          src: this.saveToMPS.bind(this),
          id: 'save-to-mps',
          onDone: {
            actions: assign({ statusMessage: (context, event) => event.data }),
            target: 'SUCCESS'
          },
          onError: {
            actions: assign({
              statusMessage: (_, event) => coalesceMessage('at SAVE_TO_MPS', event.data)
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

  async saveToMPS (context: SyncDeviceInfoContext): Promise<void> {
    const clientObj = devices[context.clientId]
    const url = `${Environment.Config.mps_server}/api/v1/devices`
    const deviceinfo = {
      fwVersion: context.deviceInfo.ver,
      fwBuild: context.deviceInfo.build,
      fwSku: context.deviceInfo.sku,
      currentMode: context.deviceInfo.currentMode?.toString(),
      features: context.deviceInfo.features,
      ipAddress: context.deviceInfo.ipConfiguration.ipAddress
    }
    const jsonData = {
      guid: clientObj.uuid,
      deviceInfo: deviceinfo
    }
    const rsp = await got.patch(url, { json: jsonData })
    if (rsp.statusCode !== 200) {
      throw new HttpResponseError(rsp.statusMessage, rsp.statusCode)
    }
    logger.debug(`savedToMPS ${JSON.stringify(jsonData)}`)
  }
}
