/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { IProfilesDb } from '../../../interfaces/database/IProfilesDb'
import { ProfilesDbFactory } from '../../../repositories/factories/ProfilesDbFactory'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, PROFILE_NOT_FOUND } from '../../../utils/constants'
import { AMTConfiguration } from '../../../models/Rcs'
import { ClientAction, ProfileWifiConfigs } from '../../../RCS.Config'
import { RPSError } from '../../../utils/RPSError'
import { IProfileWifiConfigsDb } from '../../../interfaces/database/IProfileWifiConfigsDb'
import { ProfileWifiConfigsDbFactory } from '../../../repositories/factories/ProfileWifiConfigsDbFactory'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function editProfile (req: Request, res: Response): Promise<void> {
  let profilesDb: IProfilesDb = null
  const log = new Logger('editProfile')
  const newConfig = req.body
  newConfig.tenantId = req.tenantId
  try {
    profilesDb = ProfilesDbFactory.getProfilesDb()
    const profileWifiConfigsDb: IProfileWifiConfigsDb = ProfileWifiConfigsDbFactory.getProfileWifiConfigsDb()
    const oldConfig: AMTConfiguration = await profilesDb.getByName(newConfig.profileName)

    if (oldConfig == null) {
      MqttProvider.publishEvent('fail', ['editProfile'], `Profile Not Found : ${newConfig.profileName}`)
      log.debug(`Not found: ${newConfig.profileName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', PROFILE_NOT_FOUND(newConfig.profileName))).end()
    } else {
      const amtConfig: AMTConfiguration = await getUpdatedData(newConfig, oldConfig)
      amtConfig.wifiConfigs = await handleWifiConfigs(newConfig, oldConfig, profileWifiConfigsDb)
      // Assigning value key value for AMT Random Password and MEBx Random Password to store in database
      const amtPwdBefore = amtConfig.amtPassword
      const mebxPwdBefore = amtConfig.mebxPassword
      if (req.secretsManager) {
        // store the AMT password key into db
        amtConfig.amtPassword = 'AMT_PASSWORD'
        // store the MEBX password key into db
        amtConfig.mebxPassword = 'MEBX_PASSWORD'
      }
      // SQL Query > Insert Data
      const results = await profilesDb.update(amtConfig)
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
        if (req.secretsManager) {
          const data = { data: { AMT_PASSWORD: '', MEBX_PASSWORD: '' } }
          data.data.AMT_PASSWORD = amtPwdBefore
          data.data.MEBX_PASSWORD = mebxPwdBefore
          log.debug('AMT and MEBX Passwords written to vault')
          await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${amtConfig.profileName}`, data)
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

export const handleWifiConfigs = async (newConfig: AMTConfiguration, oldConfig: AMTConfiguration, profileWifiConfigsDb: IProfileWifiConfigsDb): Promise<ProfileWifiConfigs[]> => {
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
  const amtConfig: AMTConfiguration = { profileName: newConfig.profileName } as AMTConfiguration
  amtConfig.amtPassword = newConfig.amtPassword ?? oldConfig.amtPassword
  amtConfig.mebxPassword = newConfig.mebxPassword ?? oldConfig.mebxPassword
  amtConfig.activation = newConfig.activation ?? oldConfig.activation
  if (amtConfig.activation === ClientAction.CLIENTCTLMODE) {
    amtConfig.mebxPassword = null
  }
  amtConfig.ciraConfigName = newConfig.ciraConfigName
  amtConfig.tags = newConfig.tags ?? oldConfig.tags
  amtConfig.dhcpEnabled = newConfig.dhcpEnabled ?? oldConfig.dhcpEnabled
  amtConfig.tenantId = newConfig.tenantId ?? oldConfig.tenantId
  return amtConfig
}
