/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { CIRAConfig } from '../../../models/RCS.Config'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, CIRA_CONFIG_NOT_FOUND } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function editCiraConfig (req: Request, res: Response): Promise<void> {
  const log = new Logger('editCiraConfig')
  const newConfig: CIRAConfig = req.body
  newConfig.tenantId = req.tenantId
  try {
    const oldConfig: CIRAConfig = await req.db.ciraConfigs.getByName(newConfig.configName)
    if (oldConfig == null) {
      log.debug('Not found : ', newConfig.configName)
      MqttProvider.publishEvent('fail', ['editCiraConfig'], `CIRA config "${newConfig.configName}" not found`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', CIRA_CONFIG_NOT_FOUND(newConfig.configName))).end()
    } else {
      const ciraConfig: CIRAConfig = getUpdatedData(newConfig, oldConfig)
      // TBD: Need to check the ServerAddressFormat, CommonName and MPSServerAddress if they are not updated.
      // SQL Query > Insert Data
      const results = await req.db.ciraConfigs.update(ciraConfig)
      if (results !== undefined) {
        MqttProvider.publishEvent('success', ['editCiraConfig'], `Updated CIRA config profile : ${ciraConfig.configName}`)
        log.verbose(`Updated CIRA config profile : ${ciraConfig.configName}`)
        delete results.password
        res.status(200).json(results).end()
      }
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
