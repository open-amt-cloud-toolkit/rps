/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import Logger from '../../../Logger'
import { Request, Response } from 'express'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, POSTGRES_RESPONSE_CODES, VAULT_RESPONSE_CODES } from '../../../utils/constants'
import { MqttProvider } from '../../../utils/MqttProvider'
import { HealthCheck } from '../../../models/RCS.Config'
import { EnvReader } from '../../../utils/EnvReader'

export async function getHealthCheck (req: Request, res: Response): Promise<void> {
  const log = new Logger('getHealthCheck')
  try {
    const status: HealthCheck = {
      db: {
        name: EnvReader.GlobalEnvConfig.dbProvider.toUpperCase(),
        status: 'OK'
      },
      secretStore: {
        name: 'VAULT',
        status: 'OK'
      }
    }
    try {
      await req.db.query('SELECT 1')
    } catch (dbError) {
      status.db.status = POSTGRES_RESPONSE_CODES(dbError?.code)
    }
    try {
      const secretManagerHealth = await req.secretsManager.health()
      status.secretStore.status = secretManagerHealth
    } catch (secretProviderError) {
      if (secretProviderError.error) {
        status.secretStore.status = secretProviderError.error.code
      } else if (secretProviderError.response?.statusCode) {
        status.secretStore.status = VAULT_RESPONSE_CODES(secretProviderError.response.statusCode)
      }
    }

    res.status(200)
    if (status.db.status !== 'OK' || status.secretStore.status.initialized !== true || status.secretStore.status.sealed === true) {
      res.status(503)
    }

    res.json(status).end()
  } catch (error) {
    MqttProvider.publishEvent('fail', ['getHealthCheck'], 'Failed to get health')
    log.error('Failed to get health', JSON.stringify(error))
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION('Health Check failed'))).end()
  }
}
