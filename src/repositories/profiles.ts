/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDbCreator } from './interfaces/IDbCreator'
import { IProfilesDb } from './interfaces/IProfilesDb'
import { CIRAConfig, NetworkConfig } from '../RCS.Config'
import { mapToProfile } from './mapToProfile'
import { AMTConfiguration } from '../models/Rcs'
import { CiraConfigDb } from './ciraConfigs'
import { PROFILE_INSERTION_FAILED_DUPLICATE, PROFILE_INSERTION_CIRA_CONSTRAINT, API_UNEXPECTED_EXCEPTION } from '../utils/constants'
import { NetConfigDb } from './netProfiles'
import Logger from '../Logger'
import { RPSError } from '../utils/RPSError'

export class ProfilesDb implements IProfilesDb {
  db: any
  ciraConfigs: CiraConfigDb
  networkConfigs: NetConfigDb
  log: Logger
  constructor (dbCreator: IDbCreator) {
    this.db = dbCreator.getDb()
    this.ciraConfigs = new CiraConfigDb(dbCreator)
    this.networkConfigs = new NetConfigDb(dbCreator)
    this.log = new Logger('ProfilesDb')
  }

  /**
   * @description Get all AMT Profiles from DB
   * @returns {AMTConfiguration[]} returns an array of AMT profile objects
   */
  async getAllProfiles (): Promise<AMTConfiguration[]> {
    const results = await this.db.query('SELECT profile_name as ProfileName, activation as Activation, amt_password as AMTPassword, generate_random_password as GenerateRandomPassword, configuration_script as ConfigurationScript, cira_config_name as ciraConfigName, random_password_length as RandomPasswordLength, network_profile_name as NetworkProfileName,mebx_password as MEBxPassword, generate_random_mebx_password as GenerateRandomMEBxPassword, random_mebx_password_length as RandomMEBxPasswordLength FROM profiles')
    return await Promise.all(results.rows.map(async p => {
      const result = mapToProfile(p)
      return result
    }))
  }

  /**
   * @description Get AMT Profile from DB by name
   * @param {string} profileName
   * @returns {AMTConfiguration} AMT Profile object
   */
  async getProfileByName (profileName: string): Promise<AMTConfiguration> {
    const results = await this.db.query('SELECT profile_name as ProfileName, activation as Activation, amt_password as AMTPassword, generate_random_password as GenerateRandomPassword, configuration_script as ConfigurationScript, cira_config_name as ciraConfigName, random_password_length as RandomPasswordLength, network_profile_name as NetworkProfileName, mebx_password as MEBxPassword, generate_random_mebx_password as GenerateRandomMEBxPassword, random_mebx_password_length as RandomMEBxPasswordLength FROM profiles WHERE profile_name = $1', [profileName])
    let amtProfile: AMTConfiguration = {} as AMTConfiguration
    if (results.rowCount > 0) {
      amtProfile = mapToProfile(results.rows[0])
    }
    return amtProfile
  }

  /**
   * @description Get CIRA config from DB by name
   * @param {string} configName
   * @returns {CIRAConfig} CIRA config object
   */
  async getCiraConfigForProfile (configName: string): Promise<CIRAConfig> {
    return await this.ciraConfigs.getCiraConfigByName(configName)
  }

  /**
   * @description Get Network config from DB by name
   * @param {string} NetworkConfigName
   * @returns {NetworkConfig} Network config object
   */
  async getNetworkConfigForProfile (NetworkConfigName: string): Promise<NetworkConfig> {
    return await this.networkConfigs.getProfileByName(NetworkConfigName)
  }

  /**
   * @description Delete AMT Profile from DB by name
   * @param {string} profileName
   * @returns {boolean} Return true on successful deletion
   */
  async deleteProfileByName (profileName: string): Promise<boolean> {
    const results = await this.db.query('DELETE FROM profiles WHERE profile_name = $1', [profileName])
    if (results.rowCount > 0) {
      return true
    }
    return false
  }

  /**
   * @description Insert AMT profile into DB
   * @param {AMTConfiguration} amtConfig
   * @returns {boolean} Return true on successful insertion
   */
  async insertProfile (amtConfig: AMTConfiguration): Promise<boolean> {
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
        return true
      }
      return false
    } catch (error) {
      this.log.error(`Failed to insert AMT profile: ${amtConfig.ProfileName}`, error)
      if (error.code === '23505') { // Unique key violation
        throw new RPSError(PROFILE_INSERTION_FAILED_DUPLICATE(amtConfig.ProfileName))
      }
      if (error.code === '23503') { // Unique key violation
        throw new RPSError(PROFILE_INSERTION_CIRA_CONSTRAINT(amtConfig.CIRAConfigName))
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(amtConfig.ProfileName))
    }
  }

  /**
   * @description Update AMT profile into DB
   * @param {AMTConfiguration} amtConfig
   * @returns {boolean} Return true on successful updation
   */
  async updateProfile (amtConfig: AMTConfiguration): Promise<boolean> {
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
      if (results.rowCount > 0) {
        return true
      }
      return false
    } catch (error) {
      this.log.error(`Failed to update AMT profile: ${amtConfig.ProfileName}`, error)
      if (error.code === '23503') { // Unique key violation
        throw new RPSError(PROFILE_INSERTION_CIRA_CONSTRAINT(amtConfig.CIRAConfigName))
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(amtConfig.ProfileName))
    }
  }
}
