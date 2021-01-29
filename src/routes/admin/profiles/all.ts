/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import Logger from '../../../Logger'
import { AMTConfiguration } from '../../../models/Rcs'
import { IProfilesDb } from '../../../repositories/interfaces/IProfilesDb'
import { ProfilesDbFactory } from '../../../repositories/ProfilesDbFactory'
import { PROFILE_ERROR } from '../../../utils/constants'

export async function allProfiles (req, res): Promise<void> {
  const log = new Logger('allProfiles')
  let profilesDb: IProfilesDb = null
  let results: AMTConfiguration[] = [] as AMTConfiguration[]
  try {
    profilesDb = ProfilesDbFactory.getProfilesDb()
    results = await profilesDb.getAllProfiles()
    if (results.length >= 0) {
      results = results.map((result: AMTConfiguration) => {
        result.AMTPassword = null
        result.MEBxPassword = null
        return result
      })
      res.status(200).json(results).end()
    }
  } catch (error) {
    log.error('Failed to get all the AMT Domains :', error)
    res.status(500).end(PROFILE_ERROR(''))
  }
}
