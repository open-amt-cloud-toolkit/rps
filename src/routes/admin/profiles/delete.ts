/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import Logger from '../../../Logger'
import { AMTConfiguration } from '../../../models'
import { PROFILE_NOT_FOUND, API_UNEXPECTED_EXCEPTION, API_RESPONSE } from '../../../utils/constants'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function deleteProfile (req: Request, res: Response): Promise<void> {
  const log = new Logger('deleteProfile')
  const { profileName } = req.params
  try {
    const profile: AMTConfiguration = await req.db.profiles.getByName(profileName)
    if (profile == null) {
      MqttProvider.publishEvent('fail', ['deleteProfile'], `Profile Not Found : ${profileName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', PROFILE_NOT_FOUND(profileName))).end()
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
      }
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['deleteProfile'], `Failed to delete profile : ${profileName}`)
    log.error(`Failed to delete AMT profile : ${profileName}`, error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Delete AMT profile ${profileName}`))).end()
  }
}
