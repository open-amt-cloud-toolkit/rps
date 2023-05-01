/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import PostgresDb from '..'
import { API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'
import { type ProfileWifiConfigs } from '../../../models/RCS.Config'
import { ProfilesWifiConfigsTable } from './profileWifiConfigs'

describe('profilewificonfig tests', () => {
  let db: PostgresDb
  let profilesWifiConfigsTable: ProfilesWifiConfigsTable
  let querySpy: jest.SpyInstance
  const wifiConfigs: ProfileWifiConfigs[] = [{ profileName: 'wirelessConfig', priority: 1 } as any]
  const profileName = 'profileName'
  const tenantId = 'tenantId'

  beforeEach(() => {
    db = new PostgresDb('')
    profilesWifiConfigsTable = new ProfilesWifiConfigsTable(db)
    querySpy = jest.spyOn(profilesWifiConfigsTable.db, 'query')
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('Get', () => {
    test('should Get', async () => {
      querySpy.mockResolvedValueOnce({ rows: [{}], rowCount: 1 })
      const result = await profilesWifiConfigsTable.getProfileWifiConfigs(profileName)
      expect(result).toStrictEqual([{}])
      expect(querySpy).toBeCalledTimes(1)
      expect(querySpy).toBeCalledWith(`
    SELECT 
      priority as "priority",
      wireless_profile_name as "profileName"
    FROM profiles_wirelessconfigs
    WHERE profile_name = $1 and tenant_id = $2
    ORDER BY priority`, [profileName, ''])
    })
  })
  describe('Delete', () => {
    test('should Delete', async () => {
      querySpy.mockResolvedValueOnce({ rows: [{ }], rowCount: 1 })
      const result = await profilesWifiConfigsTable.deleteProfileWifiConfigs(profileName)
      expect(result).toBe(true)
      expect(querySpy).toBeCalledTimes(1)
      expect(querySpy).toBeCalledWith(`
    DELETE
    FROM profiles_wirelessconfigs
    WHERE profile_name = $1 and tenant_id = $2`, [profileName, ''])
    })
    test('should Delete with tenandId', async () => {
      querySpy.mockResolvedValueOnce({ rows: [{ }], rowCount: 1 })
      const result = await profilesWifiConfigsTable.deleteProfileWifiConfigs(profileName, tenantId)
      expect(result).toBe(true)
      expect(querySpy).toBeCalledTimes(1)
      expect(querySpy).toBeCalledWith(`
    DELETE
    FROM profiles_wirelessconfigs
    WHERE profile_name = $1 and tenant_id = $2`, [profileName, tenantId])
    })
  })
  describe('Insert', () => {
    test('should Insert', async () => {
      querySpy.mockResolvedValueOnce({ rows: [{ }], rowCount: 1 })
      const result = await profilesWifiConfigsTable.createProfileWifiConfigs(wifiConfigs, profileName)
      expect(result).toBe(true)
      expect(querySpy).toBeCalledTimes(1)
      expect(querySpy).toBeCalledWith(`
      INSERT INTO
      profiles_wirelessconfigs (wireless_profile_name, profile_name, priority, tenant_id)
      VALUES ('wirelessConfig', 'profileName', '1', '')`)
    })
    test('should NOT insert when no wificonfigs', async () => {
      await expect(profilesWifiConfigsTable.createProfileWifiConfigs([], profileName)).rejects.toThrow('Operation failed: profileName')
    })
    test('should NOT insert when constraint violation', async () => {
      querySpy.mockRejectedValueOnce({ code: '23503', detail: 'error' })
      await expect(profilesWifiConfigsTable.createProfileWifiConfigs(wifiConfigs, profileName)).rejects.toThrow('error')
    })
    test('should NOT insert when unknown error', async () => {
      querySpy.mockRejectedValueOnce('unknown')
      await expect(profilesWifiConfigsTable.createProfileWifiConfigs(wifiConfigs, profileName)).rejects.toThrow(API_UNEXPECTED_EXCEPTION(profileName))
    })
  })
})
