/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { IDbCreator } from './interfaces/IDbCreator'
import { WirelessConfig } from '../RCS.Config'
import { IWirelessProfilesDb } from './interfaces/IWirelessProfilesDB'
import { API_UNEXPECTED_EXCEPTION, NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT, NETWORK_CONFIG_ERROR, NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE, NETWORK_UPDATE_ERROR } from '../utils/constants'
import { mapToWirelessProfile } from './maptoWirelessProfile'
import { RPSError } from '../utils/RPSError'
import Logger from '../Logger'

export class WirelessConfigDb implements IWirelessProfilesDb {
  db: any
  log: Logger
  constructor (dbCreator: IDbCreator) {
    this.db = dbCreator.getDb()
    this.log = new Logger('WirelessConfigDb')
  }

  /**
    * @description Get all wireless profiles from DB
    * @returns {WirelessConfig []} returns an array of WirelessConfig objects
    */
  async getAllProfiles (): Promise<WirelessConfig[]> {
    const results = await this.db.query('SELECT wireless_profile_name, authentication_method, encryption_method, ssid, psk_value, psk_passphrase, link_policy from wirelessconfigs')
    return results.rows.map(profile => mapToWirelessProfile(profile))
  }

  /**
    * @description Get wireless profile from DB by name
    * @param {string} profileName
    * @returns {WirelessConfig } WirelessConfig object
    */
  async getProfileByName (configName: string): Promise<WirelessConfig> {
    const results = await this.db.query('SELECT wireless_profile_name, authentication_method, encryption_method, ssid, psk_value, psk_passphrase, link_policy from wirelessconfigs WHERE wireless_profile_name = $1', [configName])
    let wirelessConfig: WirelessConfig = null
    if (results.rowCount > 0) {
      wirelessConfig = mapToWirelessProfile(results.rows[0])
    }
    return wirelessConfig
  }

  /**
    * @description Get wireless profile exists in DB by wifinames
    * @param {string} profileNames
    * @returns {string[]}
    */
  async checkProfileExits (configName: string): Promise<boolean> {
    const results = await this.db.query('SELECT * from wirelessconfigs WHERE wireless_profile_name = $1', [configName])
    if (results.rowCount > 0) {
      return true
    }
    return false
  }

  /**
    * @description Delete Wireless profile from DB by name
    * @param {string} configName
    * @returns {boolean} Return true on successful deletion
    */
  async deleteProfileByName (configName: string): Promise<boolean> {
    const profiles = await this.db.query('SELECT wireless_profile_name as ProfileName FROM profiles_wirelessconfigs WHERE wireless_profile_name = $1', [configName])
    if (profiles.rowCount > 0) {
      throw new RPSError(NETWORK_UPDATE_ERROR('Wireless', configName))
    }
    try {
      const results = await this.db.query('DELETE FROM wirelessconfigs WHERE wireless_profile_name = $1', [configName])
      if (results.rowCount > 0) {
        return true
      } else {
        return false
      }
    } catch (error) {
      this.log.error(`Failed to delete wireless configuration : ${configName}`, error)
      if (error.code === '23503') { // foreign key violation
        throw new RPSError(NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT('Wireless', configName))
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(`Delete network configuration : ${configName}`))
    }
  }

  /**
    * @description Insert wireless profile into DB
    * @param {WirelessConfig } wirelessConfig
    * @returns {WirelessConfig } Returns WirelessConfig object
    */
  async insertProfile (wirelessConfig: WirelessConfig): Promise<WirelessConfig> {
    try {
      const date = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
      const results = await this.db.query('INSERT INTO wirelessconfigs(wireless_profile_name, authentication_method, encryption_method, ssid, psk_value, psk_passphrase, link_policy, creation_date) ' +
         'values($1, $2, $3, $4, $5, $6, $7, $8)',
      [
        wirelessConfig.profileName,
        wirelessConfig.authenticationMethod,
        wirelessConfig.encryptionMethod,
        wirelessConfig.ssid,
        wirelessConfig.pskValue,
        wirelessConfig.pskPassphrase,
        wirelessConfig.linkPolicy,
        date
      ])
      if (results?.rowCount > 0) {
        const profile = await this.getProfileByName(wirelessConfig.profileName)
        return profile
      }
      return null
    } catch (error) {
      if (error.code === '23505') { // Unique key violation
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
  async updateProfile (wirelessConfig: WirelessConfig): Promise<WirelessConfig> {
    try {
      const profiles = await this.db.query('SELECT profile_name as ProfileName FROM profiles WHERE network_profile_name = $1', [wirelessConfig.profileName])
      if (profiles.rowCount > 0) {
        throw new RPSError(NETWORK_UPDATE_ERROR('Wireless', wirelessConfig.profileName))
      }
      const results = await this.db.query('UPDATE wirelessconfigs SET authentication_method=$2, encryption_method=$3, ssid=$4, psk_value=$5, psk_passphrase=$6, link_policy=$7 where wireless_profile_name=$1',
        [
          wirelessConfig.profileName,
          wirelessConfig.authenticationMethod,
          wirelessConfig.encryptionMethod,
          wirelessConfig.ssid,
          wirelessConfig.pskValue,
          wirelessConfig.pskPassphrase,
          wirelessConfig.linkPolicy
        ])
      if (results?.rowCount > 0) {
        const profile = await this.getProfileByName(wirelessConfig.profileName)
        return profile
      }
      return null
    } catch (error) {
      throw new RPSError(NETWORK_CONFIG_ERROR('Wireless', wirelessConfig.profileName)
      )
    }
  }
}
