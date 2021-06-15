/*********************************************************************
* Copyright (c) Intel Corporation 2019
* SPDX-License-Identifier: Apache-2.0
* Author : Ramu Bachala
**********************************************************************/
import Logger from '../../../Logger'
import { NetworkConfig } from '../../../RCS.Config'
import { INetProfilesDb } from '../../../repositories/interfaces/INetProfilesDb'
import { NetConfigDbFactory } from '../../../repositories/factories/NetConfigDbFactory'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'

export async function allProfiles (req, res): Promise<void> {
  const log = Logger
  let profilesDb: INetProfilesDb = null
  try {
    profilesDb = NetConfigDbFactory.getConfigDb()
    const results: NetworkConfig[] = await profilesDb.getAllProfiles()
    if (results.length >= 0) {
      res.status(200).json(API_RESPONSE(results)).end()
    }
  } catch (error) {
    log.error('Failed to get all network profiles :', error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION('GET all Network Configs'))).end()
  }
}
