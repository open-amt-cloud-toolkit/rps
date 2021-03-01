/*********************************************************************
* Copyright (c) Intel Corporation 2019
* SPDX-License-Identifier: Apache-2.0
* Author : Ramu Bachala
**********************************************************************/
import Logger from '../../../Logger'
import { INetProfilesDb } from '../../../repositories/interfaces/INetProfilesDb'
import { NetConfigDbFactory } from '../../../repositories/factories/NetConfigDbFactory'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, NETWORK_CONFIG_NOT_FOUND } from '../../../utils/constants'

export async function getNetProfile (req, res): Promise<void> {
  const log = new Logger('getNetProfile')
  let profilesDb: INetProfilesDb = null
  const { profileName } = req.params
  try {
    profilesDb = NetConfigDbFactory.getConfigDb()
    const result = await profilesDb.getProfileByName(profileName)
    if (result == null) {
      res.status(404).json(API_RESPONSE(null, 'Not Found', NETWORK_CONFIG_NOT_FOUND(profileName))).end()
    } else {
      res.status(200).json(API_RESPONSE(result)).end()
    }
  } catch (error) {
    log.error(`Failed to edit network configuration : ${profileName}`, error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`GET ${profileName}`))).end()
  }
}
