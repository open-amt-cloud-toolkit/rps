/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { ICiraConfigDb } from '../../../repositories/interfaces/ICiraConfigDb'
import { CiraConfigDbFactory } from '../../../repositories/CiraConfigDbFactory'
import { CIRAConfig } from '../../../RCS.Config'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, CIRA_CONFIG_NOT_FOUND } from '../../../utils/constants'
import { validationResult } from 'express-validator'

export async function editCiraConfig (req, res): Promise<void> {
  const log = new Logger('editCiraConfig')
  let ciraConfigDb: ICiraConfigDb = null
  const newConfig = req.body.payload
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
        ciraConfig.Password = `${ciraConfig.ConfigName}_CIRA_PROFILE_PASSWORD`
      }
      // TBD: Need to check the ServerAddressFormat, CommonName and MPSServerAddress if they are not updated.
      // SQL Query > Insert Data
      const results = await ciraConfigDb.updateCiraConfig(ciraConfig)
      if (results !== undefined) {
        // update the password in Vault if not null
        if (req.secretsManager && mpsPwd !== null) {
          await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfig.ConfigName}`)
          await req.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfig.ConfigName}`, ciraConfig.Password, mpsPwd)
          log.info(`MPS password updated in Vault for CIRA Config ${ciraConfig.ConfigName}`)
        }
      }
      log.info(`Updated CIRA config profile : ${ciraConfig.ConfigName}`)
      res.status(204).end()
    }
  } catch (error) {
    log.error(`Failed to update CIRA config : ${newConfig.ConfigName}`, error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`UPDATE ${newConfig.ConfigName}`))).end()
  }
}

function getUpdatedData (newConfig: any, oldConfig: CIRAConfig): CIRAConfig {
  const config: CIRAConfig = { ConfigName: newConfig.configName } as CIRAConfig
  config.MPSServerAddress = newConfig.mpsServerAddress ?? oldConfig.MPSServerAddress
  config.MPSPort = newConfig.mpsPort ?? oldConfig.MPSPort
  config.Username = newConfig.username ?? oldConfig.Username
  config.Password = newConfig.password ?? oldConfig.Password
  config.CommonName = newConfig.commonName ?? oldConfig.CommonName
  config.ServerAddressFormat = newConfig.serverAddressFormat ?? oldConfig.ServerAddressFormat
  config.MPSRootCertificate = newConfig.mpsRootCertificate ?? oldConfig.MPSRootCertificate
  config.ProxyDetails = newConfig.proxyDetails ?? oldConfig.ProxyDetails
  config.AuthMethod = newConfig.authMethod ?? oldConfig.AuthMethod
  return config
}
