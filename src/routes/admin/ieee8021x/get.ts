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

export async function getIEEE8021xProfile (req: Request, res: Response): Promise<void> {
  const log = new Logger('getIeee8021xProfile')
  const { profileName } = req.params
  try {
    const result = await req.db.ieee8021xProfiles.getByName(profileName, req.tenantId)
    if (result == null) {
      throw new RPSError(NOT_FOUND_MESSAGE('802.1x', profileName), NOT_FOUND_EXCEPTION)
    } else {
      MqttProvider.publishEvent('success', ['getIeee8021xProfiles'], `Sent 802.1x Profile : ${profileName}`)
      res.status(200).json(API_RESPONSE(result)).end()
    }
  } catch (error) {
    handleError(log, profileName, req, res, error)
  }
}

export async function getIEEE8021xCountByInterface (req: Request, res: Response): Promise<void> {
  const log = new Logger('getIEEE8021xProfileCounts')
  try {
    const result = await req.db.ieee8021xProfiles.getCountByInterface(req.tenantId)
    if (result == null) {
      throw new RPSError(NOT_FOUND_MESSAGE('802.1x', 'Wired Interface Profile'), NOT_FOUND_EXCEPTION)
    } else {
      MqttProvider.publishEvent('success', ['getIEEE8021xProfileCounts'], 'Sent 802.1x Profile Counts')
      res.status(200).json(result).end()
    }
  } catch (error) {
    handleError(log, 'Wired Interface Profile', req, res, error)
  }
}
