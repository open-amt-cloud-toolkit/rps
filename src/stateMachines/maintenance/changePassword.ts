/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { assign, createMachine } from 'xstate'
import {
  coalesceMessage,
  commonContext,
  type CommonMaintenanceContext,
  invokeWsmanCall,
  isDigestRealmValid
} from './common'
import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { PasswordHelper } from '../../utils/PasswordHelper'
import { SignatureHelper } from '../../utils/SignatureHelper'
import { AMTUserName } from '../../utils/constants'
import { devices } from '../../WebSocketListener'
import { type DeviceCredentials } from '../../interfaces/ISecretManagerService'
import Logger from '../../Logger'
import * as Task from './doneResponse'
import { SecretManagerCreatorFactory } from '../../factories/SecretManagerCreatorFactory'
import { getPTStatusName, PTStatus } from '../../utils/PTStatus'

export interface SetAdminACLEntryExResponse {
  SetAdminAclEntryEx_OUTPUT: {
    ReturnValue: number
  }
}

export const ChangePasswordEventType = 'CHANGE_PASSWORD'
export type ChangePasswordEvent =
  | { type: typeof ChangePasswordEventType, clientId: string, newStaticPassword: string }

export interface ChangePasswordContext extends CommonMaintenanceContext {
  newStaticPassword: string
  generalSettings: AMT.Models.GeneralSettings
  updatedPassword: string
}

const amt = new AMT.Messages()
const logger = new Logger('changePassword')

export class ChangePassword {
  machine = createMachine<ChangePasswordContext, ChangePasswordEvent>({
    id: 'change-password',
    predictableActionArguments: true,
    context: {
      ...commonContext,
      taskName: 'changepassword',
      newStaticPassword: null,
      generalSettings: null,
      updatedPassword: null
    },
    initial: 'INITIAL',
    states: {
      INITIAL: {
        on: {
          CHANGE_PASSWORD: {
            actions: assign({
              clientId: (context, event) => event.clientId,
              newStaticPassword: (context, event) => event.newStaticPassword
            }),
            target: 'GET_GENERAL_SETTINGS'
          }
        }
      },
      GET_GENERAL_SETTINGS: {
        invoke: {
          src: this.getGeneralSettings.bind(this),
          id: 'get-general-settings',
          onDone: {
            actions: assign({ generalSettings: (context, event) => event.data }),
            target: 'SET_ADMIN_ACL_ENTRY'
          },
          onError: {
            actions: assign({
              statusMessage: (_, event) => coalesceMessage('at GET_GENERAL_SETTINGS', event.data)
            }),
            target: 'FAILED'
          }
        }
      },
      SET_ADMIN_ACL_ENTRY: {
        invoke: {
          src: this.setAdminACLEntry.bind(this),
          id: 'set-on-device',
          onDone: {
            actions: assign({ updatedPassword: (context, event) => event.data }),
            target: 'SAVE_TO_SECRET_PROVIDER'
          },
          onError: {
            actions: assign({
              statusMessage: (_, event) => coalesceMessage('at SET_ADMIN_ACL_ENTRY', event.data)
            }),
            target: 'FAILED'
          }
        }
      },
      SAVE_TO_SECRET_PROVIDER: {
        invoke: {
          src: this.saveToSecretProvider.bind(this),
          id: 'save-to-secret-provider',
          onDone: {
            target: 'SUCCESS'
          },
          onError: {
            actions: assign({
              statusMessage: (_, event) => coalesceMessage('at SAVE_TO_SECRET_PROVIDER', event.data)
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

  async getGeneralSettings (context: ChangePasswordContext): Promise<AMT.Models.GeneralSettings> {
    const wsmanXml = amt.GeneralSettings.Get()
    const rsp = await invokeWsmanCall<AMT.Models.GeneralSettingsResponse>(context.clientId, wsmanXml, 2)
    const settings = rsp.AMT_GeneralSettings
    if (!settings) {
      throw new Error(`invalid response: ${JSON.stringify(rsp)}`)
    }
    if (!isDigestRealmValid(settings.DigestRealm)) {
      throw new Error(`invalid DigestRealm ${rsp.AMT_GeneralSettings.DigestRealm}`)
    }
    logger.debug(`AMT_GeneralSettings: ${JSON.stringify(settings)}`)
    return settings
  }

  async setAdminACLEntry (context: ChangePasswordContext): Promise<string> {
    const password = context.newStaticPassword
      ? context.newStaticPassword
      : PasswordHelper.generateRandomPassword()
    const data: string = `${AMTUserName}:${context.generalSettings.DigestRealm}:${password}`
    const signPassword = SignatureHelper.createMd5Hash(data)
    // Convert MD5 hash to raw string which utf16
    const result = signPassword.match(/../g).map((v) => String.fromCharCode(parseInt(v, 16))).join('')
    // Encode to base64
    const encodedPassword = Buffer.from(result, 'binary').toString('base64')
    logger.debug('sending updated password to device')
    const wsmanXml = amt.AuthorizationService.SetAdminACLEntryEx(AMTUserName, encodedPassword)
    const wsmanRsp = await invokeWsmanCall<SetAdminACLEntryExResponse>(context.clientId, wsmanXml)
    const output = wsmanRsp.SetAdminAclEntryEx_OUTPUT
    if (output?.ReturnValue !== PTStatus.SUCCESS.value) {
      const msg = `ReturnValue ${getPTStatusName(output?.ReturnValue)}`
      throw new Error(msg)
    }
    return password
  }

  async saveToSecretProvider (context: ChangePasswordContext): Promise<boolean> {
    const smcf = new SecretManagerCreatorFactory()
    const secretMgr = await smcf.getSecretManager(new Logger('SecretManagerService'))
    const clientObj = devices[context.clientId]
    let credentials = await secretMgr.getSecretAtPath(`devices/${clientObj.uuid}`) as DeviceCredentials
    if (!credentials) {
      logger.debug(`creating new DeviceCredentials for ${clientObj.uuid}`)
      credentials = { AMT_PASSWORD: '', MEBX_PASSWORD: '' }
    }
    credentials.AMT_PASSWORD = clientObj.amtPassword = context.updatedPassword
    logger.debug(`saving DeviceCredentials for ${clientObj.uuid}`)
    const writtenCredentials = await secretMgr.writeSecretWithObject(`devices/${clientObj.uuid}`, credentials)
    if (!writtenCredentials) {
      throw new Error('saved credentials were not returned as expected')
    }
    return true
  }
}
