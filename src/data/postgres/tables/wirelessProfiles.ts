/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type WirelessConfig } from '../../../models/RCS.Config.js'
import { type IWirelessProfilesTable } from '../../../interfaces/database/IWirelessProfilesDB.js'
import {
  API_UNEXPECTED_EXCEPTION,
  CONCURRENCY_EXCEPTION,
  CONCURRENCY_MESSAGE,
  DEFAULT_SKIP,
  DEFAULT_TOP,
  NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT,
  NETWORK_CONFIG_ERROR,
  NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE
} from '../../../utils/constants.js'
import { RPSError } from '../../../utils/RPSError.js'
import Logger from '../../../Logger.js'
import type PostgresDb from '../index.js'
import { PostgresErr } from '../errors.js'

export class WirelessProfilesTable implements IWirelessProfilesTable {
  db: PostgresDb
  log: Logger
  constructor (db: PostgresDb) {
    this.db = db
    this.log = new Logger('WirelessConfigDb')
  }

  /**
   * @description Get count of all wifiConfigs from DB
   * @returns {number}
   */
  async getCount (tenantId: string = ''): Promise<number> {
    const result = await this.db.query<{ total_count: number }>(`
    SELECT count(*) OVER() AS total_count 
    FROM wirelessconfigs 
    WHERE tenant_id = $1`, [tenantId])
    let count = 0
    if (result != null && result.rows?.length > 0) {
      count = Number(result.rows[0].total_count)
    }
    return count
  }

  /**
    * @description Get all wireless profiles from DB
    * @param {number} top
    * @param {number} skip
    * @returns {WirelessConfig []} returns an array of WirelessConfig objects
  */
  async get (top: number = DEFAULT_TOP, skip: number = DEFAULT_SKIP, tenantId: string = ''): Promise<WirelessConfig[]> {
    const results = await this.db.query<WirelessConfig>(`
    SELECT 
      wireless_profile_name as "profileName", 
      authentication_method as "authenticationMethod", 
      encryption_method as "encryptionMethod", 
      ssid as "ssid", 
      psk_value as "pskValue", 
      psk_passphrase as "pskPassphrase", 
      link_policy as "linkPolicy", 
      count(*) OVER() AS "total_count", 
      tenant_id as "tenantId",
      ieee8021x_profile_name as "ieee8021xProfileName",
      xmin as "version"
    FROM wirelessconfigs 
    WHERE tenant_id = $3
    ORDER BY wireless_profile_name 
    LIMIT $1 OFFSET $2`, [top, skip, tenantId])
    return results.rows
  }

  /**
    * @description Get wireless profile from DB by name
    * @param {string} profileName
    * @returns {WirelessConfig } WirelessConfig object
    */
  async getByName (configName: string, tenantId: string = ''): Promise<WirelessConfig> {
    const results = await this.db.query<WirelessConfig>(`
    SELECT 
      wireless_profile_name as "profileName", 
      authentication_method as "authenticationMethod", 
      encryption_method as "encryptionMethod", 
      ssid as "ssid", 
      psk_value as "pskValue",
      psk_passphrase as "pskPassphrase", 
      link_policy as "linkPolicy", 
      tenant_id as "tenantId",
      ieee8021x_profile_name as "ieee8021xProfileName",
      xmin as "version"
    FROM wirelessconfigs 
    WHERE wireless_profile_name = $1 and tenant_id = $2`, [configName, tenantId])

    return results.rowCount > 0 ? results.rows[0] : null
  }

  /**
    * @description Get wireless profile exists in DB by wifinames
    * @param {string} profileNames
    * @returns {string[]}
    */
  async checkProfileExits (configName: string, tenantId: string = ''): Promise<boolean> {
    const results = await this.db.query(`
    SELECT 1
    FROM wirelessconfigs 
    WHERE wireless_profile_name = $1 and tenant_id = $2`, [configName, tenantId])

    return results.rowCount > 0
  }

