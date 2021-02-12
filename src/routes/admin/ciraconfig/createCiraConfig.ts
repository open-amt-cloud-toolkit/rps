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
  API_UNEXPECTED_EXCEPTION
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

    ciraConfig.ConfigName = req.body.payload.configName
    ciraConfig.MPSServerAddress = req.body.payload.mpsServerAddress
    ciraConfig.MPSPort = req.body.payload.mpsPort
    ciraConfig.Username = req.body.payload.username
    ciraConfig.Password = req.body.payload.password
    ciraConfig.CommonName = req.body.payload.commonName
    ciraConfig.ServerAddressFormat = req.body.payload.serverAddressFormat
    ciraConfig.MPSRootCertificate = req.body.payload.mpsRootCertificate
    ciraConfig.ProxyDetails = req.body.payload.proxyDetails
    ciraConfig.AuthMethod = req.body.payload.authMethod

    const mpsPwd = ciraConfig.Password
    if (req.secretsManager) {
      ciraConfig.Password = `${ciraConfig.ConfigName}_CIRA_PROFILE_PASSWORD`
    }
    // SQL Query > Insert Data
    const results: boolean = await ciraConfigDb.insertCiraConfig(ciraConfig)
    // CIRA profile inserted  into db successfully.
    if (results) {
      // store the password into Vault
      if (req.secretsManager) {
        await req.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfig.ConfigName}`, ciraConfig.Password, mpsPwd)
        log.info(`MPS password stored in Vault for CIRA config : ${ciraConfig.ConfigName}`)
      }
      log.info(`Created CIRA config : ${ciraConfig.ConfigName}`)
      res.status(201).end(CIRA_CONFIG_INSERTION_SUCCESS(ciraConfig.ConfigName))
    }
  } catch (error) {
    log.error(`Failed to get CIRA config profile : ${ciraConfig.ConfigName}`, error)
    if (error instanceof RPSError) {
      res.status(400).end(error.message)
    } else {
      res.status(500).end(API_UNEXPECTED_EXCEPTION(`CREATE ${ciraConfig.ConfigName}`))
    }
  }
}
