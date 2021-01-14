/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { ICiraConfigDb } from '../../../repositories/interfaces/ICiraConfigDb'
import { CiraConfigDbFactory } from '../../../repositories/CiraConfigDbFactory'
import Logger from '../../../Logger'
import { CIRA_CONFIG_EMPTY, CIRA_CONFIG_ERROR } from '../../../utils/constants'

export async function allCiraConfigs (req, res): Promise<void> {
  let ciraConfigDb: ICiraConfigDb = null
  const log = new Logger('allCiraConfigs')
  try {
    ciraConfigDb = CiraConfigDbFactory.getCiraConfigDb()
    // TODO: remove this?
    const mapperFn = async (configName, ciraMpsPassword): Promise<any> => {
      return null
    }
    const results = await ciraConfigDb.getAllCiraConfigs(mapperFn)
    if (typeof results === 'undefined' || results.length === 0) {
      res.status(404).end(CIRA_CONFIG_EMPTY)
    } else {
      res.status(200).json(results).end()
    }
  } catch (error) {
    log.error(error)
    res.status(500).end(CIRA_CONFIG_ERROR(''))
  }
}
