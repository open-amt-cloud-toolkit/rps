/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { IWirelessProfilesDb } from '../../../interfaces/database/IWirelessProfilesDB'
import { WirelessConfigDbFactory } from '../../../repositories/factories/WirelessConfigDbFactory'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, NETWORK_CONFIG_NOT_FOUND } from '../../../utils/constants'
import { WirelessConfig } from '../../../RCS.Config'
import Logger from '../../../Logger'
import { RPSError } from '../../../utils/RPSError'
import { EnvReader } from '../../../utils/EnvReader'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function editWirelessProfile (req: Request, res: Response): Promise<void> {
  const log = new Logger('editNetProfile')
  let wirelessDb: IWirelessProfilesDb = null
  try {
    wirelessDb = WirelessConfigDbFactory.getConfigDb()
    let config: WirelessConfig = await wirelessDb.getByName(req.body.profileName)
    if (config == null) {
      MqttProvider.publishEvent('fail', ['editWirelessProfiles'], `Wireless Profile Not Found : ${req.body.profileName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', NETWORK_CONFIG_NOT_FOUND('Wireless', req.body.profileName))).end()
    } else {
      const passphrase = req.body.pskPassphrase
      if (passphrase) {
        config = { ...config, ...req.body }
        config.pskPassphrase = 'pskPassphrase'
      } else {
        config = { ...config, ...req.body }
      }

      const results: WirelessConfig = await wirelessDb.update(config)
      if (req.secretsManager && passphrase) {
        await req.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}Wireless/${config.profileName}`, config.pskPassphrase, passphrase)
        log.debug(`pskPassphrase stored in Vault for wireless profile: ${config.profileName}`)
      }
      delete results.pskPassphrase
      delete results.pskValue
      MqttProvider.publishEvent('success', ['editWirelessProfiles'], `Updated Wireless Profile : ${config.profileName}`)
      res.status(200).json(results).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['editWirelessProfiles'], `Failed to update wireless profile : ${req.body.profileName}`)
    log.error(`Failed to edit network configuration : ${req.body.profileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`UPDATE ${req.body.profileName}`))).end()
    }
  }
}
