/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { assign, createActor, createMachine, raise, sendTo } from 'xstate'
import Logger from '../../Logger'
import { devices } from '../../WebSocketListener'
import { type Status } from '../../models/RCS.Config'
import { SyncTime, type SyncTimeEvent } from './syncTime'
import { SyncIP, type SyncIPEvent } from './syncIP'
import { ChangePassword, type ChangePasswordEvent } from './changePassword'
import * as TaskDefs from './doneResponse'
import { SyncHostName, type SyncHostNameEvent } from './syncHostName'
import { SyncDeviceInfo, type SyncDeviceInfoEvent } from './syncDeviceInfo'
import ClientResponseMsg from '../../utils/ClientResponseMsg'

export interface MaintenanceContext {
  clientId: string
  doneData: TaskDefs.DoneResponse
}

export type MaintenanceEvent =
  | ChangePasswordEvent
  | SyncTimeEvent
  | SyncIPEvent
  | SyncHostNameEvent
  | SyncDeviceInfoEvent

// TODO: tech-debt - these should be in ClientResponseMsg, but the default export there makes it really weird
type ClientRspMessageType = 'error' | 'wsman' | 'success' | 'heartbeat_request'
type ClientRspStatusType = 'failed' | 'success' | 'ok' | 'heartbeat'
const logger = new Logger('Maintenance')

export class Maintenance {
  changePasswordImpl: ChangePassword = new ChangePassword()
  syncIPImpl: SyncIP = new SyncIP()
  syncTimeImpl: SyncTime = new SyncTime()
  syncHostNameImpl: SyncHostName = new SyncHostName()
  syncDeviceInfoImpl: SyncDeviceInfo = new SyncDeviceInfo()
  machine = createMachine({
    id: 'maintenance-machine',
    types: {} as {
      context: MaintenanceContext
      events: MaintenanceEvent
      actions: any
    },
    context: {
      clientId: '',
      doneData: null
    },
    initial: 'INITIAL',
    states: {
      INITIAL: {
        on: {
          CHANGE_PASSWORD: { target: 'CHANGE_PASSWORD' },
          SYNC_TIME: { target: 'SYNC_TIME' },
          SYNC_IP: { target: 'SYNC_IP' },
          SYNC_HOST_NAME: { target: 'SYNC_HOST_NAME' },
          SYNC_DEVICE_INFO: { target: 'SYNC_DEVICE_INFO' }
        }
      },
      CHANGE_PASSWORD: {
        entry: [
          assign({ clientId: ({event}) => event.clientId }),
          sendTo('change-password', {type: 'ChangePasswordEvent'} )
          // send(({ context, event }) => event, { to: 'change-password' })
        ],
        invoke: {
          id: 'change-password',
          src: this.changePasswordImpl.machine,
          onDone: {
            actions: assign({ doneData: ({event}) => event.data }),
            target: 'DONE'
          }
        }
      },
      SYNC_HOST_NAME: {
        entry: [
          assign({ clientId: ({event}) => event.clientId }),
          sendTo('sync-host-name', {type: 'SyncHostNameEvent'})
          // send(({ context, event }) => event, { to: 'sync-host-name' })
        ],
        invoke: {
          id: 'sync-host-name',
          src: this.syncHostNameImpl.machine,
          onDone: {
            actions: assign({ doneData: ({event}) => event.data }),
            target: 'DONE'
          }
        }
      },
      SYNC_IP: {
        entry: [
          assign({ clientId: ({event}) => event.clientId }),
          sendTo('sync-ip', { type: 'SyncIPEvent' })
          // send(({ context, event }) => event, { to: 'sync-ip' })
        ],
        invoke: {
          id: 'sync-ip',
          src: this.syncIPImpl.machine,
          onDone: {
            actions: assign({ doneData: ({event}) => event.data }),
            target: 'DONE'
          }
        }
      },
      SYNC_TIME: {
        entry: [
          assign({ clientId: ({event}) => event.clientId }),
          sendTo('sync-time', { type: 'SyncTimeEvent' })
          // send(({ context, event }) => event, { to: 'sync-time' })
        ],
        invoke: {
          id: 'sync-time',
          src: this.syncTimeImpl.machine,
          onDone: {
            actions: assign({ doneData: ({event}) => event.data }),
            target: 'DONE'
          }
        }
      },
      SYNC_DEVICE_INFO: {
        entry: [
          assign({ clientId: ({event}) => event.clientId }),
          sendTo('sync-device-info', { type: 'SyncDeviceInfoEvent'})
          // send(({ context, event }) => event, { to: 'sync-device-info' })
        ],
        invoke: {
          id: 'sync-device-info',
          src: this.syncDeviceInfoImpl.machine,
          onDone: {
            actions: assign({ doneData: ({event}) => event.data }),
            target: 'DONE'
          }
        }
      },
      DONE: {
        type: 'final',
        entry: ({context}) => this.respondAfterDone(context.clientId, context.doneData)
      }
    }
  })

  service = createActor(this.machine)
  // .onTransition((state) => {
  //   logger.info(`maintenance: ${JSON.stringify(state.value)}`)
  //   for (const k in state.children) {
  //     state.children[k].subscribe((childState) => {
  //       logger.info(`${k}: ${JSON.stringify(childState.value)}`)
  //     })
  //   }
  // })

  respondAfterDone (clientId: string, doneData: TaskDefs.DoneResponse): any {
    const clientObj = devices[clientId]
    // TODO: this is silly, where is the type/interface definition for these?
    let method: ClientRspMessageType
    let status: ClientRspStatusType
    // and then 'another' status thingy to hold status from several optional activation
    // activities that aren't used here, but nonetheless are baked into the client API flow
    let actualStatusMsg: string
    if (doneData.status === TaskDefs.StatusSuccess) {
      method = 'success'
      status = 'success'
      actualStatusMsg = `${doneData.taskName} completed succesfully`
    } else if (doneData.status === TaskDefs.StatusFailed) {
      method = 'error'
      status = 'failed'
      actualStatusMsg = `${doneData.taskName} failed`
    }
    if (doneData.message) {
      actualStatusMsg = `${actualStatusMsg} ${doneData.message}`
    }
    const taskStatus: Status = {
      Status: actualStatusMsg
    }
    logger.info(`${clientId} ${actualStatusMsg}`)
    const rspMsg = ClientResponseMsg.get(clientId, null, method, status, JSON.stringify(taskStatus))
    const toSend = JSON.stringify(rspMsg)
    clientObj.ClientSocket.send(toSend)
  }
}
