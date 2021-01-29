/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IProfilesDb } from '../../../repositories/interfaces/IProfilesDb'
import { ProfilesDbFactory } from '../../../repositories/ProfilesDbFactory'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { API_UNEXPECTED_EXCEPTION, PROFILE_NOT_FOUND } from '../../../utils/constants'
import { validationResult } from 'express-validator'
import { AMTConfiguration } from '../../../models/Rcs'
import { ClientAction } from '../../../RCS.Config'

export async function editProfile (req, res): Promise<void> {
  let profilesDb: IProfilesDb = null
  const log = new Logger('editProfile')
  const newConfig = req.body.payload
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }
    profilesDb = ProfilesDbFactory.getProfilesDb()
    const oldConfig: AMTConfiguration = await profilesDb.getProfileByName(newConfig.profileName)

    if (Object.keys(oldConfig).length === 0) {
      log.info(`Not found: ${newConfig.profileName}`)
      res.status(404).end(PROFILE_NOT_FOUND(newConfig.profileName))
    } else {
      const amtConfig: AMTConfiguration = getUpdatedData(newConfig, oldConfig)
      // Assigning value key value for AMT Random Password and MEBx Random Password to store in database
      const amtPwdBefore = amtConfig.AMTPassword
      const mebxPwdBefore = amtConfig.MEBxPassword
      if (req.secretsManager) {
        // store the AMT password key into db
        if (!amtConfig.GenerateRandomPassword) {
          amtConfig.AMTPassword = `${amtConfig.ProfileName}_DEVICE_AMT_PASSWORD`
        }
        // store the MEBX password key into db
        if (!amtConfig.GenerateRandomMEBxPassword) {
          amtConfig.MEBxPassword = `${amtConfig.ProfileName}_DEVICE_MEBX_PASSWORD`
        }
      }
      // SQL Query > Insert Data
      const results = await profilesDb.updateProfile(amtConfig)
      // profile inserted  into db successfully. insert the secret into vault
      if (oldConfig.AMTPassword !== null || oldConfig.MEBxPassword !== null) {
        if (req.secretsManager) {
          log.debug('Delete in vault') // User might be flipping from false to true which we dont know. So try deleting either way.
          await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${amtConfig.ProfileName}`)
          log.debug('Password deleted from vault')
        }
      }
      if (results) {
      // store the password sent into Vault
        if (req.secretsManager && (!amtConfig.GenerateRandomPassword || !amtConfig.GenerateRandomMEBxPassword)) {
          const data = { data: {} }
          if (!amtConfig.GenerateRandomPassword) {
            data.data[`${amtConfig.ProfileName}_DEVICE_AMT_PASSWORD`] = amtPwdBefore
            log.debug('AMT Password written to vault')
          }
          if (!amtConfig.GenerateRandomMEBxPassword) {
            data.data[`${amtConfig.ProfileName}_DEVICE_MEBX_PASSWORD`] = mebxPwdBefore
            log.debug('MEBX Password written to vault')
          }
          await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${amtConfig.ProfileName}`, data)
        }
        log.info(`Updated AMT profile: ${newConfig.profileName}`)
        res.status(204).end()
      }
    }
  } catch (error) {
    log.error(`Failed to update AMT profile: ${newConfig.profileName}`, error)
    res.status(500).end(API_UNEXPECTED_EXCEPTION(`UPDATE ${newConfig.profileName}`))
  }
}

function getUpdatedData (newConfig: any, oldConfig: AMTConfiguration): AMTConfiguration {
  const amtConfig: AMTConfiguration = {} as AMTConfiguration
  amtConfig.ProfileName = newConfig.profileName
  if (newConfig.amtPassword == null) {
    amtConfig.AMTPassword = oldConfig.AMTPassword
    amtConfig.GenerateRandomPassword = false
    amtConfig.RandomPasswordLength = null
  } else {
    amtConfig.AMTPassword = newConfig.amtPassword
  }
  if (newConfig.mebxPassword == null) {
    amtConfig.MEBxPassword = oldConfig.MEBxPassword
    amtConfig.GenerateRandomMEBxPassword = false
    amtConfig.RandomMEBxPasswordLength = null
  } else {
    amtConfig.MEBxPassword = newConfig.mebxPassword
  }

  if (newConfig.generateRandomPassword) {
    amtConfig.GenerateRandomPassword = newConfig.generateRandomPassword
    amtConfig.RandomPasswordLength = newConfig.passwordLength
    amtConfig.AMTPassword = null
  } else {
    amtConfig.GenerateRandomPassword = newConfig.amtPassword == null ? oldConfig.GenerateRandomPassword : null
    amtConfig.RandomPasswordLength = newConfig.amtPassword == null ? oldConfig.RandomPasswordLength : null
  }

  if (newConfig.generateRandomMEBxPassword) {
    amtConfig.GenerateRandomMEBxPassword = newConfig.generateRandomMEBxPassword
    amtConfig.RandomMEBxPasswordLength = newConfig.mebxPasswordLength
    amtConfig.MEBxPassword = null
  } else {
    amtConfig.GenerateRandomMEBxPassword = newConfig.mebxPassword == null ? oldConfig.GenerateRandomMEBxPassword : null
    amtConfig.RandomMEBxPasswordLength = newConfig.mebxPassword == null ? oldConfig.RandomMEBxPasswordLength : null
  }
  if (newConfig.activation == null) {
    amtConfig.Activation = oldConfig.Activation
  } else {
    amtConfig.Activation = newConfig.activation
  }
  if (amtConfig.Activation === ClientAction.CLIENTCTLMODE) {
    amtConfig.GenerateRandomMEBxPassword = false
    amtConfig.RandomMEBxPasswordLength = null
    amtConfig.MEBxPassword = null
  }
  if (newConfig.ciraConfigName == null) {
    amtConfig.CIRAConfigName = oldConfig.CIRAConfigName
  } else {
    amtConfig.CIRAConfigName = newConfig.ciraConfigName
  }
  if (newConfig.networkConfigName == null) {
    amtConfig.NetworkConfigName = oldConfig.NetworkConfigName
  } else {
    amtConfig.NetworkConfigName = newConfig.networkConfigName
  }
  return amtConfig
}
