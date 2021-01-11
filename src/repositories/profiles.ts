/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDbCreator } from './interfaces/IDbCreator'
import { IProfilesDb } from './interfaces/IProfilesDb'
import { AMTConfig, CIRAConfig, NetworkConfig } from '../RCS.Config'
import { mapToProfile } from './mapToProfile'
import { AMTConfiguration } from '../models/Rcs'
import { CiraConfigDb } from './ciraConfigs'
import { PROFILE_SUCCESSFULLY_DELETED, PROFILE_INSERTION_FAILED_DUPLICATE, PROFILE_INSERTION_CIRA_CONSTRAINT } from '../utils/constants'
import { NetConfigDb } from './netProfiles'

export class ProfilesDb implements IProfilesDb {
  db: any;
  ciraConfigs: CiraConfigDb;
  networkConfigs: NetConfigDb;

  constructor (dbCreator: IDbCreator) {
    this.db = dbCreator.getDb()
    this.ciraConfigs = new CiraConfigDb(dbCreator)
    this.networkConfigs = new NetConfigDb(dbCreator)
  }

  async getAllProfiles (): Promise<AMTConfig[]> {
    const results = await this.db.query('SELECT profile_name as ProfileName, activation as Activation, amt_password as AMTPassword, generate_random_password as GenerateRandomPassword, configuration_script as ConfigurationScript, cira_config_name as ciraConfigName, random_password_length as RandomPasswordLength, network_profile_name as NetworkProfileName,mebx_password as MEBxPassword, generate_random_mebx_password as GenerateRandomMEBxPassword, random_mebx_password_length as RandomMEBxPasswordLength FROM profiles')

    return Promise.all(results.rows.map(async p => {
      const result = mapToProfile(p)
      // Not showing up the passwords or Password keys for security issues
      if (result.GenerateRandomPassword === false) {
        result.AMTPassword = null
      }
      if (result.GenerateRandomMEBxPassword === false) {
        result.MEBxPassword = null
      }
      return result
    }))
  }

  async getProfileByName (profileName): Promise<AMTConfig> {
    const results = await this.db.query('SELECT profile_name as ProfileName, activation as Activation, amt_password as AMTPassword, generate_random_password as GenerateRandomPassword, configuration_script as ConfigurationScript, cira_config_name as ciraConfigName, random_password_length as RandomPasswordLength, network_profile_name as NetworkProfileName, mebx_password as MEBxPassword, generate_random_mebx_password as GenerateRandomMEBxPassword, random_mebx_password_length as RandomMEBxPasswordLength FROM profiles WHERE profile_name = $1', [profileName])
    return (results.rowCount > 0 ? mapToProfile(results.rows[0]) : null)
  }

  async getCiraConfigForProfile (configName): Promise<CIRAConfig> {
    return await this.ciraConfigs.getCiraConfigByName(configName)
  }

  async getNetworkConfigForProfile (NetworkConfigName: string): Promise<NetworkConfig> {
    return await this.networkConfigs.getProfileByName(NetworkConfigName)
  }

  async deleteProfileByName (profileName): Promise<any> {
    const results = await this.db.query('DELETE FROM profiles WHERE profile_name = $1', [profileName])
    return (results.rowCount > 0 ? PROFILE_SUCCESSFULLY_DELETED(profileName) : null)
  }

  async insertProfile (amtConfig: AMTConfiguration): Promise<any> {
    try {
      const results = await this.db.query('INSERT INTO profiles(profile_name, activation, amt_password, configuration_script, cira_config_name, generate_random_password, random_password_characters, random_password_length, network_profile_name, mebx_password, generate_random_mebx_password, random_mebx_password_length) ' +
        'values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)',
      [
        amtConfig.ProfileName,
        amtConfig.Activation,
        amtConfig.AMTPassword,
        amtConfig.ConfigurationScript,
        amtConfig.CIRAConfigName,
        amtConfig.GenerateRandomPassword,
        amtConfig.RandomPasswordCharacters,
        amtConfig.RandomPasswordLength,
        amtConfig.NetworkConfigName,
        amtConfig.MEBxPassword,
        amtConfig.GenerateRandomMEBxPassword,
        amtConfig.RandomMEBxPasswordLength
      ])

      if (results.rowCount > 0) {
        return results.rowCount
      }
      return null
    } catch (error) {
      console.log(error)
      if (error.code == '23505') { // Unique key violation
        throw (PROFILE_INSERTION_FAILED_DUPLICATE(amtConfig.ProfileName))
      }
      if (error.code == '23503') { // Unique key violation
        throw (PROFILE_INSERTION_CIRA_CONSTRAINT(amtConfig.CIRAConfigName))
      }

      throw ('Unknown Error. Check Server Logs.')
    }
  }

  async updateProfile (amtConfig: AMTConfiguration): Promise<any> {
    try {
      const results = await this.db.query('UPDATE profiles SET activation=$2, amt_password=$3, configuration_script=$4, cira_config_name=$5, generate_random_password=$6, random_password_characters=$7, random_password_length=$8, network_profile_name=$9, mebx_password=$10, generate_random_mebx_password=$11, random_mebx_password_length=$12 WHERE profile_name=$1',
        [
          amtConfig.ProfileName,
          amtConfig.Activation,
          amtConfig.AMTPassword,
          amtConfig.ConfigurationScript,
          amtConfig.CIRAConfigName,
          amtConfig.GenerateRandomPassword,
          amtConfig.RandomPasswordCharacters,
          amtConfig.RandomPasswordLength,
          amtConfig.NetworkConfigName,
          amtConfig.MEBxPassword,
          amtConfig.GenerateRandomMEBxPassword,
          amtConfig.RandomMEBxPasswordLength
        ])

      return results.rowCount
    } catch (error) {
      console.log(error)
      if (error.code == '23503') { // Unique key violation
        throw (PROFILE_INSERTION_CIRA_CONSTRAINT(amtConfig.CIRAConfigName))
      }

      throw ('Unknown Error. Check Server Logs.')
    }
  }
}