  /**
    * @description Delete Wireless profile from DB by name
    * @param {string} configName
    * @returns {boolean} Return true on successful deletion
    */
  async delete (configName: string, tenantId = ''): Promise<boolean> {
    const profiles = await this.db.query(`
    SELECT 1
    FROM profiles_wirelessconfigs
    WHERE wireless_profile_name = $1 and tenant_id = $2`, [configName, tenantId])
    if (profiles.rowCount > 0) {
      throw new RPSError(NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT('Wireless', configName), 'Foreign key violation')
    }
    try {
      const results = await this.db.query(`
      DELETE
      FROM wirelessconfigs
      WHERE wireless_profile_name = $1 and tenant_id = $2`, [configName, tenantId])
      return results.rowCount > 0
    } catch (error) {
      this.log.error(`Failed to delete wireless configuration : ${configName}`, error)
      if (error.code === PostgresErr.C23_FOREIGN_KEY_VIOLATION) {
        throw new RPSError(NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT('Wireless', configName))
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(`Delete wireless configuration : ${configName}`))
    }
  }

  /**
    * @description Insert wireless profile into DB
    * @param {WirelessConfig } wirelessConfig
    * @returns {WirelessConfig } Returns WirelessConfig object
    */
  async insert (wirelessConfig: WirelessConfig): Promise<WirelessConfig> {
    try {
      const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
      const results = await this.db.query(`
        INSERT INTO wirelessconfigs
        (wireless_profile_name, authentication_method, encryption_method, ssid, psk_value, psk_passphrase, link_policy, creation_date, tenant_id, ieee8021x_profile_name)
        values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        wirelessConfig.profileName,
        wirelessConfig.authenticationMethod,
        wirelessConfig.encryptionMethod,
        wirelessConfig.ssid,
        wirelessConfig.pskValue,
        wirelessConfig.pskPassphrase,
        wirelessConfig.linkPolicy,
        date,
        wirelessConfig.tenantId,
        wirelessConfig.ieee8021xProfileName
      ])
      if (results?.rowCount > 0) {
        const config = await this.getByName(wirelessConfig.profileName, wirelessConfig.tenantId)
        return config
      }
      return null
    } catch (error) {
      if (error.code === PostgresErr.C23_UNIQUE_VIOLATION) {
        throw new RPSError(NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE('Wireless', wirelessConfig.profileName), 'Unique key violation')
      }
      throw new RPSError(NETWORK_CONFIG_ERROR('Wireless', wirelessConfig.profileName)
      )
    }
  }

  /**
    * @description Update Wireless profile into DB
    * @param {WirelessConfig } wirelessConfig
    * @returns {boolean} Returns wirelessConfig object
    */
  async update (wirelessConfig: WirelessConfig): Promise<WirelessConfig> {
    let latestItem: WirelessConfig

    try {
      const results = await this.db.query(`
      UPDATE wirelessconfigs 
      SET authentication_method=$2, encryption_method=$3, ssid=$4, psk_value=$5, psk_passphrase=$6, link_policy=$7, ieee8021x_profile_name=$9 
      WHERE wireless_profile_name=$1 and tenant_id = $8 and xmin = $10`,
      [
        wirelessConfig.profileName,
        wirelessConfig.authenticationMethod,
        wirelessConfig.encryptionMethod,
        wirelessConfig.ssid,
        wirelessConfig.pskValue,
        wirelessConfig.pskPassphrase,
        wirelessConfig.linkPolicy,
        wirelessConfig.tenantId,
        wirelessConfig.ieee8021xProfileName,
        wirelessConfig.version
      ])
      latestItem = await this.getByName(wirelessConfig.profileName, wirelessConfig.tenantId)
      if (results?.rowCount > 0) {
        return latestItem
      }
    } catch (error) {
      throw new RPSError(NETWORK_CONFIG_ERROR('Wireless', wirelessConfig.profileName)
      )
    }
    // making assumption that if no records are updated, that it is due to concurrency. We've already checked for if it doesn't exist before calling update.
    throw new RPSError(CONCURRENCY_MESSAGE, CONCURRENCY_EXCEPTION, latestItem)
  }
}
