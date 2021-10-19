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
  boolean: ['force', 'synctime'],
  alias: { t: 'text', p: 'password', f: 'force', e: 'encrypted' }
}

const CommandParser = {
  logger: new Logger('CommandParser') as ILogger,
  parse (msg: ClientMsg): ClientMsg {
    try {
      if (msg?.method?.length > 0) {
        const input: string[] = msg.method.trim().split(' ')
        const args = parseArgs(input, options)

        // TODO: text mode is assumed right now, switch shouldn't be used for method going forward
        if (typeof args.t === 'undefined' && typeof args.e === 'undefined' && input.length > 0 && input[0].length > 0 && !input[0].includes('-')) {
          args.t = input[0]
        }

        if (args.t) {
          msg.method = args.t

          this.logger.silly(`parsed method: ${msg.method}`)

          if (args.profile && msg.payload) {
            msg.payload.profile = args.profile
            this.logger.silly(`parsed profile: ${msg.payload.profile}`)
          }

          if (args.password && msg.payload) {
            msg.payload.password = args.password
            this.logger.silly('parsed password')
          }

          if (args.force && msg.payload) {
            msg.payload.force = args.force
            this.logger.silly(`bypass password check: ${msg.payload.force}`)
          }

          if (msg.method === 'maintenance' && args.synctime && msg.payload) {
            msg.payload.task = 'synctime'
            this.logger.silly(`parsed maintenance task: ${msg.payload.task}`)
          }
        }
      }
    } catch (error) {
      this.logger.error(`parse exception: ${error}`)
    }

    return msg
  }
}

export { CommandParser }
