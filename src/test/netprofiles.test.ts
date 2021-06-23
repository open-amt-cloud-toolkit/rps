/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { NetworkConfig } from '../RCS.Config'
import { IDbCreator } from '../repositories/interfaces/IDbCreator'
import { NetConfigDb } from '../repositories/netProfiles'
import { RPSError } from '../utils/RPSError'

describe('Network Profile tests', () => {
  let creator: IDbCreator
  beforeEach(() => {
    creator = {
      getDb: function () {
        return {
          query: (query) => {
            if (query.indexOf('SELECT') >= 0) {
              return {
                rowCount: 1,
                rows: [{
                  network_profile_name: 'profile3',
                  dhcp_enabled: false,
                  static_ip_shared: true,
                  ip_sync_enabled: true
                }]
              }
            }
          }
        }
      }
    }
  })
  test('delete configuration for network profile with constraint', async () => {
    creator.getDb = function () {
      return {
        query: (query) => {
          if (query.indexOf('DELETE') >= 0) {
            const e = new Error();
            (e as any).code = '23503'
            throw e
          } else {
            return { rowCount: 0 }
          }
        }
      }
    }
    const db = new NetConfigDb(creator)
    let rpsError = null
    try {
      await db.deleteProfileByName('profile1')
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual('NETWORK profile: profile1 is associated with an AMT Profile.')
  })

  test('delete configuration for network profile no constraint', async () => {
    creator.getDb = function () {
      return {
        query: (query) => {
          if (query.indexOf('DELETE') >= 0) {
            return { rowCount: 1 }
          } else {
            return { rowCount: 0 }
          }
        }
      }
    }
    const db = new NetConfigDb(creator)
    const actual = await db.deleteProfileByName('profile2')
    expect(actual).toEqual(true)
  })

  test('update configuration for network profile exists', async () => {
    const newProfile = {
      profileName: 'profile3',
      dhcpEnabled: false,
      staticIPShared: true,
      ipSyncEnabled: true
    }
    const newProfileFromDb = {
      network_profile_name: 'profile3',
      dhcp_enabled: false,
      static_ip_shared: true,
      ip_sync_enabled: true
    }
    creator.getDb = function () {
      return {
        query: (query) => {
          if (query.indexOf('UPDATE') >= 0) {
            return { rowCount: 1 }
          } else if (query.indexOf('SELECT network_profile_name, dhcp_enabled, static_ip_shared, ip_sync_enabled FROM networkconfigs WHERE network_profile_name = ') >= 0) {
            return { rowCount: 1, rows: [newProfileFromDb] }
          } else {
            return { rowCount: 0 }
          }
        }
      }
    }
    const db = new NetConfigDb(creator)
    const actual = await db.updateProfile(newProfile)
    expect(actual).toEqual(newProfile)
  })

  test("update configuration for network profile doesn't exist", async () => {
    const newProfile = {
      profileName: 'profile4',
      dhcpEnabled: false,
      staticIPShared: true,
      ipSyncEnabled: true
    }
    creator.getDb = function () {
      return {
        query: (query) => {
          if (query.indexOf('UPDATE') >= 0) {
            return { rowCount: 0 }
          } else {
            return { rowCount: 0 }
          }
        }
      }
    }
    const db = new NetConfigDb(creator)
    const actual = await db.updateProfile(newProfile)
    expect(actual).toEqual(null)
  })

  test('update configuration for network profile associated with profile', async () => {
    const newProfile = {
      profileName: 'profile1',
      dhcpEnabled: false,
      staticIPShared: true,
      ipSyncEnabled: true
    }
    const db = new NetConfigDb(creator)
    let rpsError = null
    try {
      await db.updateProfile(newProfile)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual('Operation failed for NETWORK profile: profile1. Cannot modify NETWORK settings if its already associated with a profile.')
  })

  test("create configuration for network profile doesn't exist", async () => {
    const newProfile = {
      profileName: 'profile11',
      dhcpEnabled: false,
      staticIPShared: true,
      ipSyncEnabled: true
    }
    const result = {
      network_profile_name: 'profile11',
      dhcp_enabled: false,
      static_ip_shared: true,
      ip_sync_enabled: true
    }
    creator.getDb = function () {
      return {
        query: (query) => {
          if (query.indexOf('INSERT') >= 0) {
            return { rowCount: 1 }
          } else {
            return { rowCount: 1, rows: [result] }
          }
        }
      }
    }

    const db = new NetConfigDb(creator)
    const actual = await db.insertProfile(newProfile)
    expect(actual).toEqual(newProfile)
  })

  test('create configuration for network profile already exist', async () => {
    const newProfile = {
      profileName: 'profile11',
      dhcpEnabled: false,
      staticIPShared: true,
      ipSyncEnabled: true
    }
    let rpsError = null
    creator.getDb = function () {
      return {
        query: (query) => {
          const e = new Error();
          (e as any).code = '23505'
          throw e
        }
      }
    }
    const db = new NetConfigDb(creator)

    try {
      await db.insertProfile(newProfile)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual('NETWORK profile profile11 already exists')
  })

  test('get network configs', async () => {
    const db = new NetConfigDb(creator)
    const actual = await db.getAllProfiles()
    expect(actual.length).toBeGreaterThan(0)
  })

  test('get network config by name does exist', async () => {
    const db = new NetConfigDb(creator)
    const actual = await db.getProfileByName('profile3')
    expect(actual).toEqual({
      profileName: 'profile3',
      dhcpEnabled: false,
      staticIPShared: true,
      ipSyncEnabled: true
    })
  })

  test('get network config by name does NOT exist', async () => {
    creator.getDb = function () {
      return {
        query: (query) => {
          return { rowCount: 0 }
        }
      }
    }
    const db = new NetConfigDb(creator)
    const actual: NetworkConfig = await db.getProfileByName('profile111')
    expect(actual).toBeNull()
  })
})
