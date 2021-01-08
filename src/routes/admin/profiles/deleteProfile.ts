/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IProfilesDb } from '../../../repositories/interfaces/IProfilesDb'
import { ProfilesDbFactory } from '../../../repositories/ProfilesDbFactory'
import { PROFILE_NOT_FOUND, PROFILE_ERROR } from '../../../utils/constants'
import { EnvReader } from '../../../utils/EnvReader'

export async function deleteProfile (req, res) {
  let profilesDb: IProfilesDb = null
  const { profileName } = req.params
  try {
    profilesDb = ProfilesDbFactory.getProfilesDb()
    const profile = await profilesDb.getProfileByName(profileName)
    if (typeof profile === 'undefined' || profile === null) {
      res.status(404).end(PROFILE_NOT_FOUND(profileName))
    } else {
      const results = await profilesDb.deleteProfileByName(profileName)
      if (profile.GenerateRandomPassword && profile.GenerateRandomMEBxPassword) {
        // TBD: Status should be 204
        res.status(200).end(results)
      } else {
        if (req.secretsManager) {
          await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${profile.ProfileName}`)
        }
        res.status(200).end(results)
      }
    }
  } catch (error) {
    console.log(error)
    res.status(500).end(PROFILE_ERROR(profileName))
  }
}
