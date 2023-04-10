/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import PostgresDb from '..'
import { type Ieee8021xConfig, type Ieee8021xCountByInterface } from '../../../models/RCS.Config'
import {
  API_UNEXPECTED_EXCEPTION,
  CONCURRENCY_MESSAGE,
  NETWORK_CONFIG_ERROR,
  NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE
} from '../../../utils/constants'
import { IEEE8021xProfilesTable } from './ieee8021xProfiles'

describe('8021x profiles tests', () => {
  let db: PostgresDb
  let ieee8021xprofilesTable: IEEE8021xProfilesTable
  let querySpy: jest.SpyInstance
  let ieee8021xConfig: Ieee8021xConfig
  const profileName = 'profileName'
  beforeEach(() => {
    ieee8021xConfig = {
      profileName: 'profileName',
      authenticationProtocol: 0,
      username: '',
      password: '',
      activeInS0: false,
      pxeTimeout: 0,
      wiredInterface: false,
      tenantId: '',
      serverName: '',
      domain: '',
      roamingIdentity: '',
      version: ''
    }
    db = new PostgresDb('')
    ieee8021xprofilesTable = new IEEE8021xProfilesTable(db)
    querySpy = jest.spyOn(ieee8021xprofilesTable.db, 'query')
  })
  afterEach(() => {
    jest.clearAllMocks()
  })
  describe('Get', () => {
    test('should get count', async () => {
      querySpy.mockResolvedValueOnce({ rows: [{ total_count: 1 }], rowCount: 0 })
      const count = await ieee8021xprofilesTable.getCount()
      expect(count).toBe(1)
      expect(querySpy).toBeCalledTimes(1)
    })
    test('should get count by interface', async () => {
      querySpy.mockResolvedValueOnce({
        rows: [
          { wired_interface: true, total_count: 1 },
          { wired_interface: false, total_count: 3 }
        ]
      })
      const counts: Ieee8021xCountByInterface = await ieee8021xprofilesTable.getCountByInterface()
      expect(counts.wired).toBe(1)
      expect(counts.wireless).toBe(3)
      expect(querySpy).toBeCalledTimes(1)
    })
    test('should Get', async () => {
      querySpy.mockResolvedValueOnce({ rows: [{}], rowCount: 1 })
      const result = await ieee8021xprofilesTable.get()
      expect(result).toStrictEqual([{}])
      expect(querySpy).toBeCalledTimes(1)
    })
    test('should get by name', async () => {
      const rows = [{}]
      querySpy.mockResolvedValueOnce({ rows: [{}], rowCount: rows.length })
      const result = await ieee8021xprofilesTable.getByName(profileName)
      expect(result).toStrictEqual(rows[0])
      expect(querySpy).toBeCalledTimes(1)
    })
    test('should NOT get by name when no profiles exists', async () => {
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      const result = await ieee8021xprofilesTable.getByName(profileName)
      expect(result).toBeNull()
    })
  })
  describe('Delete', () => {
    test('should delete', async () => {
      querySpy.mockImplementation(() => ({ rows: [], rowCount: 1 }))
      const result = await ieee8021xprofilesTable.delete(profileName)
      expect(result).toBeTruthy()
      expect(querySpy).toBeCalledTimes(1)
    })
  })
  describe('Insert', () => {
    test('should insert', async () => {
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 1 })
      const getByNameSpy = jest.spyOn(ieee8021xprofilesTable, 'getByName')
      getByNameSpy.mockResolvedValue(ieee8021xConfig)
      const result = await ieee8021xprofilesTable.insert(ieee8021xConfig)

      expect(result).toBe(ieee8021xConfig)
      expect(querySpy).toBeCalledTimes(1)
    })
    test('should NOT insert when duplicate name', async () => {
      querySpy.mockRejectedValueOnce({ code: '23505', detail: 'triggerd by profile_name constraint' })
      await expect(ieee8021xprofilesTable.insert(ieee8021xConfig))
        .rejects
        .toThrow(NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE('802.1x', ieee8021xConfig.profileName))
    })
    test('should NOT insert on other error conditions', async () => {
      querySpy.mockRejectedValueOnce(new Error('unknown'))
      await expect(ieee8021xprofilesTable.insert(ieee8021xConfig)).rejects.toThrow(NETWORK_CONFIG_ERROR('802.1x', ieee8021xConfig.profileName))
    })
  })
  describe('Update', () => {
    test('should Update', async () => {
      querySpy.mockResolvedValueOnce({ rows: [{}], rowCount: 1 })
      const getByNameSpy = jest.spyOn(ieee8021xprofilesTable, 'getByName')
      getByNameSpy.mockResolvedValue(ieee8021xConfig)
      const result = await ieee8021xprofilesTable.update(ieee8021xConfig)
      expect(result).toBe(ieee8021xConfig)
      expect(querySpy).toBeCalledTimes(1)
    })
    test('should NOT update when unexpected error', async () => {
      querySpy.mockRejectedValueOnce('unknown')
      await expect(ieee8021xprofilesTable.update(ieee8021xConfig)).rejects.toThrow(API_UNEXPECTED_EXCEPTION(ieee8021xConfig.profileName))
    })
    test('should NOT update when concurrency issue', async () => {
      querySpy.mockResolvedValueOnce({ rows: [], rowCount: 0 })
      const getByNameSpy = jest.spyOn(ieee8021xprofilesTable, 'getByName')
      getByNameSpy.mockResolvedValue(ieee8021xConfig)
      await expect(ieee8021xprofilesTable.update(ieee8021xConfig)).rejects.toThrow(CONCURRENCY_MESSAGE)
      expect(querySpy).toBeCalledTimes(1)
    })
  })
})
