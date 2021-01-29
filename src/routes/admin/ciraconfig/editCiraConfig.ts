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
import { API_UNEXPECTED_EXCEPTION, CIRA_CONFIG_NOT_FOUND } from '../../../utils/constants'
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
    if (Object.keys(oldConfig).length === 0) {
      log.info('Not found : ', newConfig.configName)
      res.status(404).end(CIRA_CONFIG_NOT_FOUND(newConfig.configName))
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
    res.status(500).end(API_UNEXPECTED_EXCEPTION(`UPDATE ${newConfig.ConfigName}`))
  }
}

function getUpdatedData (newConfig: any, oldConfig: CIRAConfig): CIRAConfig {
  const config: CIRAConfig = {} as CIRAConfig
  config.ConfigName = newConfig.configName

  if (newConfig.mpsServerAddress == null) {
    config.MPSServerAddress = oldConfig.MPSServerAddress
  } else {
    config.MPSServerAddress = newConfig.mpsServerAddress
  }
  if (newConfig.mpsPort == null) {
    config.MPSPort = oldConfig.MPSPort
  } else {
    config.MPSPort = newConfig.mpsPort
  }
  if (newConfig.username == null) {
    config.Username = oldConfig.Username
  } else {
    config.Username = newConfig.username
  }
  if (newConfig.password == null) {
    config.Password = oldConfig.Password
  } else {
    config.Password = newConfig.password
  }
  if (newConfig.commonName == null) {
    config.CommonName = oldConfig.CommonName
  } else {
    config.CommonName = newConfig.commonName
  }
  if (newConfig.serverAddressFormat == null) {
    config.ServerAddressFormat = oldConfig.ServerAddressFormat
  } else {
    config.ServerAddressFormat = newConfig.serverAddressFormat
  }
  if (newConfig.mpsRootCertificate == null) {
    config.MPSRootCertificate = oldConfig.MPSRootCertificate
  } else {
    config.MPSRootCertificate = newConfig.mpsRootCertificate
  }
  if (newConfig.proxyDetails == null) {
    config.ProxyDetails = oldConfig.ProxyDetails
  } else {
    config.ProxyDetails = newConfig.proxyDetails
  }
  if (newConfig.authMethod == null) {
    config.AuthMethod = oldConfig.AuthMethod
  } else {
    config.AuthMethod = newConfig.authMethod
  }
  return config
}
