/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { validationResult } from 'express-validator'
import { IProfilesDb } from '../../../repositories/interfaces/IProfilesDb'
import { ProfilesDbFactory } from '../../../repositories/ProfilesDbFactory'
import { AMTConfig } from '../../../RCS.Config'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, PROFILE_INSERTION_SUCCESS } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'

export async function createProfile (req, res): Promise<void> {
  let profilesDb: IProfilesDb = null
  const log = new Logger('createProfile')
  const amtConfig: AMTConfig = {} as AMTConfig
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }
    const payload = req.body.payload
    amtConfig.profileName = payload.profileName
    amtConfig.amtPassword = payload.amtPassword !== undefined ? payload.amtPassword : null
    amtConfig.mebxPassword = payload.mebxPassword !== undefined ? payload.mebxPassword : null
    amtConfig.generateRandomMEBxPassword = payload.generateRandomMEBxPassword !== undefined ? req.body.payload.generateRandomMEBxPassword : false
    amtConfig.randomMEBxPasswordLength = payload.mebxPasswordLength !== undefined ? req.body.payload.mebxPasswordLength : null
    amtConfig.generateRandomPassword = payload.generateRandomPassword !== undefined ? payload.generateRandomPassword : false
    amtConfig.randomPasswordLength = payload.passwordLength !== undefined ? payload.passwordLength : null
    amtConfig.configurationScript = req.body.payload.configScript
    amtConfig.ciraConfigName = payload.ciraConfigName
    amtConfig.activation = payload.activation
    amtConfig.randomPasswordCharacters = payload.randomPasswordCharacters
    amtConfig.networkConfigName = payload.networkConfigName

    profilesDb = ProfilesDbFactory.getProfilesDb()
    const pwdBefore = amtConfig.amtPassword
    const mebxPwdBefore = amtConfig.mebxPassword
    if (req.secretsManager) {
      if (!amtConfig.generateRandomPassword) {
        amtConfig.amtPassword = `${amtConfig.profileName}_DEVICE_AMT_PASSWORD`
      }
      if (!amtConfig.generateRandomMEBxPassword) {
        amtConfig.mebxPassword = `${amtConfig.profileName}_DEVICE_MEBX_PASSWORD`
      }
    }
    const results: boolean = await profilesDb.insertProfile(amtConfig)
    if (results) {
      // profile inserted  into db successfully.
      if (req.secretsManager && (!amtConfig.generateRandomPassword || !amtConfig.generateRandomMEBxPassword)) {
        // store the passwords in Vault
        const data = { data: {} }
        if (!amtConfig.generateRandomPassword) {
          data.data[`${amtConfig.profileName}_DEVICE_AMT_PASSWORD`] = pwdBefore
          log.debug('AMT Password written to vault')
        }
        if (!amtConfig.generateRandomMEBxPassword) {
          data.data[`${amtConfig.profileName}_DEVICE_MEBX_PASSWORD`] = mebxPwdBefore
          log.debug('MEBX Password written to vault')
        }
        await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${amtConfig.profileName}`, data)
      }
      res.status(201).json(API_RESPONSE(null, null, PROFILE_INSERTION_SUCCESS(amtConfig.profileName))).end()
    }
  } catch (error) {
    log.error(`Failed to create a AMT profile: ${amtConfig.profileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Insert AMT profile ${amtConfig.profileName}`))).end()
    }
  }
}
