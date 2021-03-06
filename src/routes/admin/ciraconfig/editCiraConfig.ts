/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { ICiraConfigDb } from '../../../repositories/interfaces/ICiraConfigDb'
import { CiraConfigDbFactory } from '../../../repositories/factories/CiraConfigDbFactory'
import { CIRAConfig } from '../../../RCS.Config'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, CIRA_CONFIG_NOT_FOUND } from '../../../utils/constants'
import { validationResult } from 'express-validator'
import { RPSError } from '../../../utils/RPSError'

export async function editCiraConfig (req, res): Promise<void> {
  const log = new Logger('editCiraConfig')
  let ciraConfigDb: ICiraConfigDb = null
  const newConfig = req.body
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }
    ciraConfigDb = CiraConfigDbFactory.getCiraConfigDb()
    const oldConfig: CIRAConfig = await ciraConfigDb.getCiraConfigByName(newConfig.configName)
    if (oldConfig == null) {
      log.info('Not found : ', newConfig.configName)
      res.status(404).json(API_RESPONSE(null, 'Not Found', CIRA_CONFIG_NOT_FOUND(newConfig.configName))).end()
    } else {
      const ciraConfig: CIRAConfig = getUpdatedData(newConfig, oldConfig)
      const mpsPwd = newConfig.password
      if (req.secretsManager) {
        ciraConfig.password = `${ciraConfig.configName}_CIRA_PROFILE_PASSWORD`
      }
      // TBD: Need to check the ServerAddressFormat, CommonName and MPSServerAddress if they are not updated.
      // SQL Query > Insert Data
      const results = await ciraConfigDb.updateCiraConfig(ciraConfig)
      if (results !== undefined) {
        // update the password in Vault if not null
        if (req.secretsManager && mpsPwd !== null) {
          await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfig.configName}`)
          await req.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfig.configName}`, ciraConfig.password, mpsPwd)
          log.info(`MPS password updated in Vault for CIRA Config ${ciraConfig.configName}`)
        }
      }
      log.info(`Updated CIRA config profile : ${ciraConfig.configName}`)
      delete results.password
      res.status(200).json(results).end()
    }
  } catch (error) {
    log.error(`Failed to update CIRA config : ${newConfig.ConfigName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`UPDATE ${newConfig.ConfigName}`))).end()
    }
  }
}

function getUpdatedData (newConfig: any, oldConfig: CIRAConfig): CIRAConfig {
  const config: CIRAConfig = { configName: newConfig.configName } as CIRAConfig
  config.mpsServerAddress = newConfig.mpsServerAddress ?? oldConfig.mpsServerAddress
  config.mpsPort = newConfig.mpsPort ?? oldConfig.mpsPort
  config.username = newConfig.username ?? oldConfig.username
  config.password = newConfig.password ?? oldConfig.password
  config.commonName = newConfig.commonName ?? oldConfig.commonName
  config.serverAddressFormat = newConfig.serverAddressFormat ?? oldConfig.serverAddressFormat
  config.mpsRootCertificate = newConfig.mpsRootCertificate ?? oldConfig.mpsRootCertificate
  config.proxyDetails = newConfig.proxyDetails ?? oldConfig.proxyDetails
  config.authMethod = newConfig.authMethod ?? oldConfig.authMethod
  return config
}
