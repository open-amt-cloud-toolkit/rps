/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, TLS_CONFIG_NOT_FOUND } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function deleteTlsConfig (req: Request, res: Response): Promise<void> {
  const log = new Logger('deleteTlsConfig')
  const configName: string = req.params.configName
  try {
    const result: boolean = await req.db.tlsConfigs.delete(configName)
    if (result) {
      MqttProvider.publishEvent('success', ['deleteTlsConfig'], `Deleted TLS config : ${configName}`)
      log.verbose(`Deleted TLS config profile : ${configName}`)
      res.status(204).end()
    } else {
      MqttProvider.publishEvent('fail', ['deleteTlsConfig'], `TLS config "${configName}" not found`)
      log.debug(`Not found : ${configName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', TLS_CONFIG_NOT_FOUND(configName))).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['deleteTlsConfig'], `Failed to delete TLS config : ${configName}`)
    log.error(`Failed to delete TLS config profile : ${configName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`DELETE ${configName}`))).end()
    }
  }
}
