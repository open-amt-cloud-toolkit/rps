/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import Logger from '../../../Logger'
import { type WirelessConfig } from '../../../models/RCS.Config'
import { API_RESPONSE } from '../../../utils/constants'
import { type DataWithCount } from '../../../models'
import { MqttProvider } from '../../../utils/MqttProvider'
import { type Request, type Response } from 'express'
import handleError from '../../../utils/handleError'

export async function allProfiles (req: Request, res: Response): Promise<void> {
  const log = new Logger('allProfiles')
  const top = Number(req.query.$top)
  const skip = Number(req.query.$skip)
  const includeCount = req.query.$count
  try {
    let wirelessConfigs: WirelessConfig[] = await req.db.wirelessProfiles.get(top, skip)
    if (wirelessConfigs.length >= 0) {
      wirelessConfigs = wirelessConfigs.map((result: WirelessConfig) => {
        delete result.pskPassphrase
        return result
      })
    }
    if (includeCount == null || includeCount === 'false') {
      res.status(200).json(API_RESPONSE(wirelessConfigs)).end()
    } else {
      const count: number = await req.db.wirelessProfiles.getCount()
      const dataWithCount: DataWithCount = {
        data: wirelessConfigs,
        totalCount: count
      }
      res.status(200).json(API_RESPONSE(dataWithCount)).end()
    }
    MqttProvider.publishEvent('success', ['allWirelessProfiles'], 'Sent wireless profiles')
  } catch (error) {
    handleError(log, '', req, res, error)
  }
}
