/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { validationResult } from 'express-validator'
import { ICiraConfigDb } from '../../../repositories/interfaces/ICiraConfigDb'
import { CiraConfigDbFactory } from '../../../repositories/CiraConfigDbFactory'
import { CIRAConfig } from '../../../RCS.Config'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import {
  CIRA_CONFIG_INSERTION_SUCCESS,
  API_UNEXPECTED_EXCEPTION,
  API_RESPONSE
} from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'

export async function createCiraConfig (req, res): Promise<void> {
  const log = new Logger('createCiraConfig')
  let ciraConfigDb: ICiraConfigDb
  const ciraConfig: CIRAConfig = {} as CIRAConfig
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }
    ciraConfigDb = CiraConfigDbFactory.getCiraConfigDb()

    ciraConfig.configName = req.body.payload.configName
    ciraConfig.mpsServerAddress = req.body.payload.mpsServerAddress
    ciraConfig.mpsPort = req.body.payload.mpsPort
    ciraConfig.username = req.body.payload.username
    ciraConfig.password = req.body.payload.password
    ciraConfig.commonName = req.body.payload.commonName
    ciraConfig.serverAddressFormat = req.body.payload.serverAddressFormat
    ciraConfig.mpsRootCertificate = req.body.payload.mpsRootCertificate
    ciraConfig.proxyDetails = req.body.payload.proxyDetails
    ciraConfig.authMethod = req.body.payload.authMethod

    const mpsPwd = ciraConfig.password
    if (req.secretsManager) {
      ciraConfig.password = `${ciraConfig.configName}_CIRA_PROFILE_PASSWORD`
    }
    // SQL Query > Insert Data
    const results: boolean = await ciraConfigDb.insertCiraConfig(ciraConfig)
    // CIRA profile inserted  into db successfully.
    if (results) {
      // store the password into Vault
      if (req.secretsManager) {
        await req.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfig.configName}`, ciraConfig.password, mpsPwd)
        log.info(`MPS password stored in Vault for CIRA config : ${ciraConfig.configName}`)
      }
      log.info(`Created CIRA config : ${ciraConfig.configName}`)
      res.status(201).json(API_RESPONSE(null, null, CIRA_CONFIG_INSERTION_SUCCESS(ciraConfig.configName))).end()
    }
  } catch (error) {
    log.error(`Failed to get CIRA config profile : ${ciraConfig.configName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`CREATE ${ciraConfig.configName}`))).end()
    }
  }
}
