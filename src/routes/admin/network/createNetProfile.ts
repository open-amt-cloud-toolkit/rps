/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { validationResult } from 'express-validator'
import { INetProfilesDb } from '../../../repositories/interfaces/INetProfilesDb'
import { NetConfigDbFactory } from '../../../repositories/NetConfigDbFactory'
import { API_UNEXPECTED_EXCEPTION, API_RESPONSE } from '../../../utils/constants'
import { NetworkConfig } from '../../../RCS.Config'
import Logger from '../../../Logger'
import { RPSError } from '../../../utils/RPSError'

export async function createNetProfile (req, res): Promise<void> {
  let profilesDb: INetProfilesDb = null
  let netConfig: NetworkConfig = {} as NetworkConfig
  const log = new Logger('createNetProfile')
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
    const results: NetworkConfig = await profilesDb.insertProfile(netConfig)
    if (results != null) {
      res.status(201).json(results).end()
    }
  } catch (error) {
    log.error(`Failed to create a network configuration : ${netConfig.profileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Insert network configuration ${netConfig.profileName}`))).end()
    }
  }
}
