/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import Logger from '../../../Logger'
import { WirelessConfig } from '../../../RCS.Config'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'
import { DataWithCount } from '../../../models/Rcs'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

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
    MqttProvider.publishEvent('fail', ['allWirelessProfiles'], 'Failed to get all wireless profiles')
    log.error('Failed to get all network profiles :', error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION('GET all Network Configs'))).end()
  }
}
