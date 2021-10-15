/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'
import { TlsConfigs } from '../../../models/RCS.Config'
import { DataWithCount } from '../../../models/Rcs'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function allTlsConfigs (req: Request, res: Response): Promise<void> {
  const log = new Logger('allTlsConfigs')
  const top = Number(req.query.$top)
  const skip = Number(req.query.$skip)
  const includeCount = req.query.$count
  try {
    const configs: TlsConfigs[] = await req.db.tlsConfigs.get(top, skip) || [] as TlsConfigs[]

    if (includeCount == null || includeCount === 'false') {
      res.status(200).json(API_RESPONSE(configs)).end()
    } else {
      const count: number = await req.db.tlsConfigs.getCount()
      const dataWithCount: DataWithCount = {
        data: configs,
        totalCount: count
      }
      res.status(200).json(API_RESPONSE(dataWithCount)).end()
    }
    MqttProvider.publishEvent('success', ['allTlsConfigs'], 'Sent configs')
  } catch (error) {
    MqttProvider.publishEvent('fail', ['allTlsConfigs'], 'Failed to get all the TLS config profiles')
    log.error('Failed to get all the TLS config profiles :', error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION('Get all TLS config profiles'))).end()
  }
}
