/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { INetProfilesDb } from '../../../repositories/interfaces/INetProfilesDb'
import { NetConfigDbFactory } from '../../../repositories/NetConfigDbFactory'
import { NETWORK_CONFIG_NOT_FOUND, NETWORK_CONFIG_ERROR } from '../../../utils/constants'

export async function deleteNetProfile (req, res) {
  let profilesDb: INetProfilesDb = null
  const { profileName } = req.params
  try {
    profilesDb = NetConfigDbFactory.getConfigDb()
    const results = await profilesDb.deleteProfileByName(profileName)
    if (typeof results === 'undefined' || results === null) {
      res.status(404).end(NETWORK_CONFIG_NOT_FOUND(profileName))
    } else {
      res.status(200).end(results)
    }
  } catch (error) {
    console.log(error)
    res.status(500).end(NETWORK_CONFIG_ERROR(profileName))
  }
}
