/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IProfilesDb } from '../../../repositories/interfaces/IProfilesDb'
import { ProfilesDbFactory } from '../../../repositories/ProfilesDbFactory'
import { AMTConfig, ClientAction } from '../../../RCS.Config'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import {
  PROFILE_ERROR, PROFILE_INVALID_INPUT,
  PROFILE_NOT_FOUND,
  PROFILE_UPDATE_SUCCESS,
  PROFILE_INVALID_INPUT_AMT_PASSWORD,
  PROFILE_INVALID_INPUT_MEBX_PASSWORD,
  PROFILE_INVALID_AMT_PASSWORD_SELECTION,
  PROFILE_INVALID_MEBX_PASSWORD_SELECTION,
  PROFILE_INVALID_AMT_PASSWORD_LENGTH,
  PROFILE_INVALID_MEBX_PASSWORD_LENGTH,
  PROFILE_MEBX_MANDATORY
} from '../../../utils/constants'
import { passwordValidation, passwordLengthValidation } from '../../../utils/passwordValidationUtils'

export async function editProfile (req, res): Promise<void> {
  let profilesDb: IProfilesDb = null
  const log = new Logger('editProfile')
  const amtConfig: AMTConfig = readBody(req, res)

  try {
    // if generateRandomPassword is false, insert the amtPassword into vault using a
    // key and insert the modified profile into db.

    profilesDb = ProfilesDbFactory.getProfilesDb()

    // Validate AMT Random Password
    const amtPwdBefore = amtConfig.AMTPassword
    if (!amtConfig.GenerateRandomPassword) {
      // store the AMT password key into db
      if (req.secretsManager) {
        log.silly('Generate AMT password key')
        amtConfig.AMTPassword = `${amtConfig.ProfileName}_DEVICE_AMT_PASSWORD`
      }
    }

    // Validate MEBx Random Password
    const mebxPwdBefore = amtConfig.MEBxPassword
    if (!amtConfig.GenerateRandomMEBxPassword) {
      // store the MEBX password key into db
      if (req.secretsManager) {
        log.silly('Generate MEBx password key')
        amtConfig.MEBxPassword = `${amtConfig.ProfileName}_DEVICE_MEBX_PASSWORD`
      }
    }

    let errorReason
    // SQL Query > Insert Data
    const results = await profilesDb.updateProfile(amtConfig).catch((reason) => {
      errorReason = reason
    })

    // profile inserted  into db successfully. insert the secret into vault
    if (amtConfig.GenerateRandomPassword || amtConfig.GenerateRandomMEBxPassword) {
      if (req.secretsManager) {
        log.debug('Delete in vault') // User might be flipping from false to true which we dont know. So try deleting either way.
        await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${amtConfig.ProfileName}`)
        log.debug('Password deleted from vault')
      }
    }

    if (!errorReason && (!amtConfig.GenerateRandomPassword || !amtConfig.GenerateRandomMEBxPassword) && results > 0) {
      // store the password sent into Vault
      if (req.secretsManager) {
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
      } else {
        log.debug('No secrets manager configured. Storing in DB.')
        log.debug('Password will be visible in plain text.')
      }
    }

    if (!errorReason && results > 0) {
      // TBD: Status should be 204
      res.status(200).end(PROFILE_UPDATE_SUCCESS(amtConfig.ProfileName))
    } else {
      if (errorReason) res.status(500).end(`${errorReason}`)
      else res.status(404).end(PROFILE_NOT_FOUND(amtConfig.ProfileName))
    }
  } catch (error) {
    if (res.status) return
    console.log(error)
    res.status(500).end(PROFILE_ERROR(amtConfig.ProfileName))
  }
}

function readBody (req, res): AMTConfig {
  const config: AMTConfig = {} as AMTConfig
  const body = req.body

  if (typeof body.payload.generateRandomPassword === 'string') {
    if (body.payload.generateRandomPassword.toLowerCase() === 'true') {
      body.payload.generateRandomPassword = true
    } else if (body.payload.generateRandomPassword.toLowerCase() === 'false') {
      body.payload.generateRandomPassword = false
    }
  }

  if (typeof body.payload.generateRandomMEBxPassword === 'string') {
    if (body.payload.generateRandomMEBxPassword.toLowerCase() === 'true') {
      body.payload.generateRandomMEBxPassword = true
    } else if (body.payload.generateRandomMEBxPassword.toLowerCase() === 'false') {
      body.payload.generateRandomMEBxPassword = false
    }
  }

  config.ProfileName = body.payload.profileName
  config.AMTPassword = body.payload.amtPassword ? body.payload.amtPassword : null
  config.MEBxPassword = body.payload.mebxPassword ? body.payload.mebxPassword : null
  config.GenerateRandomMEBxPassword = body.payload.generateRandomMEBxPassword ? body.payload.generateRandomMEBxPassword : false
  config.RandomMEBxPasswordLength = body.payload.mebxPasswordLength ? body.payload.mebxPasswordLength : null
  config.GenerateRandomPassword = body.payload.generateRandomPassword ? body.payload.generateRandomPassword : false
  config.RandomPasswordLength = body.payload.passwordLength ? body.payload.passwordLength : null
  config.ConfigurationScript = body.payload.configScript
  config.CIRAConfigName = body.payload.ciraConfigName
  config.Activation = body.payload.activation
  config.RandomPasswordCharacters = body.payload.randomPasswordCharacters
  config.NetworkConfigName = body.payload.networkConfigName

  if (config.ProfileName === null ||
    config.GenerateRandomPassword === null ||
    config.GenerateRandomMEBxPassword === null ||
    config.Activation === null ||
    (config.GenerateRandomPassword && config.RandomPasswordLength == null) ||
    (!config.GenerateRandomPassword && config.AMTPassword == null)) {
    res.status(400).end(PROFILE_INVALID_INPUT)
    throw new Error(PROFILE_INVALID_INPUT)
  }

  if (config.Activation == ClientAction.ADMINCTLMODE && ((config.GenerateRandomMEBxPassword && config.RandomMEBxPasswordLength == null) ||
    (!config.GenerateRandomMEBxPassword && config.MEBxPassword == null))) {
    res.status(400).end(PROFILE_MEBX_MANDATORY)
    throw new Error(PROFILE_MEBX_MANDATORY)
  }

  if (config.AMTPassword !== null) {
    if (config.GenerateRandomPassword) {
      res.status(400).end(PROFILE_INVALID_AMT_PASSWORD_SELECTION)
      throw new Error(PROFILE_INVALID_AMT_PASSWORD_SELECTION)
    }
    if (!passwordValidation(config.AMTPassword) || !passwordLengthValidation(config.AMTPassword)) {
      res.status(400).end(PROFILE_INVALID_INPUT_AMT_PASSWORD)
      throw new Error(PROFILE_INVALID_INPUT_AMT_PASSWORD)
    }
  } else if (config.GenerateRandomPassword && (config.RandomPasswordLength < 8 || config.RandomPasswordLength > 32)) {
    res.status(400).end(PROFILE_INVALID_AMT_PASSWORD_LENGTH)
    throw new Error(PROFILE_INVALID_AMT_PASSWORD_LENGTH)
  }

  if (config.MEBxPassword !== null) {
    if (config.GenerateRandomMEBxPassword) {
      res.status(400).end(PROFILE_INVALID_MEBX_PASSWORD_SELECTION)
      throw new Error(PROFILE_INVALID_MEBX_PASSWORD_SELECTION)
    }
    if (!passwordValidation(config.MEBxPassword) || !passwordLengthValidation(config.MEBxPassword)) {
      res.status(400).end(PROFILE_INVALID_INPUT_AMT_PASSWORD)
      throw new Error(PROFILE_INVALID_INPUT_MEBX_PASSWORD)
    }
  } else if (config.GenerateRandomMEBxPassword && (config.RandomMEBxPasswordLength < 8 || config.RandomMEBxPasswordLength > 32)) {
    res.status(400).end(PROFILE_INVALID_MEBX_PASSWORD_LENGTH)
    throw new Error(PROFILE_INVALID_MEBX_PASSWORD_LENGTH)
  }

  return config
}
