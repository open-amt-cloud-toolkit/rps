/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { CIRAConfig } from '../../../RCS.Config'
import Logger from '../../../Logger'
import { CIRA_CONFIG_NOT_FOUND, API_UNEXPECTED_EXCEPTION, API_RESPONSE } from '../../../utils/constants'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function getCiraConfig (req: Request, res: Response): Promise<void> {
  const log = new Logger('getCiraConfig')
  const ciraConfigName: string = req.params.ciraConfigName
  try {
    const results: CIRAConfig = await req.db.ciraConfigs.getByName(ciraConfigName)
    if (results != null) {
      // Return null. Check Security objectives around returning passwords.
      delete results.password
      MqttProvider.publishEvent('success', ['getCiraConfig'], `Get CIRA config profile : ${ciraConfigName}`)
      log.verbose(`CIRA config profile : ${JSON.stringify(results)}`)
      res.status(200).json(API_RESPONSE(results)).end()
    } else {
      MqttProvider.publishEvent('fail', ['getCiraConfig'], `Not found : ${ciraConfigName}`)
      log.debug(`Not found : ${ciraConfigName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', CIRA_CONFIG_NOT_FOUND(ciraConfigName))).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['getCiraConfig'], `Failed to get CIRA config profile : ${ciraConfigName}`)
    log.error(`Failed to get CIRA config profile : ${ciraConfigName}`, error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`GET ${ciraConfigName}`))).end()
  }
}
