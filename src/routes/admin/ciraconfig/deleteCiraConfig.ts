/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { ICiraConfigDb } from '../../../repositories/interfaces/ICiraConfigDb'
import { CiraConfigDbFactory } from '../../../repositories/CiraConfigDbFactory'
import Logger from '../../../Logger'
import { CIRA_CONFIG_DELETION_FAILED } from '../../../utils/constants'

export async function deleteCiraConfig (req, res): Promise<void> {
  let ciraConfigDb: ICiraConfigDb = null
  const log = new Logger('deleteCiraConfig')
  const { ciraConfigName } = req.params
  try {
    ciraConfigDb = CiraConfigDbFactory.getCiraConfigDb()

    let error
    const results = await ciraConfigDb.deleteCiraConfigByName(ciraConfigName).catch((reason) => {
      error = reason
    })
    if (error) {
      res.status(404).end(error)
    } else {
      res.status(200).end(results)
    }
  } catch (error) {
    log.error(error)
    res.status(500).end(CIRA_CONFIG_DELETION_FAILED(ciraConfigName))
  }
}
