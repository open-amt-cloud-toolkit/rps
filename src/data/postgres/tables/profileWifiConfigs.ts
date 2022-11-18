/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { IProfilesWifiConfigsTable } from '../../../interfaces/database/IProfileWifiConfigsDb'
import { ProfileWifiConfigs } from '../../../models/RCS.Config'
import { API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'
import * as format from 'pg-format'
import PostgresDb from '..'

export class ProfilesWifiConfigsTable implements IProfilesWifiConfigsTable {
  db: PostgresDb
  constructor (db: PostgresDb) {
    this.db = db
  }

  /**
   * @description Get AMT Profile associated wifi configs
   * @param {string} profileName
   * @returns {ProfileWifiConfigs[]} Return an array of wifi configs
   */
  async getProfileWifiConfigs (profileName: string, tenantId: string = ''): Promise<ProfileWifiConfigs[]> {
    const results = await this.db.query<ProfileWifiConfigs>(`
    SELECT 
      priority as "priority",
      wireless_profile_name as "profileName"
    FROM profiles_wirelessconfigs
    WHERE profile_name = $1 and tenant_id = $2
    ORDER BY priority`, [profileName, tenantId])
    return results.rows
  }

  /**
   * @description Insert wifi configs associated with AMT profile
   * @param {ProfileWifiConfigs[]} wifiConfigs
   * @param {string} profileName
   * @returns {ProfileWifiConfigs[]} Return an array of wifi configs
   */
  async createProfileWifiConfigs (wifiConfigs: ProfileWifiConfigs[], profileName: string, tenantId: string = ''): Promise<boolean> {
    try {
      if (wifiConfigs.length < 1) {
        throw new RPSError('No wificonfigs provided to insert')
      }
      // Preparing data for inserting multiple rows
      const configs = wifiConfigs.map(config => [config.profileName, profileName, config.priority, tenantId])
      const wifiProfilesQueryResults = await this.db.query(format(`
      INSERT INTO
      profiles_wirelessconfigs (wireless_profile_name, profile_name, priority, tenant_id)
      VALUES %L`, configs))

      return wifiProfilesQueryResults.rowCount > 0
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

    return deleteProfileWifiResults.rowCount > 0
  }
}
