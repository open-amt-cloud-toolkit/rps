/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type Handler } from 'express'
import statsD from '../utils/stats'

export default function expressStatsdInit (): Handler {
  const client = statsD

  return function expressStatsd (req, res, next) {
    const startTime = new Date().getTime()

    // Function called on response finish that sends stats to statsd
    function sendStats (): void {
      // Status Code
      const statusCode: string = res.statusCode.toString() || 'unknown_status'
      const duration = new Date().getTime() - startTime
      client.increment('request', { statusCode, method: req.method, url: req.baseUrl, duration: duration.toString() })
      client.timing('response_time', duration)

      cleanup()
    }

    // Function to clean up the listeners we've added
    function cleanup (): void {
      res.removeListener('finish', sendStats)
      res.removeListener('error', cleanup)
      res.removeListener('close', cleanup)
    }

    // Add response listeners
    res.once('finish', sendStats)
    res.once('error', cleanup)
    res.once('close', cleanup)

    if (next) {
      next()
    }
  }
}
