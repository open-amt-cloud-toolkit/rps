/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type CIRAConfig } from '../../../models/RCS.Config.js'
import Logger from '../../../Logger.js'
import { NOT_FOUND_EXCEPTION, NOT_FOUND_MESSAGE } from '../../../utils/constants.js'
import { MqttProvider } from '../../../utils/MqttProvider.js'
import { type Request, type Response } from 'express'
import handleError from '../../../utils/handleError.js'
import { RPSError } from '../../../utils/RPSError.js'

export async function editCiraConfig (req: Request, res: Response): Promise<void> {
  const log = new Logger('editCiraConfig')
  const newConfig: CIRAConfig = req.body
  newConfig.tenantId = req.tenantId || ''
  try {
    const oldConfig: CIRAConfig | null = await req.db.ciraConfigs.getByName(newConfig.configName, req.tenantId)
    if (oldConfig == null) {
      throw new RPSError(NOT_FOUND_MESSAGE('CIRA', newConfig.configName), NOT_FOUND_EXCEPTION)
    } else {
      const ciraConfig: CIRAConfig = getUpdatedData(newConfig, oldConfig)
      // TBD: Need to check the ServerAddressFormat, CommonName and MPSServerAddress if they are not updated.
      // SQL Query > Insert Data
      const results = await req.db.ciraConfigs.update(ciraConfig)
      if (results != null) {
        // secrets rules: never return sensitive data (passwords) in a response
        delete results.password
        log.verbose(`Updated CIRA config profile : ${ciraConfig.configName}`)
        MqttProvider.publishEvent('success', ['editCiraConfig'], `Updated CIRA config profile : ${ciraConfig.configName}`)
        res.status(200).json(results).end()
      }
    }
  } catch (error) {
    handleError(log, newConfig.configName, req, res, error)
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
  config.version = newConfig.version
  return config
}
