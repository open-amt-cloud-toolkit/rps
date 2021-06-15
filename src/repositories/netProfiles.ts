/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDbCreator } from './interfaces/IDbCreator'
import { NetworkConfig } from '../RCS.Config'
import { INetProfilesDb } from './interfaces/INetProfilesDb'
import { API_UNEXPECTED_EXCEPTION, NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT, NETWORK_CONFIG_ERROR, NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE, NETWORK_UPDATE_ERROR } from '../utils/constants'
import { mapToNetworkProfile } from './mapToNetworkProfile'
import { RPSError } from '../utils/RPSError'
import Logger from '../Logger'

export class NetConfigDb implements INetProfilesDb {
  db: any
  log = Logger

  constructor (dbCreator: IDbCreator) {
    this.db = dbCreator.getDb()
  }

  /**
   * @description Get all Network configurations from DB
   * @returns {NetworkConfig[]} returns an array of NetworkConfig objects
   */
  async getAllProfiles (): Promise<NetworkConfig[]> {
    const results = await this.db.query('SELECT network_profile_name, dhcp_enabled, static_ip_shared, ip_sync_enabled from networkconfigs')
    return await Promise.all(results.rows.map(async p => {
      const result = mapToNetworkProfile(p)
      return result
    }))
  }

  /**
   * @description Get Network Config from DB by name
   * @param {string} configName
   * @returns {NetworkConfig} NetworkConfig object
   */
  async getProfileByName (configName: string): Promise<NetworkConfig> {
    const results = await this.db.query('SELECT network_profile_name, dhcp_enabled, static_ip_shared, ip_sync_enabled FROM networkconfigs WHERE network_profile_name = $1', [configName])
    let networkConfig: NetworkConfig = null
    if (results.rowCount > 0) {
      networkConfig = mapToNetworkProfile(results.rows[0])
    }
    return networkConfig
  }

  /**
   * @description Delete Network Config from DB by name
   * @param {string} configName
   * @returns {boolean} Return true on successful deletion
   */
  async deleteProfileByName (configName: string): Promise<boolean> {
    const profiles = await this.db.query('SELECT profile_name as ProfileName FROM profiles WHERE network_profile_name = $1', [configName])
    if (profiles.rowCount > 0) {
      throw NETWORK_UPDATE_ERROR(configName)
    }
    try {
      const results = await this.db.query('DELETE FROM networkconfigs WHERE network_profile_name = $1', [configName])
      if (results.rowCount > 0) {
        return true
      } else {
        return false
      }
    } catch (error) {
      this.log.error(`Failed to delete network configuration : ${configName}`, error)
      if (error.code === '23503') { // foreign key violation
        throw new RPSError(NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT(configName))
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(`Delete network configuration : ${configName}`))
    }
  }

  /**
   * @description Insert Network Config into DB
   * @param {NetworkConfig} netConfig
   * @returns {NetworkConfig} Returns netConfig object
   */
  async insertProfile (netConfig: NetworkConfig): Promise<NetworkConfig> {
    try {
      const results = await this.db.query('INSERT INTO networkconfigs(network_profile_name, dhcp_enabled, static_ip_shared, ip_sync_enabled) ' +
        'values($1, $2, $3, $4)',
      [
        netConfig.profileName,
        netConfig.dhcpEnabled,
        netConfig.staticIPShared,
        netConfig.ipSyncEnabled
      ])
      if (results.rowCount > 0) {
        const profile = await this.getProfileByName(netConfig.profileName)
        return profile
      }
      return null
    } catch (error) {
      if (error.code === '23505') { // Unique key violation
        throw new RPSError(NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE(netConfig.profileName), 'Unique key violation')
      }
      throw new RPSError(NETWORK_CONFIG_ERROR(netConfig.profileName)
      )
    }
  }

  /**
   * @description Update Network Config into DB
   * @param {NetworkConfig} netConfig
   * @returns {boolean} Returns netConfig object
   */
  async updateProfile (netConfig: NetworkConfig): Promise<NetworkConfig> {
    const profiles = await this.db.query('SELECT profile_name as ProfileName FROM profiles WHERE network_profile_name = $1', [netConfig.profileName])
    if (profiles.rowCount > 0) {
      throw new RPSError(NETWORK_UPDATE_ERROR(netConfig.profileName))
    }
    const results = await this.db.query('UPDATE networkconfigs SET dhcp_enabled=$2, static_ip_shared=$3, ip_sync_enabled=$4 where network_profile_name=$1',
      [
        netConfig.profileName,
        netConfig.dhcpEnabled,
        netConfig.staticIPShared,
        netConfig.ipSyncEnabled
      ])
    if (results.rowCount > 0) {
      const profile = await this.getProfileByName(netConfig.profileName)
      return profile
    }
    return null
  }
}
