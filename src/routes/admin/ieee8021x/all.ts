/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { API_RESPONSE } from '../../../utils/constants.js'
import Logger from '../../../Logger.js'
import { type DataWithCount } from '../../../models/index.js'
import { MqttProvider } from '../../../utils/MqttProvider.js'
import { type Request, type Response } from 'express'
import handleError from '../../../utils/handleError.js'
import { type Ieee8021xConfig } from '../../../models/RCS.Config.js'

export async function getAllIEEE8021xConfigs(req: Request, res: Response): Promise<void> {
  const log = new Logger('getAllIEEE8021xConfigs')
  const top = Number(req.query.$top)
  const skip = Number(req.query.$skip)
  const includeCount = req.query.$count
  try {
    let ieee8021xConfigs: Ieee8021xConfig[] = await req.db.ieee8021xProfiles.get(top, skip)
    if (ieee8021xConfigs.length >= 0) {
      ieee8021xConfigs = ieee8021xConfigs.map((result: Ieee8021xConfig) => {
        delete result.password
        return result
      })
    }
    if (includeCount == null || includeCount === 'false') {
      res.status(200).json(API_RESPONSE(ieee8021xConfigs)).end()
    } else {
      const count: number = await req.db.ieee8021xProfiles.getCount()
      const dataWithCount: DataWithCount = {
        data: ieee8021xConfigs,
        totalCount: count
      }
      res.status(200).json(API_RESPONSE(dataWithCount)).end()
    }
    MqttProvider.publishEvent('success', ['getAllIEEE8021xConfigs'], 'Sent all 802.1x configurations')
  } catch (error) {
    handleError(log, '', req, res, error)
  }
}
