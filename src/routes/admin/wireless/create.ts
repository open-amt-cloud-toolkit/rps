/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { WirelessConfig } from '../../../models/RCS.Config'
import Logger from '../../../Logger'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'
import handleError from '../../../utils/handleError'
export async function createWirelessProfile (req: Request, res: Response): Promise<void> {
  const wirelessConfig: WirelessConfig = req.body
  wirelessConfig.tenantId = req.tenantId
  const log = new Logger('createWirelessProfile')
  try {
    const passphrase = wirelessConfig.pskPassphrase
    if (req.secretsManager) {
      wirelessConfig.pskPassphrase = 'PSK_PASSPHRASE'
    }

    const results: WirelessConfig = await req.db.wirelessProfiles.insert(wirelessConfig)
    // store the password into Vault
    if (req.secretsManager) {
      await req.secretsManager.writeSecretWithKey(`Wireless/${wirelessConfig.profileName}`, wirelessConfig.pskPassphrase, passphrase)
      log.debug(`pskPassphrase stored in Vault for wireless profile: ${wirelessConfig.profileName}`)
    }
    log.verbose(`Created wireless profile : ${wirelessConfig.profileName}`)
    delete results.pskPassphrase
    MqttProvider.publishEvent('success', ['createWirelessProfiles'], `Created wireless profile : ${wirelessConfig.profileName}`)
    res.status(201).json(results).end()
  } catch (error) {
    handleError(log, 'wirelessConfig.profileName', req, res, error)
  }
}
