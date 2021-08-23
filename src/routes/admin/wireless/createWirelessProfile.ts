/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { validationResult } from 'express-validator'
import { IWirelessProfilesDb } from '../../../repositories/interfaces/IWirelessProfilesDB'
import { WirelessConfigDbFactory } from '../../../repositories/factories/WirelessConfigDbFactory'
import { API_UNEXPECTED_EXCEPTION, API_RESPONSE } from '../../../utils/constants'
import { WirelessConfig } from '../../../RCS.Config'
import Logger from '../../../Logger'
import { RPSError } from '../../../utils/RPSError'
import { EnvReader } from '../../../utils/EnvReader'
import { MqttProvider } from '../../../utils/MqttProvider'

export async function createWirelessProfile (req, res): Promise<void> {
  let profilesDb: IWirelessProfilesDb = null
  const wirelessConfig: WirelessConfig = req.body
  wirelessConfig.tenantId = req.tenantId
  const log = new Logger('createWirelessProfile')
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      MqttProvider.publishEvent('fail', ['createWirelessProfiles'], `Failed to create wireless profile : ${wirelessConfig.profileName}`)
      res.status(400).json({ errors: errors.array() })
      return
    }
    const passphrase = wirelessConfig.pskPassphrase
    if (req.secretsManager) {
      wirelessConfig.pskPassphrase = 'pskPassphrase'
    }

    profilesDb = WirelessConfigDbFactory.getConfigDb()
    const results: WirelessConfig = await profilesDb.insert(wirelessConfig)
    // store the password into Vault
    if (req.secretsManager) {
      await req.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}Wireless/${wirelessConfig.profileName}`, wirelessConfig.pskPassphrase, passphrase)
      log.debug(`pskPassphrase stored in Vault for wireless profile: ${wirelessConfig.profileName}`)
    }
    log.verbose(`Created wireless profile : ${wirelessConfig.profileName}`)
    delete results.pskPassphrase
    MqttProvider.publishEvent('success', ['createWirelessProfiles'], `Created wireless profile : ${wirelessConfig.profileName}`)
    res.status(201).json(results).end()
  } catch (error) {
    MqttProvider.publishEvent('fail', ['createWirelessProfiles'], `Failed to create wireless profile : ${wirelessConfig.profileName}`)
    log.error(`Failed to create a wireless profile : ${wirelessConfig.profileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Insert wireless profile ${wirelessConfig.profileName}`))).end()
    }
  }
}
