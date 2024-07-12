/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type Request, type Response } from 'express'
import { MqttProvider } from './MqttProvider.js'
import type Logger from '../Logger.js'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, CONCURRENCY_EXCEPTION, NOT_FOUND_EXCEPTION } from './constants.js'
import { RPSError } from './RPSError.js'

const handleError = (log: Logger, configName: string, req: Request, res: Response, error: any): void => {
  MqttProvider.publishEvent('fail', [req.baseUrl], `Failed to ${req.method}: ${configName}`)
  log.error(`Failed to ${req.method}: ${configName}`, error)
  if (error instanceof RPSError) {
    if (error.name === CONCURRENCY_EXCEPTION) {
      res
        .status(req.get('if-match') ? 412 : 409)
        .set('ETag', error.item.version)
        .json(error.item)
    } else if (error.name === NOT_FOUND_EXCEPTION) {
      res
        .status(404)
        .json(API_RESPONSE(null, NOT_FOUND_EXCEPTION, error.message))
        .end()
    } else {
      res
        .status(400)
        .json(API_RESPONSE(null, error.name, error.message))
        .end()
    }
  } else {
    res
      .status(500)
      .json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`${req.method} ${configName}`)))
      .end()
  }
}

export default handleError
