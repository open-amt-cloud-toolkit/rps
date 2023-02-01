/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import Logger from '../../../Logger'
import { API_RESPONSE, NOT_FOUND_EXCEPTION, NOT_FOUND_MESSAGE } from '../../../utils/constants'
import { type AMTConfiguration } from '../../../models'
import { MqttProvider } from '../../../utils/MqttProvider'
import { type Request, type Response } from 'express'
import handleError from '../../../utils/handleError'
import { RPSError } from '../../../utils/RPSError'

export async function getProfile (req: Request, res: Response): Promise<void> {
  const log = new Logger('getProfile')
  const { profileName } = req.params
  try {
    const result: AMTConfiguration = await req.db.profiles.getByName(profileName)
    if (result == null) {
      throw new RPSError(NOT_FOUND_MESSAGE('AMT', profileName), NOT_FOUND_EXCEPTION)
    } else {
      MqttProvider.publishEvent('success', ['getProfile'], `Sent Profile : ${profileName}`)
      res.status(200).json(API_RESPONSE(result)).end()
    }
  } catch (error) {
    handleError(log, profileName, req, res, error)
  }
}
