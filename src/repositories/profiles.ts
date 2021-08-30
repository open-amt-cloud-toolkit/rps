/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { IDbCreator } from '../interfaces/database/IDbCreator'
import { IProfilesDb } from '../interfaces/database/IProfilesDb'
import { CIRAConfig } from '../RCS.Config'
import { mapToProfile } from './mapToProfile'
import { AMTConfiguration } from '../models/Rcs'
import { CiraConfigDb } from './ciraConfigs'
import { PROFILE_INSERTION_FAILED_DUPLICATE, PROFILE_INSERTION_CIRA_CONSTRAINT, API_UNEXPECTED_EXCEPTION, DEFAULT_SKIP, DEFAULT_TOP, PROFILE_INSERTION_GENERIC_CONSTRAINT } from '../utils/constants'
import Logger from '../Logger'
import { RPSError } from '../utils/RPSError'
import { ProfilesWifiConfigsDb } from './profileWifiConfigs'

export class ProfilesDb implements IProfilesDb {
  db: any
  ciraConfigs: CiraConfigDb
  wifiConfigs: ProfilesWifiConfigsDb
  log: Logger
  constructor (dbCreator: IDbCreator) {
    this.db = dbCreator.getDb()
    this.ciraConfigs = new CiraConfigDb(dbCreator)
    this.wifiConfigs = new ProfilesWifiConfigsDb(dbCreator)
    this.log = new Logger('ProfilesDb')
  }

  /**
   * @description Get count of all profiles from DB
   * @returns {number}
   */
  async getCount (tenantId: string = ''): Promise<number> {
    const result = await this.db.query(`
    SELECT count(*) OVER() AS total_count 
    FROM profiles
    WHERE tenant_id = $1`, [tenantId])
    let count = 0
    if (result != null) {
      count = Number(result?.rows[0]?.total_count)
    }
    return count
  }

  /**
   * @description Get all AMT Profiles from DB
   * @param {number} top
   * @param {number} skip
   * @returns {Pagination} returns an array of AMT profiles from DB
   */
  async get (top: number = DEFAULT_TOP, skip: number = DEFAULT_SKIP, tenantId: string = ''): Promise<AMTConfiguration[]> {
    const results = await this.db.query(`SELECT profile_name as ProfileName, activation as Activation, amt_password as AMTPassword, cira_config_name as ciraConfigName, mebx_password as MEBxPassword, tags, dhcp_enabled, tenant_id
    FROM profiles 
    WHERE tenant_id = $3
    ORDER BY profile_name 
    LIMIT $1 OFFSET $2`, [top, skip, tenantId])
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
  async getByName (profileName: string, tenantId: string = ''): Promise<AMTConfiguration> {
    const results = await this.db.query(`
    SELECT profile_name as ProfileName, activation as Activation, amt_password as AMTPassword, cira_config_name as ciraConfigName, mebx_password as MEBxPassword, tags, dhcp_enabled, tenant_id
    FROM profiles 
    WHERE profile_name = $1 and tenant_id = $2`, [profileName, tenantId])
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
    return await this.ciraConfigs.getByName(configName)
  }

  /**
   * @description Delete AMT Profile from DB by name
   * @param {string} profileName
   * @returns {boolean} Return true on successful deletion
   */
  async delete (profileName: string, tenantId: string = ''): Promise<boolean> {
    if (this.wifiConfigs.deleteProfileWifiConfigs(profileName)) {
      const results = await this.db.query(`
      DELETE 
      FROM profiles 
      WHERE profile_name = $1 and tenant_id = $2`, [profileName, tenantId])
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
  async insert (amtConfig: AMTConfiguration): Promise<AMTConfiguration> {
    try {
      const results = await this.db.query(`INSERT INTO profiles(profile_name, activation, amt_password, cira_config_name, mebx_password, tags, dhcp_enabled, tenant_id)
        values($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        amtConfig.profileName,
        amtConfig.activation,
        amtConfig.amtPassword,
        amtConfig.ciraConfigName,
        amtConfig.mebxPassword,
        amtConfig.tags,
        amtConfig.dhcpEnabled,
        amtConfig.tenantId
      ])
      if (results.rowCount > 0) {
        if (amtConfig.wifiConfigs?.length > 0) {
          await this.wifiConfigs.createProfileWifiConfigs(amtConfig.wifiConfigs, amtConfig.profileName, amtConfig.tenantId)
        }
        const profile = await this.getByName(amtConfig.profileName)
        return profile
      }
      return null
    } catch (error) {
      this.log.error(`Failed to insert AMT profile: ${amtConfig.profileName}`, error)
      console.log(error.code)
      if (error.code === '23505') { // Unique key violation
        throw new RPSError(PROFILE_INSERTION_FAILED_DUPLICATE(amtConfig.profileName), 'Unique key violation')
      }
      if (error.code === '23503') { // Unique key violation
        throw new RPSError(PROFILE_INSERTION_GENERIC_CONSTRAINT(amtConfig.ciraConfigName), `Foreign key constraint violation: ${error.message}`)
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(amtConfig.profileName))
    }
  }

  /**
   * @description Update AMT profile into DB
   * @param {AMTConfiguration} amtConfig
   * @returns {AMTConfiguration} Returns amtConfig object
   */
  async update (amtConfig: AMTConfiguration): Promise<AMTConfiguration> {
    try {
      const results = await this.db.query(`
      UPDATE profiles 
      SET activation=$2, amt_password=$3, cira_config_name=$4, mebx_password=$5, tags=$6, dhcp_enabled=$7 
      WHERE profile_name=$1 and tenant_id = $8`,
      [
        amtConfig.profileName,
        amtConfig.activation,
        amtConfig.amtPassword,
        amtConfig.ciraConfigName,
        amtConfig.mebxPassword,
        amtConfig.tags,
        amtConfig.dhcpEnabled,
        amtConfig.tenantId
      ])
      if (results.rowCount > 0) {
        if (amtConfig.wifiConfigs?.length > 0) {
          await this.wifiConfigs.createProfileWifiConfigs(amtConfig.wifiConfigs, amtConfig.profileName)
        }
        const profile = await this.getByName(amtConfig.profileName)
        return profile
      }
      return null
    } catch (error) {
      this.log.error(`Failed to update AMT profile: ${amtConfig.profileName}`, error)
      if (error.code === '23503') { // Foreign key constraint violation
        if (error.message.includes('profiles_cira_config_name_fkey')) {
          throw new RPSError(PROFILE_INSERTION_CIRA_CONSTRAINT(amtConfig.ciraConfigName), 'Foreign key constraint violation')
        }
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(amtConfig.profileName))
    }
  }
}
