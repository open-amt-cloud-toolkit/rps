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
import { PROFILE_INSERTION_FAILED_DUPLICATE, PROFILE_INSERTION_CIRA_CONSTRAINT, API_UNEXPECTED_EXCEPTION, PROFILE_INSERTION_NETWORK_CONSTRAINT } from '../utils/constants'
import { NetConfigDb } from './netProfiles'
import Logger from '../Logger'
import { RPSError } from '../utils/RPSError'
import { ProfilesWifiConfigsDb } from './profileWifiConfigs'

export class ProfilesDb implements IProfilesDb {
  db: any
  ciraConfigs: CiraConfigDb
  networkConfigs: NetConfigDb
  wifiConfigs: ProfilesWifiConfigsDb
  log: Logger
  constructor (dbCreator: IDbCreator) {
    this.db = dbCreator.getDb()
    this.ciraConfigs = new CiraConfigDb(dbCreator)
    this.networkConfigs = new NetConfigDb(dbCreator)
    this.wifiConfigs = new ProfilesWifiConfigsDb(dbCreator)
    this.log = new Logger('ProfilesDb')
  }

  /**
   * @description Get all AMT Profiles from DB
   * @returns {AMTConfiguration[]} returns an array of AMT profile objects
   */
  async getAllProfiles (): Promise<AMTConfiguration[]> {
    const results = await this.db.query('SELECT profile_name as ProfileName, activation as Activation, amt_password as AMTPassword, generate_random_password as GenerateRandomPassword, cira_config_name as ciraConfigName, random_password_length as passwordLength, network_profile_name as NetworkProfileName,mebx_password as MEBxPassword, generate_random_mebx_password as GenerateRandomMEBxPassword, random_mebx_password_length as mebxPasswordLength, tags, dhcp_enabled FROM profiles')
    const allProfiles: AMTConfiguration[] = await Promise.all(results.rows.map(async profile => {
      let result: AMTConfiguration = null
      result = mapToProfile(profile)
      if (result.dhcpEnabled) {
        result.wifiConfigs = await this.wifiConfigs.getProfileWifiConfigs(result.profileName)
      }
      delete result.amtPassword
      delete result.mebxPassword
      return result
    }))
    return allProfiles
  }

