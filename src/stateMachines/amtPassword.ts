/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { assign, createMachine } from 'xstate'
import { send } from 'xstate/lib/actions'
import { HttpHandler } from '../HttpHandler'
import { invokeWsmanCall } from './common'
import Logger from '../Logger'
import { Error } from './error'
import { Configurator } from '../Configurator'
import { MqttProvider } from '../utils/MqttProvider'
import { devices } from '../WebSocketListener'
import { AMTDeviceDTO } from '../models'
import { AMTUserName, AMTRandomPasswordLength } from '../utils/constants'
import { SignatureHelper } from '../utils/SignatureHelper'
import { Validator } from '../Validator'
import { PasswordHelper } from '../utils/PasswordHelper'

export interface AMTPasswordContext {
  message: any
  xmlMessage: string
  clientId: string
  status: string
  statusMessage: string
  errorMessage: string
  amtPassword: string
  httpHandler: HttpHandler
  generalSettings?: AMT.Models.GeneralSettings
}

export interface AMTPasswordEvent {
  type: 'CHANGEPASSWORD' | 'ONFAILED'
  clientId: string
  data?: any
}

export class AMTPassword {
  error: Error = new Error()
  logger = new Logger('AMT_Password')
  configurator = new Configurator()
  validator = new Validator(new Logger('Validator'), this.configurator)
  machine = createMachine<AMTPasswordContext, AMTPasswordEvent>({
    predictableActionArguments: true,
    context: {
      message: null,
      xmlMessage: '',
      clientId: '',
      status: '',
      statusMessage: '',
      errorMessage: '',
      amtPassword: '',
      httpHandler: new HttpHandler()
    },
    id: 'change-amt-password',
    initial: 'ACTIVATED',
    states: {
      ACTIVATED: {
        on: {
          CHANGEPASSWORD: {
            target: 'GET_GENERAL_SETTINGS'
          }
        }
      },
      GET_GENERAL_SETTINGS: {
        invoke: {
          src: this.getGeneralSettings.bind(this),
          id: 'send-generalsettings',
          onDone: {
            actions: [assign({ generalSettings: (context, event) => event.data.Envelope.Body.AMT_GeneralSettings }), 'Reset Unauth Count'],
            target: 'CHECK_DIGEST_REALM'
          },
          onError: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'ERROR'
          }
        }
      },
      CHECK_DIGEST_REALM: {
        always: [
          {
            cond: 'isDigestRealmInvalid',
            target: 'ERROR'
          }, {
            target: 'SEND_UPDATED_AMT_PASSWORD'
          }
        ]
      },
      SEND_UPDATED_AMT_PASSWORD: {
        invoke: {
          src: this.changeAMTPassword.bind(this),
          id: 'send-updated-amt-password',
          onDone: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'SAVE_AMT_PASSWORD_TO_SECRET_PROVIDER'
          },
          onError: {
            actions: assign({ message: (context, event) => event.data }),
            target: 'ERROR'
          }
        }
      },
      SAVE_AMT_PASSWORD_TO_SECRET_PROVIDER: {
        invoke: {
          src: this.saveDeviceInfoToSecretProvider.bind(this),
          id: 'save-amt-password-to-secret-provider',
          onDone: 'SUCCESS',
          onError: 'SAVE_AMT_PASSWORD_TO_SECRET_PROVIDER_FAILURE'
        }
      },
      SAVE_AMT_PASSWORD_TO_SECRET_PROVIDER_FAILURE: {
        entry: assign({ errorMessage: 'Failed to save amt password information to Secret Provider' }),
        always: 'FAILED'
      },
      ERROR: {
        entry: send({ type: 'PARSE' }, { to: 'error-machine' }),
        invoke: {
          src: this.error.machine,
          id: 'error-machine',
          data: {
            unauthCount: 0,
            message: (context, event) => event.data,
            clientId: (context, event) => context.clientId
          },
          onDone: 'GET_GENERAL_SETTINGS'
        },
        on: {
          ONFAILED: 'FAILED'
        }
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
      isDigestRealmInvalid: (context, event) => !this.validator.isDigestRealmValid(context.generalSettings.DigestRealm)
    },
    actions: {
      'Reset Unauth Count': (context, event) => { devices[context.clientId].unauthCount = 0 }
    }
  })

  async getGeneralSettings (context): Promise<any> {
    const amt = new AMT.Messages()
    context.xmlMessage = amt.GeneralSettings(AMT.Methods.GET)
    return await invokeWsmanCall(context)
  }

  async changeAMTPassword (context: AMTPasswordContext, event: AMTPasswordEvent): Promise<any> {
    const password = context.amtPassword
    let data: string = `admin:${context.generalSettings.DigestRealm}:${password}`
    if (data.length === 0) {
      data = PasswordHelper.generateRandomPassword(AMTRandomPasswordLength)
      if (data) {
        this.logger.debug('Created random password')
      } else {
        this.logger.error('Unable to create a random password')
      }
    }
    const signPassword = SignatureHelper.createMd5Hash(data)
    // Convert MD5 hash to raw string which utf16
    const result = signPassword.match(/../g).map((v) => String.fromCharCode(parseInt(v, 16))).join('')
    // Encode to base64
    const amt = new AMT.Messages()
    const encodedPassword = Buffer.from(result, 'binary').toString('base64')
    context.xmlMessage = amt.AuthorizationService(AMT.Methods.SET_ADMIN_ACL_ENTRY_EX, null, AMTUserName, encodedPassword)
    return await invokeWsmanCall(context)
  }

  async saveDeviceInfoToSecretProvider (context: AMTPasswordContext, event: AMTPasswordEvent): Promise<boolean> {
    const clientObj = devices[context.clientId]
    if (this.configurator?.amtDeviceRepository) {
      const amtDevice: AMTDeviceDTO = {
        guid: clientObj.uuid,
        name: clientObj.hostname,
        amtpass: context.amtPassword,
        mebxpass: clientObj.mebxPassword,
        mpspass: clientObj.mpsPassword,
        mpsuser: clientObj.mpsUsername
      }
      await this.configurator.amtDeviceRepository.insert(amtDevice)
      return true
    } else {
      MqttProvider.publishEvent('fail', ['AMTPasswordChange'], 'Unable to write device', clientObj.uuid)
      this.logger.error('unable to write device')
    }
    return false
  }
}
