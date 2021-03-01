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

export async function deleteProfile (req, res): Promise<void> {
  const log = new Logger('deleteProfile')
  let profilesDb: IProfilesDb = null
  const { profileName } = req.params
  try {
    profilesDb = ProfilesDbFactory.getProfilesDb()
    const profile: AMTConfiguration = await profilesDb.getProfileByName(profileName)
    if (profile == null) {
      res.status(404).json(API_RESPONSE(null, 'Not Found', PROFILE_NOT_FOUND(profileName))).end()
    } else {
      const results: boolean = await profilesDb.deleteProfileByName(profileName)
      if (results) {
        if (!profile.generateRandomPassword || !profile.generateRandomMEBxPassword) {
          if (req.secretsManager) {
            await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${profile.profileName}`)
          }
        }
        res.status(204).end()
      }
    }
  } catch (error) {
    log.error(`Failed to delete AMT profile : ${profileName}`, error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Delete AMT profile ${profileName}`))).end()
  }
}
