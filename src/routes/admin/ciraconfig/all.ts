/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'
import { CIRAConfig } from '../../../models/RCS.Config'
import { DataWithCount } from '../../../models'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function allCiraConfigs (req: Request, res: Response): Promise<void> {
  const log = new Logger('allCiraConfigs')
  const top = Number(req.query.$top)
  const skip = Number(req.query.$skip)
  const includeCount = req.query.$count
  try {
    let ciraConfigs: CIRAConfig[] = await req.db.ciraConfigs.get(top, skip)
    if (ciraConfigs.length >= 0) {
      ciraConfigs = ciraConfigs.map((result: CIRAConfig) => {
        delete result.password
        return result
      })
    }
    if (includeCount == null || includeCount === 'false') {
      res.status(200).json(API_RESPONSE(ciraConfigs)).end()
    } else {
      const count: number = await req.db.ciraConfigs.getCount()
      const dataWithCount: DataWithCount = {
        data: ciraConfigs,
        totalCount: count
      }
      res.status(200).json(API_RESPONSE(dataWithCount)).end()
    }
    MqttProvider.publishEvent('success', ['allCiraConfigs'], 'Sent configs')
  } catch (error) {
    MqttProvider.publishEvent('fail', ['allCiraConfigs'], 'Failed to get all the CIRA config profiles')
    log.error('Failed to get all the CIRA config profiles :', error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION('Get all CIRA config profiles'))).end()
  }
}
