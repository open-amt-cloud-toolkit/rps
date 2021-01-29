/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import Logger from '../../../Logger'
import { INetProfilesDb } from '../../../repositories/interfaces/INetProfilesDb'
import { NetConfigDbFactory } from '../../../repositories/NetConfigDbFactory'
import { API_UNEXPECTED_EXCEPTION, NETWORK_CONFIG_NOT_FOUND } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'

export async function deleteNetProfile (req, res): Promise<void> {
  const log = new Logger('deleteNetProfile')
  let profilesDb: INetProfilesDb = null
  const { profileName } = req.params
  profilesDb = NetConfigDbFactory.getConfigDb()
  try {
    const results: boolean = await profilesDb.deleteProfileByName(profileName)
    if (results) {
      res.status(204).end()
    }
    res.status(404).end(NETWORK_CONFIG_NOT_FOUND(profileName))
  } catch (error) {
    log.error(`Failed to delete network configuration : ${profileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).end(error.message)
    } else {
      res.status(500).end(API_UNEXPECTED_EXCEPTION(`Delete network configuration ${profileName}`))
    }
  }
}
