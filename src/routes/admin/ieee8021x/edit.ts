/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { NOT_FOUND_EXCEPTION, NOT_FOUND_MESSAGE } from '../../../utils/constants.js'
import { type Ieee8021xConfig } from '../../../models/RCS.Config.js'
import Logger from '../../../Logger.js'
import { MqttProvider } from '../../../utils/MqttProvider.js'
import { type Request, type Response } from 'express'
import handleError from '../../../utils/handleError.js'
import { RPSError } from '../../../utils/RPSError.js'

export async function editIEEE8021xProfile (req: Request, res: Response): Promise<void> {
  const log = new Logger('edit8021xProfile')
  try {
    const config: Ieee8021xConfig | null = await req.db.ieee8021xProfiles.getByName(req.body.profileName, req.tenantId)
    if (config == null) {
      throw new RPSError(NOT_FOUND_MESSAGE('802.1x', req.body.profileName), NOT_FOUND_EXCEPTION)
    }
    const updatedConfig: Ieee8021xConfig = { ...config, ...req.body }
    if (req.body.version === null) {
      updatedConfig.version = null
    }
    const results: Ieee8021xConfig | null = await req.db.ieee8021xProfiles.update(updatedConfig)
    MqttProvider.publishEvent('success', ['edit8021xProfiles'], `Updated8021x Profile : ${config.profileName}`)
    res.status(200).json(results).end()
  } catch (error) {
    handleError(log, req.body.profileName, req, res, error)
  }
}
