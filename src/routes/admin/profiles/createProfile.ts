/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { validationResult } from 'express-validator'
import { IProfilesDb } from '../../../repositories/interfaces/IProfilesDb'
import { ProfilesDbFactory } from '../../../repositories/factories/ProfilesDbFactory'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'
import { AMTConfiguration } from '../../../models/Rcs'
import { MqttProvider } from '../../../utils/MqttProvider'

export async function createProfile (req, res): Promise<void> {
  let profilesDb: IProfilesDb = null
  const log = new Logger('createProfile')
  const amtConfig: AMTConfiguration = req.body
  amtConfig.tenantId = req.tenantId
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      MqttProvider.publishEvent('fail', ['createProfile'], `Failed to create profile : ${amtConfig.profileName}`)
      res.status(400).json({ errors: errors.array() })
      return
    }
    profilesDb = ProfilesDbFactory.getProfilesDb()
    const pwdBefore = amtConfig.amtPassword
    const mebxPwdBefore = amtConfig.mebxPassword
    if (req.secretsManager) {
      amtConfig.amtPassword = 'AMT_PASSWORD'
      amtConfig.mebxPassword = 'MEBX_PASSWORD'
    }
    const results: AMTConfiguration = await profilesDb.insertProfile(amtConfig)
    if (results != null) {
      // profile inserted  into db successfully.
      if (req.secretsManager) {
        // store the passwords in Vault
        const data = { data: { AMT_PASSWORD: '', MEBX_PASSWORD: '' } }
        data.data.AMT_PASSWORD = pwdBefore
        data.data.MEBX_PASSWORD = mebxPwdBefore
        log.debug('AMT and MEBX Passwords written to vault')
        await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${amtConfig.profileName}`, data)
      }
      delete results.amtPassword
      delete results.mebxPassword
      MqttProvider.publishEvent('success', ['createProfile'], `Created Profile : ${amtConfig.profileName}`)
      res.status(201).json(results).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['createProfile'], `Failed to create profile : ${amtConfig.profileName}`)
    log.error(`Failed to create a AMT profile: ${amtConfig.profileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Insert AMT profile ${amtConfig.profileName}`))).end()
    }
  }
}
