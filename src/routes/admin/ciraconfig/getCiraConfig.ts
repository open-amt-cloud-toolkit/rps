/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { ICiraConfigDb } from '../../../repositories/interfaces/ICiraConfigDb'
import { CiraConfigDbFactory } from '../../../repositories/CiraConfigDbFactory'
import { CIRAConfig } from '../../../RCS.Config'
import Logger from '../../../Logger'
import { CIRA_CONFIG_NOT_FOUND, API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'

export async function getCiraConfig (req, res): Promise<void> {
  let ciraConfigDb: ICiraConfigDb = null
  const log = new Logger('getCiraConfig')
  const ciraConfigName: string = req.params.ciraConfigName
  try {
    ciraConfigDb = CiraConfigDbFactory.getCiraConfigDb()
    const results: CIRAConfig = await ciraConfigDb.getCiraConfigByName(ciraConfigName)
    if (Object.keys(results).length !== 0) {
      // Return null. Check Security objectives around returning passwords.
      results.Password = null
      log.info(`CIRA config profile : ${JSON.stringify(results)}`)
      res.status(200).json(results).end()
    } else {
      log.info(`Not found : ${ciraConfigName}`)
      res.status(404).end(CIRA_CONFIG_NOT_FOUND(ciraConfigName))
    }
  } catch (error) {
    log.error(`Failed to get CIRA config profile : ${ciraConfigName}`, error)
    res.status(500).end(API_UNEXPECTED_EXCEPTION(`GET ${ciraConfigName}`))
  }
}
