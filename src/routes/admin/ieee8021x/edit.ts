/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { NOT_FOUND_EXCEPTION, NOT_FOUND_MESSAGE } from '../../../utils/constants'
import { type Ieee8021xConfig } from '../../../models/RCS.Config'
import Logger from '../../../Logger'
import { MqttProvider } from '../../../utils/MqttProvider'
import { type Request, type Response } from 'express'
import handleError from '../../../utils/handleError'
import { RPSError } from '../../../utils/RPSError'

export async function editIEEE8021xProfile (req: Request, res: Response): Promise<void> {
  const log = new Logger('edit8021xProfile')
  try {
    let config: Ieee8021xConfig = await req.db.ieee8021xProfiles.getByName(req.body.profileName, req.tenantId)
    if (config == null) {
      throw new RPSError(NOT_FOUND_MESSAGE('802.1x', req.body.profileName), NOT_FOUND_EXCEPTION)
    } else {
      config = { ...config, ...req.body }
      if (!req.body.version) {
        config.version = null
      }
      const results: Ieee8021xConfig = await req.db.ieee8021xProfiles.update(config)
      MqttProvider.publishEvent('success', ['edit8021xProfiles'], `Updated8021x Profile : ${config.profileName}`)
      res.status(200).json(results).end()
    }
  } catch (error) {
    handleError(log, req.body.profileName, req, res, error)
  }
}
