/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { INetProfilesDb } from '../../../repositories/interfaces/INetProfilesDb'
import { NetConfigDbFactory } from '../../../repositories/NetConfigDbFactory'
import { API_UNEXPECTED_EXCEPTION, NETWORK_CONFIG_NOT_FOUND } from '../../../utils/constants'
import { NetworkConfig } from '../../../RCS.Config'
import Logger from '../../../Logger'
import { validationResult } from 'express-validator'
import { RPSError } from '../../../utils/RPSError'

export async function editNetProfile (req, res): Promise<void> {
  const log = new Logger('editNetProfile')
  let profilesDb: INetProfilesDb = null
  const netConfig: NetworkConfig = <NetworkConfig>{}
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }
    netConfig.ProfileName = req.body.payload.profileName
    netConfig.DHCPEnabled = req.body.payload.dhcpEnabled
    netConfig.StaticIPShared = !req.body.payload.dhcpEnabled
    netConfig.IPSyncEnabled = true

    profilesDb = NetConfigDbFactory.getConfigDb()
    // SQL Query > Insert Data
    const results: boolean = await profilesDb.updateProfile(netConfig)
    if (results) {
      res.status(204).end()
    } else {
      res.status(404).end(NETWORK_CONFIG_NOT_FOUND(netConfig.ProfileName))
    }
  } catch (error) {
    log.error(`Failed to edit network configuration : ${netConfig.ProfileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).end(error.message)
    } else {
      res.status(500).end(API_UNEXPECTED_EXCEPTION(`UPDATE ${netConfig.ProfileName}`))
    }
  }
}
