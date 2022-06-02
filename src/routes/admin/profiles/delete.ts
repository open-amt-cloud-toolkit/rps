/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import Logger from '../../../Logger'
import { AMTConfiguration } from '../../../models'
import { API_UNEXPECTED_EXCEPTION, NOT_FOUND_EXCEPTION, NOT_FOUND_MESSAGE } from '../../../utils/constants'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'
import handleError from '../../../utils/handleError'
import { RPSError } from '../../../utils/RPSError'

export async function deleteProfile (req: Request, res: Response): Promise<void> {
  const log = new Logger('deleteProfile')
  const { profileName } = req.params
  try {
    const profile: AMTConfiguration = await req.db.profiles.getByName(profileName)
    if (profile == null) {
      throw new RPSError(NOT_FOUND_MESSAGE('AMT', profileName), NOT_FOUND_EXCEPTION)
    } else {
      const results: boolean = await req.db.profiles.delete(profileName)
      if (results) {
        if (req.secretsManager) {
          if (!profile.generateRandomPassword || !profile.generateRandomMEBxPassword) {
            await req.secretsManager.deleteSecretWithPath(`profiles/${profile.profileName}`)
          }
          await req.secretsManager.deleteSecretWithPath(`TLS/${profile.profileName}`)
        }

        MqttProvider.publishEvent('success', ['deleteProfile'], `Deleted Profile : ${profileName}`)
        res.status(204).end()
      } else {
        throw new RPSError(API_UNEXPECTED_EXCEPTION('Error deleting profile'))
      }
    }
  } catch (error) {
    handleError(log, profileName, req, res, error)
  }
}
