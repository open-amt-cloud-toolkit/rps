/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import Logger from '../../../Logger'
import { API_RESPONSE } from '../../../utils/constants'
import { type CIRAConfig } from '../../../models/RCS.Config'
import { type DataWithCount } from '../../../models'
import { MqttProvider } from '../../../utils/MqttProvider'
import { type Request, type Response } from 'express'
import handleError from '../../../utils/handleError'

export async function allCiraConfigs (req: Request, res: Response): Promise<void> {
  const log = new Logger('allCiraConfigs')
  const top = Number(req.query.$top)
  const skip = Number(req.query.$skip)
  const includeCount = req.query.$count
  try {
    let ciraConfigs: CIRAConfig[] = await req.db.ciraConfigs.get(top, skip, req.tenantId)
    if (ciraConfigs.length >= 0) {
      ciraConfigs = ciraConfigs.map((result: CIRAConfig) => {
        delete result.password
        return result
      })
    }
    if (includeCount == null || includeCount === 'false') {
      res.status(200).json(API_RESPONSE(ciraConfigs))
    } else {
      const count: number = await req.db.ciraConfigs.getCount(req.tenantId)
      const dataWithCount: DataWithCount = {
        data: ciraConfigs,
        totalCount: count
      }

      res.status(200).json(API_RESPONSE(dataWithCount))
    }
    MqttProvider.publishEvent('success', ['allCiraConfigs'], 'Sent configs')
  } catch (error) {
    handleError(log, '', req, res, error)
  }
}
