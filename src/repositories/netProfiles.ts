/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDbCreator } from './interfaces/IDbCreator'
import { NetworkConfig } from '../RCS.Config'
import { INetProfilesDb } from './interfaces/INetProfilesDb'
import { NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT, NETWORK_CONFIG_ERROR, NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE, NETWORK_CONFIG_INSERTION_SUCCESS, NETWORK_CONFIG_NOT_FOUND, NETWORK_CONFIG_SUCCESSFULLY_DELETED, NETWORK_UPDATE_ERROR } from '../utils/constants'
import { mapToNetworkProfile } from './mapToNetworkProfile'

export class NetConfigDb implements INetProfilesDb {
  db: any
  constructor (dbCreator: IDbCreator) {
    this.db = dbCreator.getDb()
  }

  async getAllProfiles (): Promise<NetworkConfig[]> {
    const results = await this.db.query('SELECT network_profile_name, dhcp_enabled, static_ip_shared, ip_sync_enabled from networkconfigs')

    return results.rows.map(p => {
      const result = mapToNetworkProfile(p)
      return result
    })
  }

  async getProfileByName (configName): Promise<NetworkConfig> {
    const results = await this.db.query('SELECT network_profile_name, dhcp_enabled, static_ip_shared, ip_sync_enabled FROM networkconfigs WHERE network_profile_name = $1', [configName])
    return (results.rowCount > 0 ? mapToNetworkProfile(results.rows[0]) : null)
  }

  async deleteProfileByName (configName): Promise<any> {
    const profiles = await this.db.query('SELECT profile_name as ProfileName FROM profiles WHERE network_profile_name = $1', [configName])
    if (profiles.rowCount > 0) {
      throw NETWORK_UPDATE_ERROR(configName)
    }

    try {
      const results = await this.db.query('DELETE FROM networkconfigs WHERE network_profile_name = $1', [configName])
      return (results.rowCount > 0 ? NETWORK_CONFIG_SUCCESSFULLY_DELETED(configName) : NETWORK_CONFIG_NOT_FOUND(configName))
    } catch (error) {
      console.log(error)
      if (error.code === '23503') { // foreign key violation
        throw (NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT(configName))
      }

      throw (NETWORK_CONFIG_ERROR(configName))
    }
  }

  async insertProfile (netConfig: NetworkConfig): Promise<any> {
    try {
      const results = await this.db.query('INSERT INTO networkconfigs(network_profile_name, dhcp_enabled, static_ip_shared, ip_sync_enabled) ' +
        'values($1, $2, $3, $4)',
      [
        netConfig.ProfileName,
        netConfig.DHCPEnabled,
        netConfig.StaticIPShared,
        netConfig.IPSyncEnabled
      ])

      if (results.rowCount > 0) {
        return NETWORK_CONFIG_INSERTION_SUCCESS(netConfig.ProfileName)
      }

      return null
    } catch (error) {
      console.log(error)
      if (error.code === '23505') { // Unique key violation
        throw (NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE(netConfig.ProfileName))
      }

      throw (NETWORK_CONFIG_ERROR(netConfig.ProfileName))
    }
  }

  async updateProfile (netConfig: NetworkConfig): Promise<any> {
    // try {
    const profiles = await this.db.query('SELECT profile_name as ProfileName FROM profiles WHERE network_profile_name = $1', [netConfig.ProfileName])
    if (profiles.rowCount > 0) {
      throw NETWORK_UPDATE_ERROR(netConfig.ProfileName)
    }
    const results = await this.db.query('UPDATE networkconfigs SET dhcp_enabled=$2, static_ip_shared=$3, ip_sync_enabled=$4 where network_profile_name=$1',
      [
        netConfig.ProfileName,
        netConfig.DHCPEnabled,
        netConfig.StaticIPShared,
        netConfig.IPSyncEnabled
      ])

    return results.rowCount

    // } catch (error) {
    //     console.log(error)

    //     throw (NETWORK_CONFIG_ERROR(netConfig.ProfileName))
    // }
  }
}
