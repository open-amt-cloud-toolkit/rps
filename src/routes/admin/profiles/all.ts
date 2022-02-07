/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import Logger from '../../../Logger'
import { AMTConfiguration, DataWithCount } from '../../../models'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function allProfiles (req: Request, res: Response): Promise<void> {
  const log = new Logger('allProfiles')
  let amtConfigs: AMTConfiguration[] = [] as AMTConfiguration[]
  const top = Number(req.query.$top)
  const skip = Number(req.query.$skip)
  const includeCount = req.query.$count
  try {
    amtConfigs = await req.db.profiles.get(top, skip)
    if (includeCount == null || includeCount === 'false') {
      res.status(200).json(API_RESPONSE(amtConfigs)).end()
    } else {
      const count: number = await req.db.profiles.getCount()
      const dataWithCount: DataWithCount = {
        data: amtConfigs,
        totalCount: count
      }
      res.status(200).json(API_RESPONSE(dataWithCount)).end()
    }
    MqttProvider.publishEvent('success', ['allProfiles'], 'Sent profiles')
  } catch (error) {
    MqttProvider.publishEvent('fail', ['allProfiles'], 'Failed to get all profiles')
    log.error('Failed to get all the AMT Profiles :', error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION('GET all AMT profiles'))).end()
  }
}
