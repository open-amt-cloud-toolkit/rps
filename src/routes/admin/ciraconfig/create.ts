/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { CIRAConfig } from '../../../models/RCS.Config'
import Logger from '../../../Logger'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'
import handleError from '../../../utils/handleError'

export async function createCiraConfig (req: Request, res: Response): Promise<void> {
  const log = new Logger('createCiraConfig')
  const ciraConfig: CIRAConfig = req.body
  ciraConfig.tenantId = req.tenantId

  try {
    // SQL Query > Insert Data
    const results: CIRAConfig = await req.db.ciraConfigs.insert(ciraConfig)
    // CIRA profile inserted  into db successfully.
    if (results != null) {
      log.verbose(`Created CIRA config : ${ciraConfig.configName}`)
      delete results.password
      MqttProvider.publishEvent('success', ['createCiraConfig'], `Created ${results.configName}`)
      res.status(201).json(results).end()
    }
  } catch (error) {
    handleError(log, ciraConfig.configName, req, res, error)
  }
}
