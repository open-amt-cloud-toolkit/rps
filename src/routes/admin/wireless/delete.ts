/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import Logger from '../../../Logger'
import { NOT_FOUND_EXCEPTION, NOT_FOUND_MESSAGE } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'
import handleError from '../../../utils/handleError'

export async function deleteWirelessProfile (req: Request, res: Response): Promise<void> {
  const log = new Logger('deleteWirelessProfile')
  const { profileName } = req.params
  try {
    const results: boolean = await req.db.wirelessProfiles.delete(profileName)
    if (results) {
      if (req.secretsManager) {
        await req.secretsManager.deleteSecretWithPath(`Wireless/${profileName}`)
      }
      MqttProvider.publishEvent('success', ['deleteWirelessProfiles'], `Deleted wireless profile : ${profileName}`)
      log.verbose(`Deleted wireless profile : ${profileName}`)
      res.status(204).end()
    } else {
      throw new RPSError(NOT_FOUND_MESSAGE('Wireless', profileName), NOT_FOUND_EXCEPTION)
    }
  } catch (error) {
    handleError(log, profileName, req, res, error)
  }
}
