/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { IDbCreator } from '../interfaces/database/IDbCreator'
import { IProfileWifiConfigsDb } from '../interfaces/database/IProfileWifiConfigsDb'
import { ProfileWifiConfigs } from '../RCS.Config'
import { mapToProfileWifiConfigs } from './mapToProfileWifiConfigs'
import { API_UNEXPECTED_EXCEPTION } from '../utils/constants'
import Logger from '../Logger'
import { RPSError } from '../utils/RPSError'
import * as format from 'pg-format'

export class ProfilesWifiConfigsDb implements IProfileWifiConfigsDb {
  db: any
  log: Logger
  constructor (dbCreator: IDbCreator) {
    this.db = dbCreator.getDb()
    this.log = new Logger('ProfilesDb')
  }

  /**
   * @description Get AMT Profile associated wifi configs
   * @param {string} profileName
   * @returns {ProfileWifiConfigs[]} Return an array of wifi configs
   */
  async getProfileWifiConfigs (profileName: string, tenantId: string = ''): Promise<ProfileWifiConfigs[]> {
    const results = await this.db.query(`
    SELECT priority, wireless_profile_name 
    FROM profiles_wirelessconfigs 
    WHERE profile_name = $1 and tenant_id = $2
    ORDER BY priority`, [profileName, tenantId])
    return results.rows.map(profile => mapToProfileWifiConfigs(profile))
  }

  /**
   * @description Insert wifi configs associated with AMT profile
   * @param {ProfileWifiConfigs[]} wifiConfigs
   * @param {string} profileName
   * @returns {ProfileWifiConfigs[]} Return an array of wifi configs
   */
  async createProfileWifiConfigs (wifiConfigs: ProfileWifiConfigs[], profileName: string, tenantId: string = ''): Promise<boolean> {
    try {
      // Preparing data for inserting multiple rows
      const configs = wifiConfigs.map(config => [config.profileName, profileName, config.priority, tenantId])
      const wifiProfilesQueryResults = await this.db.query(format(`
      INSERT INTO 
      profiles_wirelessconfigs (wireless_profile_name, profile_name, priority, tenant_id) 
      VALUES %L`, configs))
      if (wifiProfilesQueryResults.rowCount > 0) {
        return true
      }
      return false
    } catch (error) {
      if (error.code === '23503') {
        throw new RPSError(error.detail, 'Foreign key constraint violation')
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(profileName))
    }
  }

  /**
  * @description Delete wifi configs of an AMT Profile from DB by profile name
  * @param {string} profileName
  * @returns {boolean} Return true on successful deletion
  */
  async deleteProfileWifiConfigs (profileName: string, tenantId: string = ''): Promise<boolean> {
    const deleteProfileWifiResults = await this.db.query(`
    DELETE 
    FROM profiles_wirelessconfigs 
    WHERE profile_name = $1 and tenant_id = $2`, [profileName, tenantId])
    if (deleteProfileWifiResults.rowCount >= 0) {
      return true
    }
    return false
  }
}
