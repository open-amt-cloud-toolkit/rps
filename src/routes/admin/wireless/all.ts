/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import Logger from '../../../Logger.js'
import { type WirelessConfig } from '../../../models/RCS.Config.js'
import { API_RESPONSE } from '../../../utils/constants.js'
import { type DataWithCount } from '../../../models/index.js'
import { MqttProvider } from '../../../utils/MqttProvider.js'
import { type Request, type Response } from 'express'
import handleError from '../../../utils/handleError.js'

export async function allProfiles (req: Request, res: Response): Promise<void> {
  let wirelessConfigs: any[] = []
  const log = new Logger('allProfiles')
  const top = Number(req.query.$top)
  const skip = Number(req.query.$skip)
  const includeCount = req.query.$count
  try {
    const configs: WirelessConfig[] = await req.db.wirelessProfiles.get(top, skip, req.tenantId)
    if (configs.length > 0) {
      wirelessConfigs = configs.map((result: WirelessConfig) => {
        // delete result.pskPassphrase
        const { pskPassphrase, ...response } = result
        return response
      })
    }
    if (includeCount == null || includeCount === 'false') {
      res.status(200).json(API_RESPONSE(wirelessConfigs)).end()
    } else {
      const count: number = await req.db.wirelessProfiles.getCount(req.tenantId)
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
