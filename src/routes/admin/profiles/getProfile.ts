/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import Logger from '../../../Logger'
import { IProfilesDb } from '../../../repositories/interfaces/IProfilesDb'
import { ProfilesDbFactory } from '../../../repositories/ProfilesDbFactory'
import { PROFILE_NOT_FOUND, PROFILE_ERROR } from '../../../utils/constants'
import { AMTConfiguration } from '../../../models/Rcs'

export async function getProfile (req, res): Promise<void> {
  const log = new Logger('getProfile')
  let profilesDb: IProfilesDb = null
  const { profileName } = req.params
  try {
    profilesDb = ProfilesDbFactory.getProfilesDb()
    const result: AMTConfiguration = await profilesDb.getProfileByName(profileName)
    if (Object.keys(result).length === 0) {
      res.status(404).end(PROFILE_NOT_FOUND(profileName))
    } else {
      // Return null. Check Security objectives around returning passwords.
      result.AMTPassword = null
      result.MEBxPassword = null
      res.status(200).json(result).end()
    }
  } catch (error) {
    log.error('Failed to get AMT profile : ', error)
    res.status(500).end(PROFILE_ERROR(profileName))
  }
}
