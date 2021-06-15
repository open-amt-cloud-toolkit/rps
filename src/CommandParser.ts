/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Brian Osburn
 * Description: Parse command sent from rpc
 **********************************************************************/

import * as parseArgs from 'minimist'
import { ClientMsg } from './RCS.Config'
import Logger from './Logger'

const options = {
  string: ['text', 'password'],
  boolean: ['force'],
  alias: { t: 'text', p: 'password', f: 'force', e: 'encrypted' }
}

const CommandParser = {
  log: Logger,
  parse (msg: ClientMsg): ClientMsg {
    try {
      if (msg?.method?.length > 0) {
        const input: string[] = msg.method.trim().split(' ')

        this.log.debug(`split input: ${input}`)

        const args = parseArgs(input, options)

        // TODO: text mode is assumed right now, switch shouldn't be used for method going forward
        if (typeof args.t === 'undefined' && typeof args.e === 'undefined' && input.length > 0 && input[0].length > 0 && !input[0].includes('-')) {
          args.t = input[0]
        }

        if (args.t) {
          msg.method = args.t

          this.log.debug(`parsed method: ${msg.method}`)

          if (args.profile && msg.payload) {
            msg.payload.profile = args.profile
            this.log.debug(`parsed profile: ${msg.payload.profile}`)
          }

          if (args.password && msg.payload) {
            msg.payload.password = args.password
            this.log.debug('parsed password')
          }

          if (args.force && msg.payload) {
            msg.payload.force = args.force
            this.log.debug(`bypass password check: ${msg.payload.force}`)
          }
        }
      }
    } catch (error) {
      this.log.error(`parse exception: ${error}`)
    }

    return msg
  }
}

export { CommandParser }
