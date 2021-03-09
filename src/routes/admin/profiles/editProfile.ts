/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IProfilesDb } from '../../../repositories/interfaces/IProfilesDb'
import { ProfilesDbFactory } from '../../../repositories/factories/ProfilesDbFactory'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, PROFILE_NOT_FOUND } from '../../../utils/constants'
import { validationResult } from 'express-validator'
import { AMTConfiguration } from '../../../models/Rcs'
import { ClientAction } from '../../../RCS.Config'
import { RPSError } from '../../../utils/RPSError'

export async function editProfile (req, res): Promise<void> {
  let profilesDb: IProfilesDb = null
  const log = new Logger('editProfile')
  const newConfig = req.body
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }
    profilesDb = ProfilesDbFactory.getProfilesDb()
    const oldConfig: AMTConfiguration = await profilesDb.getProfileByName(newConfig.profileName)

    if (oldConfig == null) {
      log.info(`Not found: ${newConfig.profileName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', PROFILE_NOT_FOUND(newConfig.profileName))).end()
    } else {
      const amtConfig: AMTConfiguration = getUpdatedData(newConfig, oldConfig)
      // Assigning value key value for AMT Random Password and MEBx Random Password to store in database
      const amtPwdBefore = amtConfig.amtPassword
      const mebxPwdBefore = amtConfig.mebxPassword
      if (req.secretsManager) {
        // store the AMT password key into db
        if (!amtConfig.generateRandomPassword) {
          amtConfig.amtPassword = `${amtConfig.profileName}_DEVICE_AMT_PASSWORD`
        }
        // store the MEBX password key into db
        if (!amtConfig.generateRandomMEBxPassword) {
          amtConfig.mebxPassword = `${amtConfig.profileName}_DEVICE_MEBX_PASSWORD`
        }
      }
      // SQL Query > Insert Data
      const results = await profilesDb.updateProfile(amtConfig)
      if (results) {
        // profile inserted  into db successfully. insert the secret into vault
        if (oldConfig.amtPassword !== null || oldConfig.mebxPassword !== null) {
          if (req.secretsManager) {
            log.debug('Delete in vault') // User might be flipping from false to true which we dont know. So try deleting either way.
            await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${amtConfig.profileName}`)
            log.debug('Password deleted from vault')
          }
        }
        // store the password sent into Vault
        if (req.secretsManager && (!amtConfig.generateRandomPassword || !amtConfig.generateRandomMEBxPassword)) {
          const data = { data: {} }
          if (!amtConfig.generateRandomPassword) {
            data.data[`${amtConfig.profileName}_DEVICE_AMT_PASSWORD`] = amtPwdBefore
            log.debug('AMT Password written to vault')
          }
          if (!amtConfig.generateRandomMEBxPassword) {
            data.data[`${amtConfig.profileName}_DEVICE_MEBX_PASSWORD`] = mebxPwdBefore
            log.debug('MEBX Password written to vault')
          }
          await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${amtConfig.profileName}`, data)
        }
        log.info(`Updated AMT profile: ${newConfig.profileName}`)
        delete results.amtPassword
        delete results.mebxPassword
        res.status(200).json(results).end()
      }
    }
  } catch (error) {
    log.error(`Failed to update AMT profile: ${newConfig.profileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Update AMT profile ${newConfig.profileName}`))).end()
    }
  }
}

export const handleAMTPassword = (amtConfig: AMTConfiguration, newConfig: AMTConfiguration, oldConfig: AMTConfiguration): AMTConfiguration => {
  if (newConfig.amtPassword == null) {
    amtConfig.amtPassword = oldConfig.amtPassword
    amtConfig.generateRandomPassword = false
    amtConfig.passwordLength = null
  } else {
    amtConfig.amtPassword = newConfig.amtPassword
  }
  return amtConfig
}

export const handleMEBxPassword = (amtConfig: AMTConfiguration, newConfig: AMTConfiguration, oldConfig: AMTConfiguration): AMTConfiguration => {
  if (newConfig.mebxPassword == null) {
    amtConfig.mebxPassword = oldConfig.mebxPassword
    amtConfig.generateRandomMEBxPassword = false
    amtConfig.mebxPasswordLength = null
  } else {
    amtConfig.mebxPassword = newConfig.mebxPassword
  }
  return amtConfig
}

export const handleGenerateRandomPassword = (amtConfig: AMTConfiguration, newConfig: AMTConfiguration, oldConfig: AMTConfiguration): AMTConfiguration => {
  if (newConfig.generateRandomPassword) {
    amtConfig.generateRandomPassword = newConfig.generateRandomPassword
    amtConfig.passwordLength = newConfig.passwordLength
    amtConfig.amtPassword = null
  } else {
    amtConfig.generateRandomPassword = newConfig.amtPassword == null ? oldConfig.generateRandomPassword : null
    amtConfig.passwordLength = newConfig.amtPassword == null ? oldConfig.passwordLength : null
  }
  return amtConfig
}

export const handleGenerateRandomMEBxPassword = (amtConfig: AMTConfiguration, newConfig: AMTConfiguration, oldConfig: AMTConfiguration): AMTConfiguration => {
  if (newConfig.generateRandomMEBxPassword) {
    amtConfig.generateRandomMEBxPassword = newConfig.generateRandomMEBxPassword
    amtConfig.mebxPasswordLength = newConfig.mebxPasswordLength
    amtConfig.mebxPassword = null
  } else {
    amtConfig.generateRandomMEBxPassword = newConfig.mebxPassword == null ? oldConfig.generateRandomMEBxPassword : null
    amtConfig.mebxPasswordLength = newConfig.mebxPassword == null ? oldConfig.mebxPasswordLength : null
  }
  return amtConfig
}

export const getUpdatedData = (newConfig: any, oldConfig: AMTConfiguration): AMTConfiguration => {
  let amtConfig: AMTConfiguration = { profileName: newConfig.profileName } as AMTConfiguration
  amtConfig = handleAMTPassword(amtConfig, newConfig, oldConfig)
  amtConfig = handleMEBxPassword(amtConfig, newConfig, oldConfig)
  amtConfig = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  amtConfig = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  amtConfig.activation = newConfig.activation ?? oldConfig.activation
  if (amtConfig.activation === ClientAction.CLIENTCTLMODE) {
    amtConfig.generateRandomMEBxPassword = false
    amtConfig.mebxPasswordLength = null
    amtConfig.mebxPassword = null
  }
  amtConfig.ciraConfigName = newConfig.ciraConfigName ?? oldConfig.ciraConfigName
  amtConfig.networkConfigName = newConfig.networkConfigName ?? oldConfig.networkConfigName
  amtConfig.tags = newConfig.tags ?? oldConfig.tags
  return amtConfig
}
