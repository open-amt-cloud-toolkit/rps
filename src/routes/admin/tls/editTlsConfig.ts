/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { TlsConfigs } from '../../../models/RCS.Config'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, TLS_CONFIG_NOT_FOUND } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function editTlsConfig (req: Request, res: Response): Promise<void> {
  const log = new Logger('editTlsConfig')
  const newConfig: TlsConfigs = req.body
  newConfig.tenantId = req.tenantId
  try {
    const oldConfig: TlsConfigs = await req.db.tlsConfigs.getByName(newConfig.configName)
    if (oldConfig == null) {
      log.debug('Not found : ', newConfig.configName)
      MqttProvider.publishEvent('fail', ['editTlsConfig'], `TLS config "${newConfig.configName}" not found`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', TLS_CONFIG_NOT_FOUND(newConfig.configName))).end()
    } else {
      const config: TlsConfigs = getUpdatedData(newConfig, oldConfig)

      // SQL Query > Insert Data
      const results = await req.db.tlsConfigs.update(config)

      MqttProvider.publishEvent('success', ['editTlsConfig'], `Updated TLS config profile : ${config.configName}`)
      log.verbose(`Updated TLS config profile : ${config.configName}`)

      res.status(200).json(results).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['editTlsConfig'], `Failed to update TLS config : ${newConfig.configName}`)
    log.error(`Failed to update TLS config : ${newConfig.configName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`UPDATE ${newConfig.configName}`))).end()
    }
  }
}

export function getUpdatedData (newConfig: TlsConfigs, oldConfig: TlsConfigs): TlsConfigs {
  const config: TlsConfigs = { configName: newConfig.configName } as TlsConfigs

  config.configName = oldConfig.configName
  config.commonName = oldConfig.commonName
  config.organization = oldConfig.organization
  config.stateOrProvince = oldConfig.stateOrProvince
  config.country = oldConfig.country
  config.isTrustedCert = newConfig.isTrustedCert ?? oldConfig.isTrustedCert
  config.tlsMode = newConfig.tlsMode ?? oldConfig.tlsMode
  config.tenantId = newConfig.tenantId ?? oldConfig.tenantId
  config.certVersion = newConfig.certVersion ?? oldConfig.certVersion
  config.issuedCommonName = oldConfig.issuedCommonName

  return config
}
