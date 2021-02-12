/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import Logger from '../../../Logger'
import { AMTConfiguration } from '../../../models/Rcs'
import { IProfilesDb } from '../../../repositories/interfaces/IProfilesDb'
import { ProfilesDbFactory } from '../../../repositories/ProfilesDbFactory'
import { PROFILE_NOT_FOUND, PROFILE_ERROR } from '../../../utils/constants'
import { EnvReader } from '../../../utils/EnvReader'

export async function deleteProfile (req, res): Promise<void> {
  const log = new Logger('deleteProfile')
  let profilesDb: IProfilesDb = null
  const { profileName } = req.params
  try {
    profilesDb = ProfilesDbFactory.getProfilesDb()
    const profile: AMTConfiguration = await profilesDb.getProfileByName(profileName)
    if (Object.keys(profile).length === 0) {
      res.status(404).end(PROFILE_NOT_FOUND(profileName))
    } else {
      const results: boolean = await profilesDb.deleteProfileByName(profileName)
      if (results) {
        if (!profile.GenerateRandomPassword || !profile.GenerateRandomMEBxPassword) {
          if (req.secretsManager) {
            await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${profile.ProfileName}`)
          }
        }
        res.status(204).end()
      }
    }
  } catch (error) {
    log.error(`Failed to delete AMT profile : ${profileName}`, error)
    res.status(500).end(PROFILE_ERROR(profileName))
  }
}
