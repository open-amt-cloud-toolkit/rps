/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { INetProfilesDb } from '../../../repositories/interfaces/INetProfilesDb'
import { NetConfigDbFactory } from '../../../repositories/factories/NetConfigDbFactory'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, NETWORK_CONFIG_NOT_FOUND } from '../../../utils/constants'
import { NetworkConfig } from '../../../RCS.Config'
import Logger from '../../../Logger'
import { validationResult } from 'express-validator'
import { RPSError } from '../../../utils/RPSError'

export async function editNetProfile (req, res): Promise<void> {
  const log = new Logger('editNetProfile')
  let profilesDb: INetProfilesDb = null
  let netConfig: NetworkConfig = <NetworkConfig>{}
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }
    netConfig = req.body
    netConfig.staticIPShared = !netConfig.dhcpEnabled
    netConfig.ipSyncEnabled = true

    profilesDb = NetConfigDbFactory.getConfigDb()
    const config: NetworkConfig = await profilesDb.getProfileByName(netConfig.profileName)
    if (config == null) {
      res.status(404).json(API_RESPONSE(null, 'Not Found', NETWORK_CONFIG_NOT_FOUND('NETWORK', netConfig.profileName))).end()
    } else {
      // SQL Query > Insert Data
      const results: NetworkConfig = await profilesDb.updateProfile(netConfig)
      if (results) {
        res.status(200).json(results).end()
      }
    }
  } catch (error) {
    log.error(`Failed to edit network configuration : ${netConfig.profileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`UPDATE ${netConfig.profileName}`))).end()
    }
  }
}
