/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { ICiraConfigDb } from '../../../interfaces/database/ICiraConfigDb'
import { CiraConfigDbFactory } from '../../../repositories/factories/CiraConfigDbFactory'
import { CIRAConfig } from '../../../RCS.Config'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { PasswordHelper } from '../../../utils/PasswordHelper'
import {
  API_UNEXPECTED_EXCEPTION,
  API_RESPONSE,
  AMTRandomPasswordLength
} from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function createCiraConfig (req: Request, res: Response): Promise<void> {
  const log = new Logger('createCiraConfig')
  let ciraConfigDb: ICiraConfigDb
  const ciraConfig: CIRAConfig = req.body
  ciraConfig.tenantId = req.tenantId

  try {
    ciraConfigDb = CiraConfigDbFactory.getCiraConfigDb()
    const mpsPwd = ciraConfig.password ?? PasswordHelper.generateRandomPassword(AMTRandomPasswordLength)
    if (req.secretsManager) {
      ciraConfig.password = 'MPS_PASSWORD'
    }
    // SQL Query > Insert Data
    const results: CIRAConfig = await ciraConfigDb.insert(ciraConfig)
    // CIRA profile inserted  into db successfully.
    if (results != null) {
      // store the password into Vault
      if (req.secretsManager && ciraConfig.password) {
        await req.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfig.configName}`, ciraConfig.password, mpsPwd)
        log.debug(`MPS password stored in Vault for CIRA config : ${ciraConfig.configName}`)
      }
      log.verbose(`Created CIRA config : ${ciraConfig.configName}`)
      delete results.password
      MqttProvider.publishEvent('success', ['createCiraConfig'], `Created ${results.configName}`)
      res.status(201).json(results).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['createCiraConfig'], `Failed to create CIRA config profile ${ciraConfig.configName}`)
    log.error(`Failed to create CIRA config profile : ${ciraConfig.configName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`CREATE ${ciraConfig.configName}`))).end()
    }
  }
}
