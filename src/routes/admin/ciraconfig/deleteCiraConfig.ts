/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { ICiraConfigDb } from '../../../interfaces/database/ICiraConfigDb'
import { CiraConfigDbFactory } from '../../../repositories/factories/CiraConfigDbFactory'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, CIRA_CONFIG_NOT_FOUND } from '../../../utils/constants'
import { EnvReader } from '../../../utils/EnvReader'
import { RPSError } from '../../../utils/RPSError'
import { MqttProvider } from '../../../utils/MqttProvider'

export async function deleteCiraConfig (req, res): Promise<void> {
  const log = new Logger('deleteCiraConfig')
  let ciraConfigDb: ICiraConfigDb = null
  const ciraConfigName: string = req.params.ciraConfigName
  try {
    ciraConfigDb = CiraConfigDbFactory.getCiraConfigDb()
    const result: boolean = await ciraConfigDb.delete(ciraConfigName)
    if (result) {
      if (req.secretsManager) {
        await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfigName}`)
      }
      MqttProvider.publishEvent('success', ['deleteCiraConfig'], `Deleted CIRA config : ${ciraConfigName}`)
      log.verbose(`Deleted CIRA config profile : ${ciraConfigName}`)
      res.status(204).end()
    } else {
      MqttProvider.publishEvent('fail', ['deleteCiraConfig'], `CIRA config "${ciraConfigName}" not found`)
      log.debug(`Not found : ${ciraConfigName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', CIRA_CONFIG_NOT_FOUND(ciraConfigName))).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['deleteCiraConfig'], `Failed to delete CIRA config : ${ciraConfigName}`)
    log.error(`Failed to delete CIRA config profile : ${ciraConfigName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`DELETE ${ciraConfigName}`))).end()
    }
  }
}
