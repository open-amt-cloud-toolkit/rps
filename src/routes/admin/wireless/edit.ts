/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { NOT_FOUND_EXCEPTION, NOT_FOUND_MESSAGE } from '../../../utils/constants'
import { type WirelessConfig } from '../../../models/RCS.Config'
import Logger from '../../../Logger'
import { MqttProvider } from '../../../utils/MqttProvider'
import { type Request, type Response } from 'express'
import handleError from '../../../utils/handleError'
import { RPSError } from '../../../utils/RPSError'

export async function editWirelessProfile (req: Request, res: Response): Promise<void> {
  const log = new Logger('editNetProfile')
  try {
    let config: WirelessConfig = await req.db.wirelessProfiles.getByName(req.body.profileName, req.tenantId)
    if (config == null) {
      throw new RPSError(NOT_FOUND_MESSAGE('Wireless', req.body.profileName), NOT_FOUND_EXCEPTION)
    } else {
      const passphrase = req.body.pskPassphrase
      if (passphrase) {
        config = { ...config, ...req.body }
        config.pskPassphrase = 'PSK_PASSPHRASE'
      } else {
        config = { ...config, ...req.body }
      }
      if (!req.body.version) {
        config.version = null
      }

      const results: WirelessConfig = await req.db.wirelessProfiles.update(config)
      if (req.secretsManager && passphrase) {
        await req.secretsManager.writeSecretWithObject(`Wireless/${config.profileName}`, { PSK_PASSPHRASE: passphrase })
        log.debug(`pskPassphrase stored in Vault for wireless profile: ${config.profileName}`)
      }
      delete results.pskPassphrase
      delete results.pskValue
      MqttProvider.publishEvent('success', ['editWirelessProfiles'], `Updated Wireless Profile : ${config.profileName}`)
      res.status(200).json(results).end()
    }
  } catch (error) {
    handleError(log, req.body.profileName, req, res, error)
  }
}
