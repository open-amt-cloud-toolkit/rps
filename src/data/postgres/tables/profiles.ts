/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { IProfilesTable } from '../../../interfaces/database/IProfilesDb'
import { CIRAConfig } from '../../../RCS.Config'
import { AMTConfiguration } from '../../../models/Rcs'
import { PROFILE_INSERTION_FAILED_DUPLICATE, PROFILE_INSERTION_CIRA_CONSTRAINT, API_UNEXPECTED_EXCEPTION, DEFAULT_SKIP, DEFAULT_TOP, PROFILE_INSERTION_GENERIC_CONSTRAINT } from '../../../utils/constants'
import Logger from '../../../Logger'
import { RPSError } from '../../../utils/RPSError'
import PostgresDb from '..'

export class ProfilesTable implements IProfilesTable {
  db: PostgresDb
  log: Logger
  constructor (db: PostgresDb) {
    this.db = db
    this.log = new Logger('ProfilesDb')
  }

  /**
   * @description Get count of all profiles from DB
   * @returns {number}
   */
  async getCount (tenantId: string = ''): Promise<number> {
    const result = await this.db.query<{total_count: number}>(`
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
    const results = await this.db.query<AMTConfiguration>(`
    SELECT 
      p.profile_name as "profileName", 
      activation as "activation", 
      cira_config_name as "ciraConfigName", 
      tags as "tags", 
      dhcp_enabled as "dhcpEnabled", 
      p.tenant_id as "tenantId",
      json_agg(json_build_object('profileName',wc.wireless_profile_name, 'priority', wc.priority)) as "wifiConfigs"
    FROM profiles p
    LEFT JOIN profiles_wirelessconfigs wc ON wc.profile_name = p.profile_name AND wc.tenant_id = p.tenant_id
    WHERE p.tenant_id = $3
    GROUP BY p.profile_name
    ,activation
    ,cira_config_name
    ,tags
    ,dhcp_enabled
    ,p.tenant_id
    ORDER BY p.profile_name 
    LIMIT $1 OFFSET $2`, [top, skip, tenantId])

    return results.rows
  }

  /**
   * @description Get AMT Profile from DB by name
   * @param {string} profileName
   * @returns {AMTConfiguration} AMT Profile object
   */
  async getByName (profileName: string, tenantId: string = ''): Promise<AMTConfiguration> {
    const results = await this.db.query<AMTConfiguration>(`
    SELECT 
      p.profile_name as "profileName", 
      activation as "activation", 
      cira_config_name as "ciraConfigName", 
      tags as "tags", 
      dhcp_enabled as "dhcpEnabled", 
      p.tenant_id as "tenantId",
      json_agg(json_build_object('profileName',wc.wireless_profile_name, 'priority', wc.priority)) as "wifiConfigs"
    FROM profiles p
    LEFT JOIN profiles_wirelessconfigs wc ON wc.profile_name = p.profile_name AND wc.tenant_id = p.tenant_id
    WHERE p.profile_name = $1 and p.tenant_id = $2
    GROUP BY 
      p.profile_name,
      activation,
      cira_config_name,
      tags,
      dhcp_enabled,
      p.tenant_id
    `, [profileName, tenantId])

    return results.rowCount > 0 ? results.rows[0] : null
  }

  /**
   * @description Get CIRA config from DB by name
   * @param {string} configName
   * @returns {CIRAConfig} CIRA config object
   */
  async getCiraConfigForProfile (configName: string): Promise<CIRAConfig> {
    return await this.db.ciraConfigs.getByName(configName)
  }

  /**
   * @description Delete AMT Profile from DB by name
   * @param {string} profileName
   * @returns {boolean} Return true on successful deletion
   */
  async delete (profileName: string, tenantId: string = ''): Promise<boolean> {
    if (this.db.profileWirelessConfigs.deleteProfileWifiConfigs(profileName)) {
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

      if (results.rowCount === 0) {
        return null
      }

      if (amtConfig.wifiConfigs?.length > 0) {
        await this.db.profileWirelessConfigs.createProfileWifiConfigs(amtConfig.wifiConfigs, amtConfig.profileName, amtConfig.tenantId)
      }

      return await this.getByName(amtConfig.profileName)
    } catch (error) {
      this.log.error(`Failed to insert AMT profile: ${amtConfig.profileName}`, error)
      if (error instanceof RPSError) {
        throw error
      }
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
          await this.db.profileWirelessConfigs.createProfileWifiConfigs(amtConfig.wifiConfigs, amtConfig.profileName)
        }
        return await this.getByName(amtConfig.profileName)
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
