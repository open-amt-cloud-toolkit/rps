/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import Logger from '../../../Logger'
import { AMTConfiguration } from '../../../models/Rcs'
import { IProfilesDb } from '../../../repositories/interfaces/IProfilesDb'
import { ProfilesDbFactory } from '../../../repositories/factories/ProfilesDbFactory'
import { PROFILE_NOT_FOUND, API_UNEXPECTED_EXCEPTION, API_RESPONSE } from '../../../utils/constants'
import { EnvReader } from '../../../utils/EnvReader'
import { MqttProvider } from '../../../utils/MqttProvider'

export async function deleteProfile (req, res): Promise<void> {
  const log = new Logger('deleteProfile')
  let profilesDb: IProfilesDb = null
  const { profileName } = req.params
  try {
    profilesDb = ProfilesDbFactory.getProfilesDb()
    const profile: AMTConfiguration = await profilesDb.getByName(profileName)
    if (profile == null) {
      MqttProvider.publishEvent('fail', ['deleteProfile'], `Profile Not Found : ${profileName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', PROFILE_NOT_FOUND(profileName))).end()
    } else {
      const results: boolean = await profilesDb.delete(profileName)
      if (results) {
        if (req.secretsManager) {
          await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${profile.profileName}`)
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
