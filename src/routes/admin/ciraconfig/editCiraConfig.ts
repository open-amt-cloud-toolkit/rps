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
import { AMTRandomPasswordLength, API_RESPONSE, API_UNEXPECTED_EXCEPTION, CIRA_CONFIG_NOT_FOUND } from '../../../utils/constants'
import { validationResult } from 'express-validator'
import { RPSError } from '../../../utils/RPSError'
import { MqttProvider } from '../../../utils/MqttProvider'
import { PasswordHelper } from '../../../utils/PasswordHelper'

export async function editCiraConfig (req, res): Promise<void> {
  const log = new Logger('editCiraConfig')
  let ciraConfigDb: ICiraConfigDb = null
  const newConfig: CIRAConfig = req.body
  newConfig.tenantId = req.tenantId
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }
    ciraConfigDb = CiraConfigDbFactory.getCiraConfigDb()
    const oldConfig: CIRAConfig = await ciraConfigDb.getByName(newConfig.configName)
    if (oldConfig == null) {
      log.debug('Not found : ', newConfig.configName)
      MqttProvider.publishEvent('fail', ['editCiraConfig'], `CIRA config "${newConfig.configName}" not found`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', CIRA_CONFIG_NOT_FOUND(newConfig.configName))).end()
    } else {
      const ciraConfig: CIRAConfig = getUpdatedData(newConfig, oldConfig)
      const mpsPwd = newConfig.regeneratePassword ? PasswordHelper.generateRandomPassword(AMTRandomPasswordLength) : newConfig.password
      if (req.secretsManager) {
        ciraConfig.password = 'MPS_PASSWORD'
      }
      // TBD: Need to check the ServerAddressFormat, CommonName and MPSServerAddress if they are not updated.
      // SQL Query > Insert Data
      const results = await ciraConfigDb.update(ciraConfig)
      if (results !== undefined) {
        if (req.secretsManager) {
          if (mpsPwd != null) {
            await req.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfig.configName}`, ciraConfig.password, mpsPwd)
            log.debug(`MPS password updated in Vault for CIRA Config ${ciraConfig.configName}`)
          }
        }
      }
      MqttProvider.publishEvent('success', ['editCiraConfig'], `Updated CIRA config profile : ${ciraConfig.configName}`)
      log.verbose(`Updated CIRA config profile : ${ciraConfig.configName}`)
      delete results.password
      res.status(200).json(results).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['editCiraConfig'], `Failed to update CIRA config : ${newConfig.configName}`)
    log.error(`Failed to update CIRA config : ${newConfig.configName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`UPDATE ${newConfig.configName}`))).end()
    }
  }
}

function getUpdatedData (newConfig: CIRAConfig, oldConfig: CIRAConfig): CIRAConfig {
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
  config.tenantId = newConfig.tenantId ?? oldConfig.tenantId
  return config
}
