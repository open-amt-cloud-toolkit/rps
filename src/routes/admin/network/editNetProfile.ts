/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { INetProfilesDb } from '../../../repositories/interfaces/INetProfilesDb'
import { NetConfigDbFactory } from '../../../repositories/NetConfigDbFactory'
import { NETWORK_CONFIG_ERROR, NETWORK_CONFIG_INVALID_INPUT, NETWORK_CONFIG_NOT_FOUND, NETWORK_CONFIG_UPDATE_SUCCESS } from '../../../utils/constants'
import { NetworkConfig } from '../../../RCS.Config'

export async function editNetProfile (req, res): Promise<void> {
  let profilesDb: INetProfilesDb = null
  const netConfig: NetworkConfig = readBody(req, res)

  try {
    profilesDb = NetConfigDbFactory.getConfigDb()

    let errorReason
    // SQL Query > Insert Data
    const results = await profilesDb.updateProfile(netConfig).catch((reason) => {
      errorReason = reason
    })

    if (!errorReason && results > 0) {
      res.status(200).end(NETWORK_CONFIG_UPDATE_SUCCESS(netConfig.ProfileName))
    } else {
      if (!errorReason && results === 0) {
        res.status(404).end(NETWORK_CONFIG_NOT_FOUND(netConfig.ProfileName))
        return
      }
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
  if (config.ProfileName == null || config.DHCPEnabled == null) {
    res.status(400).end(NETWORK_CONFIG_INVALID_INPUT)
    throw new Error(NETWORK_CONFIG_INVALID_INPUT)
  }

  return config
}
