/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type Ieee8021xConfig } from '../../../models/RCS.Config.js'
import Logger from '../../../Logger.js'
import { MqttProvider } from '../../../utils/MqttProvider.js'
import { type Request, type Response } from 'express'
import handleError from '../../../utils/handleError.js'
export async function createIEEE8021xProfile(req: Request, res: Response): Promise<void> {
  const ieee8021xConfig: Ieee8021xConfig = req.body
  ieee8021xConfig.tenantId = req.tenantId || ''
  const log = new Logger('createIEEE8021xProfile')
  try {
    if (ieee8021xConfig.pxeTimeout == null) {
      ieee8021xConfig.pxeTimeout = 120
    }
    const results: Ieee8021xConfig | null = await req.db.ieee8021xProfiles.insert(ieee8021xConfig)
    log.verbose(`Created 802.1x profile : ${ieee8021xConfig.profileName}`)
    MqttProvider.publishEvent(
      'success',
      ['createIEEE8021xProfiles'],
      `Created 802.1x profile : ${ieee8021xConfig.profileName}`
    )
    res.status(201).json(results).end()
  } catch (error) {
    handleError(log, 'ieee8021xConfig.profileName', req, res, error)
  }
}
