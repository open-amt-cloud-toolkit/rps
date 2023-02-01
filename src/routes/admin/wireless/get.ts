/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import Logger from '../../../Logger'
import { type Request, type Response } from 'express'
import { API_RESPONSE, NOT_FOUND_EXCEPTION, NOT_FOUND_MESSAGE } from '../../../utils/constants'
import { MqttProvider } from '../../../utils/MqttProvider'
import handleError from '../../../utils/handleError'
import { RPSError } from '../../../utils/RPSError'

export async function getWirelessProfile (req: Request, res: Response): Promise<void> {
  const log = new Logger('getWirelessProfile')
  const { profileName } = req.params
  try {
    const result = await req.db.wirelessProfiles.getByName(profileName)
    if (result == null) {
      throw new RPSError(NOT_FOUND_MESSAGE('Wireless', profileName), NOT_FOUND_EXCEPTION)
    } else {
      delete result.pskPassphrase
      MqttProvider.publishEvent('success', ['getWirelessProfiles'], `Sent Wireless Profile : ${profileName}`)
      res.status(200).json(API_RESPONSE(result)).end()
    }
  } catch (error) {
    handleError(log, profileName, req, res, error)
  }
}
