/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, NETWORK_CONFIG_NOT_FOUND } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'
import { EnvReader } from '../../../utils/EnvReader'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function deleteWirelessProfile (req: Request, res: Response): Promise<void> {
  const log = new Logger('deleteWirelessProfile')
  const { profileName } = req.params
  try {
    const results: boolean = await req.db.wirelessProfiles.delete(profileName)
    if (results) {
      if (req.secretsManager) {
        await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}Wireless/${profileName}`)
      }
      MqttProvider.publishEvent('success', ['deleteWirelessProfiles'], `Deleted wireless profile : ${profileName}`)
      log.verbose(`Deleted wireless profile : ${profileName}`)
      res.status(204).end()
    } else {
      MqttProvider.publishEvent('fail', ['deleteWirelessProfiles'], `Wireless Profile Not Found : ${profileName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', NETWORK_CONFIG_NOT_FOUND('Wireless', profileName))).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['deleteWirelessProfiles'], `Failed to delete wireless profile : ${profileName}`)
    log.error(`Failed to delete wireless profile : ${profileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Delete wireless profile ${profileName}`))).end()
    }
  }
}
