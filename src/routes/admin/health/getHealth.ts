/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import Logger from '../../../Logger'
import { Request, Response } from 'express'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'
import { MqttProvider } from '../../../utils/MqttProvider'
import { healthCheckError } from '../../../RCS.Config'

export async function getHealthCheck (req: Request, res: Response): Promise<void> {
  const log = new Logger('getHealthCheck')
  try {
    const errors: healthCheckError[] = await req.configurator.healthCheck.getHealthCheck()

    if (errors.length === 0) {
      res.status(200).end()
    } else {
      MqttProvider.publishEvent('fail', ['getHealthCheck'], 'Failed to get health')
      log.error('Failed to get health', JSON.stringify(errors))
      res.status(503).json(errors).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['getHealthCheck'], 'Failed to get health')
    log.error('Failed to get health', JSON.stringify(error))
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION('Health Check failed'))).end()
  }
}
