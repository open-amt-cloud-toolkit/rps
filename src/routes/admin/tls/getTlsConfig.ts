/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { TlsConfigs } from '../../../models/RCS.Config'
import Logger from '../../../Logger'
import { API_UNEXPECTED_EXCEPTION, API_RESPONSE, TLS_CONFIG_NOT_FOUND } from '../../../utils/constants'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function getTlsConfig (req: Request, res: Response): Promise<void> {
  const log = new Logger('getTlsConfig')
  const configName: string = req.params.configName
  try {
    const results: TlsConfigs = await req.db.tlsConfigs.getByName(configName)
    if (results != null) {
      MqttProvider.publishEvent('success', ['getTlsConfig'], `Get TLS config profile : ${configName}`)
      log.verbose(`TLS config profile : ${JSON.stringify(results)}`)
      res.status(200).json(API_RESPONSE(results)).end()
    } else {
      MqttProvider.publishEvent('fail', ['getTlsConfig'], `Not found : ${configName}`)
      log.debug(`Not found : ${configName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', TLS_CONFIG_NOT_FOUND(configName))).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['getTlsConfig'], `Failed to get TLS config profile : ${configName}`)
    log.error(`Failed to get TLS config profile : ${configName}`, error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`GET ${configName}`))).end()
  }
}
