/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import PostgresDb from '..'
import { type WirelessConfig } from '../../../models/RCS.Config'
import { API_UNEXPECTED_EXCEPTION, CONCURRENCY_MESSAGE, DEFAULT_SKIP, DEFAULT_TOP, NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT, NETWORK_CONFIG_ERROR, NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE } from '../../../utils/constants'
import { WirelessProfilesTable } from './wirelessProfiles'

describe('wireless profiles tests', () => {
  let db: PostgresDb
  let wirelessProfilesTable: WirelessProfilesTable
  let querySpy: jest.SpyInstance
  let wirelessConfig: WirelessConfig
  const profileName = 'profileName'
  beforeEach(() => {
    wirelessConfig = {
      profileName: 'profileName',
      authenticationMethod: 0,
      encryptionMethod: 1,
      ssid: 'ssid',
      pskValue: 0,
      pskPassphrase: 'pskPassphrase',
      linkPolicy: ['linkPolicy'],
      tenantId: ''
    }
    db = new PostgresDb('')
    wirelessProfilesTable = new WirelessProfilesTable(db)
    querySpy = jest.spyOn(wirelessProfilesTable.db, 'query')
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('Get', () => {
    test('should get count', async () => {
      querySpy.mockResolvedValueOnce({ rows: [{ total_count: 1 }], rowCount: 0 })
      const count = await wirelessProfilesTable.getCount()
      expect(count).toBe(1)
      expect(querySpy).toBeCalledTimes(1)
      expect(querySpy).toBeCalledWith(`
    SELECT count(*) OVER() AS total_count 
    FROM wirelessconfigs 
    WHERE tenant_id = $1`, [''])
    })
    test('should Get', async () => {
      querySpy.mockResolvedValueOnce({ rows: [{}], rowCount: 1 })
      const result = await wirelessProfilesTable.get()
      expect(result).toStrictEqual([{}])
      expect(querySpy).toBeCalledTimes(1)
      expect(querySpy).toBeCalledWith(`
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
      xmin as "version"
    FROM wirelessconfigs 
    WHERE tenant_id = $3
    ORDER BY wireless_profile_name 
    LIMIT $1 OFFSET $2`, [DEFAULT_TOP, DEFAULT_SKIP, ''])
    })
    test('should get by name', async () => {
      const rows = [{}]
      querySpy.mockResolvedValueOnce({ rows: [{}], rowCount: rows.length })
      const result = await wirelessProfilesTable.getByName(profileName)
      expect(result).toStrictEqual(rows[0])
      expect(querySpy).toBeCalledTimes(1)
      expect(querySpy).toBeCalledWith(`
    SELECT 
      wireless_profile_name as "profileName", 
      authentication_method as "authenticationMethod", 
      encryption_method as "encryptionMethod", 
      ssid as "ssid", 
      psk_value as "pskValue",
      psk_passphrase as "pskPassphrase", 
      link_policy as "linkPolicy", 
      tenant_id as "tenantId",
      xmin as "version"
    FROM wirelessconfigs 
    WHERE wireless_profile_name = $1 and tenant_id = $2`, [profileName, ''])
    })
    test('should NOT get by name when no profiles exists', async () => {
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      const result = await wirelessProfilesTable.getByName(profileName)
      expect(result).toBeNull()
    })
    test('should check profile exist', async () => {
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      const result = await wirelessProfilesTable.checkProfileExits(profileName)
      expect(querySpy).toBeCalledTimes(1)
      expect(querySpy).toBeCalledWith(`
    SELECT 1
    FROM wirelessconfigs 
    WHERE wireless_profile_name = $1 and tenant_id = $2`, [profileName, ''])
      expect(result).toBe(false)
    })
  })
  describe('Delete', () => {
    test('should delete', async () => {
      let count = 0
      querySpy.mockImplementation(() => ({ rows: [], rowCount: count++ }))
      const result = await wirelessProfilesTable.delete(profileName)
      expect(result).toBeTruthy()
      expect(querySpy).toBeCalledTimes(2)
      expect(querySpy).toHaveBeenNthCalledWith(1, `
    SELECT 1
    FROM profiles_wirelessconfigs
    WHERE wireless_profile_name = $1 and tenant_id = $2`, [profileName, ''])
      expect(querySpy).toHaveBeenNthCalledWith(2, `
      DELETE
      FROM wirelessconfigs
      WHERE wireless_profile_name = $1 and tenant_id = $2`, [profileName, '']
      )
    })
    test('should NOT delete when relationship still exists to profile', async () => {
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 1 })
      await expect(wirelessProfilesTable.delete(profileName)).rejects.toThrow('Operation failed for Wireless profile: profileName. Cannot modify Wireless settings if its already associated with a profile.')
      expect(querySpy).toBeCalledTimes(1)
      expect(querySpy).toBeCalledWith(`
    SELECT 1
    FROM profiles_wirelessconfigs
    WHERE wireless_profile_name = $1 and tenant_id = $2`, [profileName, ''])
    })
    test('should NOT delete when constraint violation', async () => {
      let count = 0
      querySpy.mockImplementation(() => {
        if (count === 0) {
          return { rows: [], rowCount: count++ }
        }
        const err = new Error('foreign key violation');
        (err as any).code = '23503'
        throw err
      })
      await expect(wirelessProfilesTable.delete(profileName)).rejects.toThrow(NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT('Wireless', profileName))
    })
    test('should NOT delete when unknown error', async () => {
      let count = 0
      querySpy.mockImplementation(() => {
        if (count === 0) {
          return { rows: [], rowCount: count++ }
        }
        throw new Error('unknown')
      })
      await expect(wirelessProfilesTable.delete(profileName)).rejects.toThrow(API_UNEXPECTED_EXCEPTION(`Delete wireless configuration : ${profileName}`))
    })
  })
  describe('Insert', () => {
    test('should insert', async () => {
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 1 })
      const getByNameSpy = jest.spyOn(wirelessProfilesTable, 'getByName')
      getByNameSpy.mockResolvedValue(wirelessConfig)
      const result = await wirelessProfilesTable.insert(wirelessConfig)

      expect(result).toBe(wirelessConfig)
      expect(getByNameSpy).toHaveBeenCalledWith(wirelessConfig.profileName, wirelessConfig.tenantId)
      expect(querySpy).toBeCalledTimes(1)
      expect(querySpy).toBeCalledWith(`
        INSERT INTO wirelessconfigs
        (wireless_profile_name, authentication_method, encryption_method, ssid, psk_value, psk_passphrase, link_policy, creation_date, tenant_id)
        values($1, $2, $3, $4, $5, $6, $7, $8, $9)`, [
        wirelessConfig.profileName,
        wirelessConfig.authenticationMethod,
        wirelessConfig.encryptionMethod,
        wirelessConfig.ssid,
        wirelessConfig.pskValue,
        wirelessConfig.pskPassphrase,
        wirelessConfig.linkPolicy,
        new Date().toISOString().replace(/T/, ' ').replace(/\..+/, ''),
        wirelessConfig.tenantId
      ])
    })
    test('should NOT insert when duplicate name', async () => {
      querySpy.mockRejectedValueOnce({ code: '23505' })
      await expect(wirelessProfilesTable.insert(wirelessConfig)).rejects.toThrow(NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE('Wireless', wirelessConfig.profileName))
    })
    test('should NOT insert when unexpected exception', async () => {
      querySpy.mockRejectedValueOnce(new Error('unknown'))
      await expect(wirelessProfilesTable.insert(wirelessConfig)).rejects.toThrow(NETWORK_CONFIG_ERROR('Wireless', wirelessConfig.profileName))
    })
  })
  describe('Update', () => {
    test('should Update', async () => {
      querySpy.mockResolvedValueOnce({ rows: [{}], rowCount: 1 })
      const getByNameSpy = jest.spyOn(wirelessProfilesTable, 'getByName')
      getByNameSpy.mockResolvedValue(wirelessConfig)
      const result = await wirelessProfilesTable.update(wirelessConfig)
      expect(result).toBe(wirelessConfig)
      expect(getByNameSpy).toHaveBeenCalledWith(wirelessConfig.profileName, wirelessConfig.tenantId)
      expect(querySpy).toBeCalledTimes(1)
      expect(querySpy).toBeCalledWith(`
      UPDATE wirelessconfigs 
      SET authentication_method=$2, encryption_method=$3, ssid=$4, psk_value=$5, psk_passphrase=$6, link_policy=$7 
      WHERE wireless_profile_name=$1 and tenant_id = $8 and xmin = $9`,
      [
        wirelessConfig.profileName,
        wirelessConfig.authenticationMethod,
        wirelessConfig.encryptionMethod,
        wirelessConfig.ssid,
        wirelessConfig.pskValue,
        wirelessConfig.pskPassphrase,
        wirelessConfig.linkPolicy,
        wirelessConfig.tenantId,
        wirelessConfig.version
      ])
    })
    test('should NOT update when unexpected error', async () => {
      querySpy.mockRejectedValueOnce('unknown')
      await expect(wirelessProfilesTable.update(wirelessConfig)).rejects.toThrow(NETWORK_CONFIG_ERROR('Wireless', wirelessConfig.profileName))
    })
    test('should NOT update when concurrency issue', async () => {
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      const getByNameSpy = jest.spyOn(wirelessProfilesTable, 'getByName')
      getByNameSpy.mockResolvedValue(wirelessConfig)
      await expect(wirelessProfilesTable.update(wirelessConfig)).rejects.toThrow(CONCURRENCY_MESSAGE)
      expect(getByNameSpy).toHaveBeenCalledWith(wirelessConfig.profileName, wirelessConfig.tenantId)
      expect(querySpy).toBeCalledTimes(1)
      expect(querySpy).toBeCalledWith(`
      UPDATE wirelessconfigs 
      SET authentication_method=$2, encryption_method=$3, ssid=$4, psk_value=$5, psk_passphrase=$6, link_policy=$7 
      WHERE wireless_profile_name=$1 and tenant_id = $8 and xmin = $9`,
      [
        wirelessConfig.profileName,
        wirelessConfig.authenticationMethod,
        wirelessConfig.encryptionMethod,
        wirelessConfig.ssid,
        wirelessConfig.pskValue,
        wirelessConfig.pskPassphrase,
        wirelessConfig.linkPolicy,
        wirelessConfig.tenantId,
        wirelessConfig.version
      ])
    })
  })
})
