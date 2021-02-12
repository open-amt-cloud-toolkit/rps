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
    amtConfig.ProfileName = payload.profileName
    amtConfig.AMTPassword = payload.amtPassword !== undefined ? payload.amtPassword : null
    amtConfig.MEBxPassword = payload.mebxPassword !== undefined ? payload.mebxPassword : null
    amtConfig.GenerateRandomMEBxPassword = payload.generateRandomMEBxPassword !== undefined ? req.body.payload.generateRandomMEBxPassword : false
    amtConfig.RandomMEBxPasswordLength = payload.mebxPasswordLength !== undefined ? req.body.payload.mebxPasswordLength : null
    amtConfig.GenerateRandomPassword = payload.generateRandomPassword !== undefined ? payload.generateRandomPassword : false
    amtConfig.RandomPasswordLength = payload.passwordLength !== undefined ? payload.passwordLength : null
    amtConfig.ConfigurationScript = req.body.payload.configScript
    amtConfig.CIRAConfigName = payload.ciraConfigName
    amtConfig.Activation = payload.activation
    amtConfig.RandomPasswordCharacters = payload.randomPasswordCharacters
    amtConfig.NetworkConfigName = payload.networkConfigName

    profilesDb = ProfilesDbFactory.getProfilesDb()
    const pwdBefore = amtConfig.AMTPassword
    const mebxPwdBefore = amtConfig.MEBxPassword
    if (req.secretsManager) {
      if (!amtConfig.GenerateRandomPassword) {
        amtConfig.AMTPassword = `${amtConfig.ProfileName}_DEVICE_AMT_PASSWORD`
      }
      if (!amtConfig.GenerateRandomMEBxPassword) {
        amtConfig.MEBxPassword = `${amtConfig.ProfileName}_DEVICE_MEBX_PASSWORD`
      }
    }
    const results: boolean = await profilesDb.insertProfile(amtConfig)
    if (results) {
      // profile inserted  into db successfully.
      if (req.secretsManager && (!amtConfig.GenerateRandomPassword || !amtConfig.GenerateRandomMEBxPassword)) {
        // store the passwords in Vault
        const data = { data: {} }
        if (!amtConfig.GenerateRandomPassword) {
          data.data[`${amtConfig.ProfileName}_DEVICE_AMT_PASSWORD`] = pwdBefore
          log.debug('AMT Password written to vault')
        }
        if (!amtConfig.GenerateRandomMEBxPassword) {
          data.data[`${amtConfig.ProfileName}_DEVICE_MEBX_PASSWORD`] = mebxPwdBefore
          log.debug('MEBX Password written to vault')
        }
        await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${amtConfig.ProfileName}`, data)
      }
      res.status(201).json(API_RESPONSE(null, null, PROFILE_INSERTION_SUCCESS(amtConfig.ProfileName))).end()
    }
  } catch (error) {
    log.error(`Failed to create a AMT profile: ${amtConfig.ProfileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Insert AMT profile ${amtConfig.ProfileName}`))).end()
    }
  }
}
