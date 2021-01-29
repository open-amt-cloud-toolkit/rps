/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { ICiraConfigDb } from '../../../repositories/interfaces/ICiraConfigDb'
import { CiraConfigDbFactory } from '../../../repositories/CiraConfigDbFactory'
import Logger from '../../../Logger'
import { API_UNEXPECTED_EXCEPTION, CIRA_CONFIG_NOT_FOUND } from '../../../utils/constants'
import { EnvReader } from '../../../utils/EnvReader'
import { RPSError } from '../../../utils/RPSError'

export async function deleteCiraConfig (req, res): Promise<void> {
  const log = new Logger('deleteCiraConfig')
  let ciraConfigDb: ICiraConfigDb = null
  const ciraConfigName: string = req.params.ciraConfigName
  try {
    ciraConfigDb = CiraConfigDbFactory.getCiraConfigDb()
    const result: boolean = await ciraConfigDb.deleteCiraConfigByName(ciraConfigName)
    if (result) {
      if (req.secretsManager) {
        await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfigName}`)
      }
      log.info(`Deleted CIRA config profile : ${ciraConfigName}`)
      res.status(204).end()
    } else {
      log.info(`Not found : ${ciraConfigName}`)
      res.status(404).end(CIRA_CONFIG_NOT_FOUND(ciraConfigName))
    }
  } catch (error) {
    log.error(`Failed to delete CIRA config profile : ${ciraConfigName}`, error)
    if (error instanceof RPSError) {
      res.status(400).end(error.message)
    } else {
      res.status(500).end(API_UNEXPECTED_EXCEPTION(`DELETE ${ciraConfigName}`))
    }
  }
}