  /**
   * @description Get AMT Profile from DB by name
   * @param {string} profileName
   * @returns {AMTConfiguration} AMT Profile object
   */
  async getProfileByName (profileName: string): Promise<AMTConfiguration> {
    const results = await this.db.query('SELECT profile_name as ProfileName, activation as Activation, amt_password as AMTPassword, generate_random_password as GenerateRandomPassword, cira_config_name as ciraConfigName, random_password_length as passwordLength, network_profile_name as NetworkProfileName, mebx_password as MEBxPassword, generate_random_mebx_password as GenerateRandomMEBxPassword, random_mebx_password_length as  mebxPasswordLength, tags, dhcp_enabled FROM profiles WHERE profile_name = $1', [profileName])
    let amtProfile: AMTConfiguration = null
    if (results.rowCount > 0) {
      amtProfile = mapToProfile(results.rows[0])
      if (amtProfile.dhcpEnabled) {
        amtProfile.wifiConfigs = await this.wifiConfigs.getProfileWifiConfigs(profileName)
      }
      delete amtProfile.amtPassword
      delete amtProfile.mebxPassword
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
    if (this.wifiConfigs.deleteProfileWifiConfigs(profileName)) {
      const results = await this.db.query('DELETE FROM profiles WHERE profile_name = $1', [profileName])
      if (results.rowCount > 0) {
        return true
      }
    }
    return false
  }

  /**
   * @description Insert AMT profile into DB
   * @param {AMTConfiguration} amtConfig
   * @returns {boolean} Returns amtConfig object
   */
  async insertProfile (amtConfig: AMTConfiguration): Promise<AMTConfiguration> {
    try {
      const results = await this.db.query('INSERT INTO profiles(profile_name, activation, amt_password, cira_config_name, generate_random_password, random_password_characters, random_password_length, network_profile_name, mebx_password, generate_random_mebx_password, random_mebx_password_length, tags, dhcp_enabled) ' +
        'values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)',
      [
        amtConfig.profileName,
        amtConfig.activation,
        amtConfig.amtPassword,
        amtConfig.ciraConfigName,
        amtConfig.generateRandomPassword,
        amtConfig.randomPasswordCharacters,
        amtConfig.passwordLength,
        amtConfig.networkConfigName,
        amtConfig.mebxPassword,
        amtConfig.generateRandomMEBxPassword,
        amtConfig.mebxPasswordLength,
        amtConfig.tags,
        amtConfig.dhcpEnabled
      ])
      if (results.rowCount > 0) {
        if (amtConfig.wifiConfigs?.length > 0) {
          await this.wifiConfigs.createProfileWifiConfigs(amtConfig.wifiConfigs, amtConfig.profileName)
        }
        const profile = await this.getProfileByName(amtConfig.profileName)
        return profile
      }
      return null
    } catch (error) {
      this.log.error(`Failed to insert AMT profile: ${amtConfig.profileName}`, error)
      if (error.code === '23505') { // Unique key violation
        throw new RPSError(PROFILE_INSERTION_FAILED_DUPLICATE(amtConfig.profileName), 'Unique key violation')
      }
      if (error.code === '23503') { // Unique key violation
        if (error.message.includes('profiles_cira_config_name_fkey')) {
          throw new RPSError(PROFILE_INSERTION_CIRA_CONSTRAINT(amtConfig.ciraConfigName), 'Foreign key constraint violation')
        } else {
          throw new RPSError(PROFILE_INSERTION_NETWORK_CONSTRAINT(amtConfig.networkConfigName), 'Foreign key constraint violation')
        }
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(amtConfig.profileName))
    }
  }

  /**
   * @description Update AMT profile into DB
   * @param {AMTConfiguration} amtConfig
   * @returns {AMTConfiguration} Returns amtConfig object
   */
  async updateProfile (amtConfig: AMTConfiguration): Promise<AMTConfiguration> {
    try {
      const results = await this.db.query('UPDATE profiles SET activation=$2, amt_password=$3, cira_config_name=$4, generate_random_password=$5, random_password_characters=$6, random_password_length=$7, network_profile_name=$8, mebx_password=$9, generate_random_mebx_password=$10, random_mebx_password_length=$11, tags=$12, dhcp_enabled=$13 WHERE profile_name=$1',
        [
          amtConfig.profileName,
          amtConfig.activation,
          amtConfig.amtPassword,
          amtConfig.ciraConfigName,
          amtConfig.generateRandomPassword,
          amtConfig.randomPasswordCharacters,
          amtConfig.passwordLength,
          amtConfig.networkConfigName,
          amtConfig.mebxPassword,
          amtConfig.generateRandomMEBxPassword,
          amtConfig.mebxPasswordLength,
          amtConfig.tags,
          amtConfig.dhcpEnabled
        ])
      if (results.rowCount > 0) {
        if (amtConfig.wifiConfigs?.length > 0) {
          await this.wifiConfigs.createProfileWifiConfigs(amtConfig.wifiConfigs, amtConfig.profileName)
        }
        const profile = await this.getProfileByName(amtConfig.profileName)
        return profile
      }
      return null
    } catch (error) {
      this.log.error(`Failed to update AMT profile: ${amtConfig.profileName}`, error)
      if (error.code === '23503') { // Foreign key constraint violation
        if (error.message.includes('profiles_cira_config_name_fkey')) {
          throw new RPSError(PROFILE_INSERTION_CIRA_CONSTRAINT(amtConfig.ciraConfigName), 'Foreign key constraint violation')
        } else {
          throw new RPSError(PROFILE_INSERTION_NETWORK_CONSTRAINT(amtConfig.networkConfigName), 'Foreign key constraint violation')
        }
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(amtConfig.profileName))
    }
  }
}
