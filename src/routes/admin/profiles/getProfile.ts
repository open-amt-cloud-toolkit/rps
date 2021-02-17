/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import Logger from '../../../Logger'
import { IProfilesDb } from '../../../repositories/interfaces/IProfilesDb'
import { ProfilesDbFactory } from '../../../repositories/ProfilesDbFactory'
import { PROFILE_NOT_FOUND, API_UNEXPECTED_EXCEPTION, API_RESPONSE } from '../../../utils/constants'
import { AMTConfiguration } from '../../../models/Rcs'

export async function getProfile (req, res): Promise<void> {
  const log = new Logger('getProfile')
  let profilesDb: IProfilesDb = null
  const { profileName } = req.params
  try {
    profilesDb = ProfilesDbFactory.getProfilesDb()
    const result: AMTConfiguration = await profilesDb.getProfileByName(profileName)
    if (result == null) {
      res.status(404).json(API_RESPONSE(null, 'Not Found', PROFILE_NOT_FOUND(profileName))).end()
    } else {
      // Return null. Check Security objectives around returning passwords.
      delete result.amtPassword
      delete result.mebxPassword
      res.status(200).json(API_RESPONSE(result)).end()
    }
  } catch (error) {
    log.error('Failed to get AMT profile : ', error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Get AMT profile ${profileName}`))).end()
  }
}
