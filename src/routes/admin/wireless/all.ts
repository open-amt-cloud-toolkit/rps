/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import Logger from '../../../Logger'
import { WirelessConfig } from '../../../RCS.Config'
import { IWirelessProfilesDb } from '../../../repositories/interfaces/IWirelessProfilesDB'
import { WirelessConfigDbFactory } from '../../../repositories/factories/WirelessConfigDbFactory'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'

export async function allProfiles (req, res): Promise<void> {
  const log = new Logger('allProfiles')
  let profilesDb: IWirelessProfilesDb = null
  try {
    profilesDb = WirelessConfigDbFactory.getConfigDb()
    let results: WirelessConfig[] = await profilesDb.getAllProfiles()
    if (results.length >= 0) {
      results = results.map((result: WirelessConfig) => {
        delete result.pskPassphrase
        return result
      })
      res.status(200).json(API_RESPONSE(results)).end()
    }
  } catch (error) {
    log.error('Failed to get all network profiles :', error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION('GET all Network Configs'))).end()
  }
}
