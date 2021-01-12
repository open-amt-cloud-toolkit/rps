/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Brian Osburn
 * Description: Parse command sent from rpc
 **********************************************************************/

import * as parseArgs from 'minimist'
import { ClientMsg } from './RCS.Config'
import Logger from './Logger'
import { ILogger } from './interfaces/ILogger'

const options = {
  string: ['text', 'password'],
  boolean: ['force'],
  alias: { t: 'text', p: 'password', f: 'force', e: 'encrypted' }
}

export class CommandParser {
  static logger: ILogger = new Logger('CommandParser')

  static parse (msg: ClientMsg): ClientMsg {
    try {
      if (msg && msg.method && msg.method.length > 0) {
        const input: string[] = msg.method.trim().split(' ')

        this.logger.debug(`split input: ${input}`)

        const args = parseArgs(input, options)

        // TODO: text mode is assumed right now, switch shouldn't be used for method going forward
        if (typeof args.t === 'undefined' && typeof args.e === 'undefined' && input.length > 0 && input[0].length > 0 && !input[0].includes('-')) {
          args.t = input[0]
        }

        if (args.t) {
          msg.method = args.t

          this.logger.debug(`parsed method: ${msg.method}`)

          if (args.profile && msg.payload) {
            msg.payload.profile = args.profile
            this.logger.debug(`parsed profile: ${msg.payload.profile}`)
          }

          if (args.password && msg.payload) {
            msg.payload.password = args.password
            this.logger.debug('parsed password')
          }

          if (args.force && msg.payload) {
            msg.payload.force = args.force
            this.logger.debug(`bypass password check: ${msg.payload.force}`)
          }
        }
      }
    } catch (error) {
      this.logger.error(`parse exception: ${error}`)
    }

    return msg
  }
}
