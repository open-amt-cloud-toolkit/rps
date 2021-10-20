/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, PROFILE_NOT_FOUND } from '../../../utils/constants'
import { AMTConfiguration } from '../../../models/Rcs'
import { ClientAction, ProfileWifiConfigs } from '../../../RCS.Config'
import { RPSError } from '../../../utils/RPSError'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'
import { IProfilesWifiConfigsTable } from '../../../interfaces/database/IProfileWifiConfigsDb'

export async function editProfile (req: Request, res: Response): Promise<void> {
  const log = new Logger('editProfile')
  const newConfig = req.body
  newConfig.tenantId = req.tenantId
  try {
    const oldConfig: AMTConfiguration = await req.db.profiles.getByName(newConfig.profileName)

    if (oldConfig == null) {
      MqttProvider.publishEvent('fail', ['editProfile'], `Profile Not Found : ${newConfig.profileName}`)
      log.debug(`Not found: ${newConfig.profileName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', PROFILE_NOT_FOUND(newConfig.profileName))).end()
    } else {
      const amtConfig: AMTConfiguration = await getUpdatedData(newConfig, oldConfig)
      amtConfig.wifiConfigs = await handleWifiConfigs(newConfig, oldConfig, req.db.profileWirelessConfigs)
      // Assigning value key value for AMT Random Password and MEBx Random Password to store in database
      const amtPwdBefore = amtConfig.amtPassword
      const mebxPwdBefore = amtConfig.mebxPassword
      if (req.secretsManager) {
        // store the AMT password key into db
        if (!amtConfig.generateRandomPassword) {
          amtConfig.amtPassword = 'AMT_PASSWORD'
        }
        // store the MEBX password key into db
        if (!amtConfig.generateRandomMEBxPassword && amtConfig.activation === 'acmactivate') {
          amtConfig.mebxPassword = 'MEBX_PASSWORD'
        }
      }
      // SQL Query > Insert Data
      const results = await req.db.profiles.update(amtConfig)
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
          const data = { data: { AMT_PASSWORD: null, MEBX_PASSWORD: null } }
          if (!amtConfig.generateRandomPassword) {
            data.data.AMT_PASSWORD = amtPwdBefore
            log.debug('AMT Password written to vault')
          }
          if (!amtConfig.generateRandomMEBxPassword) {
            data.data.MEBX_PASSWORD = mebxPwdBefore
            log.debug('MEBX Password written to vault')
          }

          if (data.data.AMT_PASSWORD != null || data.data.MEBX_PASSWORD != null) {
            await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${amtConfig.profileName}`, data)
          }
        }
        log.verbose(`Updated AMT profile: ${newConfig.profileName}`)
        delete results.amtPassword
        delete results.mebxPassword
        MqttProvider.publishEvent('success', ['editProfile'], `Updated Profile : ${newConfig.profileName}`)
        res.status(200).json(results).end()
      }
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['editProfile'], `Failed to update profile : ${newConfig.profileName}`)
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
  } else {
    amtConfig.amtPassword = newConfig.amtPassword
  }
  return amtConfig
}

export const handleMEBxPassword = (amtConfig: AMTConfiguration, newConfig: AMTConfiguration, oldConfig: AMTConfiguration): AMTConfiguration => {
  if (newConfig.mebxPassword == null) {
    amtConfig.mebxPassword = oldConfig.mebxPassword
    amtConfig.generateRandomMEBxPassword = false
  } else {
    amtConfig.mebxPassword = newConfig.mebxPassword
  }
  return amtConfig
}

export const handleGenerateRandomPassword = (amtConfig: AMTConfiguration, newConfig: AMTConfiguration, oldConfig: AMTConfiguration): AMTConfiguration => {
  if (newConfig.generateRandomPassword) {
    amtConfig.generateRandomPassword = newConfig.generateRandomPassword
    amtConfig.amtPassword = null
  } else {
    amtConfig.generateRandomPassword = newConfig.amtPassword == null ? oldConfig.generateRandomPassword : false
  }
  return amtConfig
}

export const handleGenerateRandomMEBxPassword = (amtConfig: AMTConfiguration, newConfig: AMTConfiguration, oldConfig: AMTConfiguration): AMTConfiguration => {
  if (newConfig.generateRandomMEBxPassword) {
    amtConfig.generateRandomMEBxPassword = newConfig.generateRandomMEBxPassword
    amtConfig.mebxPassword = null
  } else {
    amtConfig.generateRandomMEBxPassword = newConfig.mebxPassword == null ? oldConfig.generateRandomMEBxPassword : false
  }
  return amtConfig
}

export const handleWifiConfigs = async (newConfig: AMTConfiguration, oldConfig: AMTConfiguration, profileWifiConfigsDb: IProfilesWifiConfigsTable): Promise<ProfileWifiConfigs[]> => {
  let wifiConfigs: ProfileWifiConfigs[] = null
  if (oldConfig.dhcpEnabled && !newConfig.dhcpEnabled) {
    await profileWifiConfigsDb.deleteProfileWifiConfigs(newConfig.profileName)
  } else if ((oldConfig.dhcpEnabled && newConfig.dhcpEnabled) || (!oldConfig.dhcpEnabled && newConfig.dhcpEnabled)) {
    await profileWifiConfigsDb.deleteProfileWifiConfigs(newConfig.profileName)
    wifiConfigs = newConfig.wifiConfigs
  }
  return wifiConfigs
}

export const getUpdatedData = async (newConfig: any, oldConfig: AMTConfiguration): Promise<AMTConfiguration> => {
  let amtConfig: AMTConfiguration = { profileName: newConfig.profileName } as AMTConfiguration
  amtConfig = handleAMTPassword(amtConfig, newConfig, oldConfig)
  amtConfig = handleMEBxPassword(amtConfig, newConfig, oldConfig)
  amtConfig = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  amtConfig = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  amtConfig.activation = newConfig.activation ?? oldConfig.activation
  if (amtConfig.activation === ClientAction.CLIENTCTLMODE) {
    amtConfig.mebxPassword = null
    amtConfig.generateRandomMEBxPassword = false
  }
  amtConfig.ciraConfigName = newConfig.ciraConfigName
  amtConfig.tags = newConfig.tags ?? oldConfig.tags
  amtConfig.dhcpEnabled = newConfig.dhcpEnabled ?? oldConfig.dhcpEnabled
  amtConfig.tenantId = newConfig.tenantId ?? oldConfig.tenantId
  return amtConfig
}
