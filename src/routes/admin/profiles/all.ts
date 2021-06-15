/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import Logger from '../../../Logger'
import { AMTConfiguration } from '../../../models/Rcs'
import { IProfilesDb } from '../../../repositories/interfaces/IProfilesDb'
import { ProfilesDbFactory } from '../../../repositories/factories/ProfilesDbFactory'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'

export async function allProfiles (req, res): Promise<void> {
  let profilesDb: IProfilesDb = null
  const log = Logger
  let results: AMTConfiguration[] = [] as AMTConfiguration[]
  try {
    profilesDb = ProfilesDbFactory.getProfilesDb()
    results = await profilesDb.getAllProfiles()
    if (results.length >= 0) {
      results = results.map((result: AMTConfiguration) => {
        delete result.amtPassword
        delete result.mebxPassword
        return result
      })
      res.status(200).json(API_RESPONSE(results)).end()
    }
  } catch (error) {
    log.error('Failed to get all the AMT Domains :', error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION('GET all AMT profiles'))).end()
  }
}
