/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import Logger from '../../../Logger'
import { IProfilesDb } from '../../../repositories/interfaces/IProfilesDb'
import { ProfilesDbFactory } from '../../../repositories/factories/ProfilesDbFactory'
import { PROFILE_NOT_FOUND, API_UNEXPECTED_EXCEPTION, API_RESPONSE } from '../../../utils/constants'
import { AMTConfiguration } from '../../../models/Rcs'
import { MqttProvider } from '../../../utils/MqttProvider'

export async function getProfile (req, res): Promise<void> {
  const log = new Logger('getProfile')
  let profilesDb: IProfilesDb = null
  const { profileName } = req.params
  try {
    profilesDb = ProfilesDbFactory.getProfilesDb()
    const result: AMTConfiguration = await profilesDb.getByName(profileName)
    if (result == null) {
      MqttProvider.publishEvent('fail', ['getProfile'], `Profile Not Found : ${profileName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', PROFILE_NOT_FOUND(profileName))).end()
    } else {
      MqttProvider.publishEvent('fail', ['getProfile'], `Sent Profile : ${profileName}`)
      res.status(200).json(API_RESPONSE(result)).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['getProfile'], `Failed to Get Profile : ${profileName}`)
    log.error('Failed to get AMT profile : ', error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Get AMT profile ${profileName}`))).end()
  }
}
