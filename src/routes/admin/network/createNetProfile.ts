/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { INetProfilesDb } from '../../../repositories/interfaces/INetProfilesDb'
import { NetConfigDbFactory } from '../../../repositories/NetConfigDbFactory'
import { NETWORK_CONFIG_ERROR, NETWORK_CONFIG_INSERTION_SUCCESS } from '../../../utils/constants'
import { NetworkConfig } from '../../../RCS.Config'

export async function createNetProfile (req, res): Promise<void> {
  let profilesDb: INetProfilesDb = null
  const netConfig: NetworkConfig = readBody(req, res)

  try {
    profilesDb = NetConfigDbFactory.getConfigDb()

    let errorReason
    // SQL Query > Insert Data
    const results = await profilesDb.insertProfile(netConfig).catch((reason) => {
      errorReason = reason
    })

    if (!errorReason && results) {
      res.status(200).end(NETWORK_CONFIG_INSERTION_SUCCESS(netConfig.ProfileName))
    } else {
      res.status(500).end(`${errorReason}`)
    }
  } catch (error) {
    if (res.status) return
    console.log(error)
    res.status(500).end(NETWORK_CONFIG_ERROR(netConfig.ProfileName))
  }
}

function readBody (req, res): NetworkConfig {
  const config: NetworkConfig = <NetworkConfig>{}
  const body = req.body

  config.ProfileName = body.payload.profileName
  config.DHCPEnabled = body.payload.dhcpEnabled
  config.StaticIPShared = !body.payload.dhcpEnabled
  config.IPSyncEnabled = true

  return config
}
