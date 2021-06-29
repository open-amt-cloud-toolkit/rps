/*********************************************************************
* Copyright (c) Intel Corporation 2021
* SPDX-License-Identifier: Apache-2.0
**********************************************************************/
import Logger from '../../../Logger'
import { IWirelessProfilesDb } from '../../../repositories/interfaces/IWirelessProfilesDB'
import { WirelessConfigDbFactory } from '../../../repositories/factories/WirelessConfigDbFactory'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, NETWORK_CONFIG_NOT_FOUND } from '../../../utils/constants'

export async function getWirelessProfile (req, res): Promise<void> {
  const log = new Logger('getWirelessProfile')
  let profilesDb: IWirelessProfilesDb = null
  const { profileName } = req.params
  try {
    profilesDb = WirelessConfigDbFactory.getConfigDb()
    const result = await profilesDb.getProfileByName(profileName)
    if (result == null) {
      res.status(404).json(API_RESPONSE(null, 'Not Found', NETWORK_CONFIG_NOT_FOUND('Wireless', profileName))).end()
    } else {
      delete result.pskPassphrase
      res.status(200).json(API_RESPONSE(result)).end()
    }
  } catch (error) {
    log.error(`Failed to get wireless profile : ${profileName}`, error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`GET ${profileName}`))).end()
  }
}
