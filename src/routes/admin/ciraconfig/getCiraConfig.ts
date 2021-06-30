/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { ICiraConfigDb } from '../../../repositories/interfaces/ICiraConfigDb'
import { CiraConfigDbFactory } from '../../../repositories/factories/CiraConfigDbFactory'
import { CIRAConfig } from '../../../RCS.Config'
import Logger from '../../../Logger'
import { CIRA_CONFIG_NOT_FOUND, API_UNEXPECTED_EXCEPTION, API_RESPONSE } from '../../../utils/constants'

export async function getCiraConfig (req, res): Promise<void> {
  let ciraConfigDb: ICiraConfigDb = null
  const log = new Logger('getCiraConfig')
  const ciraConfigName: string = req.params.ciraConfigName
  try {
    ciraConfigDb = CiraConfigDbFactory.getCiraConfigDb()
    const results: CIRAConfig = await ciraConfigDb.getCiraConfigByName(ciraConfigName)
    if (results != null) {
      // Return null. Check Security objectives around returning passwords.
      delete results.password
      log.verbose(`CIRA config profile : ${JSON.stringify(results)}`)
      res.status(200).json(API_RESPONSE(results)).end()
    } else {
      log.debug(`Not found : ${ciraConfigName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', CIRA_CONFIG_NOT_FOUND(ciraConfigName))).end()
    }
  } catch (error) {
    log.error(`Failed to get CIRA config profile : ${ciraConfigName}`, error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`GET ${ciraConfigName}`))).end()
  }
}
