/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import Logger from '../Logger'

import { NetConfigFileStorageDb } from '../NetConfigFileStorageDb'
import { NetworkConfig } from '../RCS.Config'
import { RPSError } from '../utils/RPSError'

const AMTConfigurations = [
  {
    profileName: 'profile1',
    amtPassword: 'P@ssw0rd',
    mebxPassword: 'P@ssw0rd',
    generateRandomPassword: false,
    randomPasswordLength: 8,
    generateRandomMEBxPassword: false,
    randomMEBxPasswordLength: 8,
    randomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
    configurationScript: null,
    activation: 'acmactivate',
    ciraConfigName: 'ciraconfig1'
  },
  {
    profileName: 'profile2',
    amtPassword: 'P@ssw0rd',
    mebxPassword: 'P@ssw0rd',
    generateRandomPassword: false,
    randomPasswordLength: 8,
    generateRandomMEBxPassword: false,
    randomMEBxPasswordLength: 8,
    randomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
    configurationScript: null,
    activation: 'ccmactivate',
    ciraConfigName: 'ciraconfig1'
  },
  {
    profileName: 'profile3',
    amtPassword: 'P@ssw0rd',
    mebxPassword: 'P@ssw0rd',
    generateRandomPassword: false,
    randomPasswordLength: 8,
    generateRandomMEBxPassword: false,
    randomMEBxPasswordLength: 8,
    randomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
    configurationScript: null,
    activation: 'invalid',
    ciraConfigName: 'ciraconfig1'
  },
  {
    profileName: 'profile4',
    amtPassword: 'P@ssw0rd',
    mebxPassword: 'P@ssw0rd',
    generateRandomPassword: false,
    randomPasswordLength: 8,
    generateRandomMEBxPassword: false,
    randomMEBxPasswordLength: 8,
    randomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
    configurationScript: null,
    activation: '',
    ciraConfigName: 'ciraconfig1',
    networkConfigName: 'profile1'
  }
]

const NETConfigurations = [
  {
    profileName: 'profile1',
    dhcpEnabled: true,
    staticIPShared: true,
    ipSyncEnabled: true
  },
  {
    profileName: 'profile2',
    dhcpEnabled: true,
    staticIPShared: true,
    ipSyncEnabled: true
  },
  {
    profileName: 'profile3',
    dhcpEnabled: true,
    staticIPShared: true,
    ipSyncEnabled: true
  }
]
describe('Network Profile tests', () => {
  test('delete configuration for network profile with constraint', async () => {
    const netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, new Logger('NetConfigDb'))
    let rpsError = null
    try {
      await netConfigDb.deleteProfileByName('profile1')
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual('NETWORK Config: profile1 is associated with an AMT Profile.')
  })

  test('delete configuration for network profile no constraint', async () => {
    const netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, new Logger('NetConfigDb'))

    const actual = await netConfigDb.deleteProfileByName('profile2')
    expect(actual).toEqual(true)
  })

  test('update configuration for network profile exists', async () => {
    const netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, new Logger('NetConfigDb'))
    const newProfile = {
      profileName: 'profile3',
      dhcpEnabled: false,
      staticIPShared: true,
      ipSyncEnabled: true
    }
    const actual = await netConfigDb.updateProfile(newProfile)
    expect(actual).toEqual(true)
  })

  test('update configuration for network profile doesnt exist', async () => {
    const netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, new Logger('NetConfigDb'))
    const newProfile = {
      profileName: 'profile4',
      dhcpEnabled: false,
      staticIPShared: true,
      ipSyncEnabled: true
    }
    const actual = await netConfigDb.updateProfile(newProfile)
    expect(actual).toEqual(false)
  })

  test('update configuration for network profile associated with profile', async () => {
    const netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, new Logger('NetConfigDb'))
    const newProfile = {
      profileName: 'profile1',
      dhcpEnabled: false,
      staticIPShared: true,
      ipSyncEnabled: true
    }
    let rpsError = null
    try {
      await netConfigDb.updateProfile(newProfile)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual('Operation failed for NETWORK Config: profile1. Cannot Update Network settings if its already associated with a profile.')
  })

  test('create configuration for network profile doesn\'t exist', async () => {
    const netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, new Logger('NetConfigDb'))
    const newProfile = {
      profileName: 'profile11',
      dhcpEnabled: false,
      staticIPShared: true,
      ipSyncEnabled: true
    }
    const actual = await netConfigDb.insertProfile(newProfile)
    expect(actual).toEqual(true)
  })

  test('create configuration for network profile already exist', async () => {
    const netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, new Logger('NetConfigDb'))
    const newProfile = {
      profileName: 'profile11',
      dhcpEnabled: false,
      staticIPShared: true,
      ipSyncEnabled: true
    }
    let rpsError = null
    try {
      await netConfigDb.insertProfile(newProfile)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual('NETWORK Config profile11 already exists')
  })

  test('get network configs', async () => {
    const netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, new Logger('NetConfigDb'))
    const actual = await netConfigDb.getAllProfiles()
    expect(actual.length).toBeGreaterThan(0)
  })

  test('get network config by name does exist', async () => {
    const netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, new Logger('NetConfigDb'))
    const actual = await netConfigDb.getProfileByName('profile11')
    expect(actual).toEqual({
      profileName: 'profile11',
      dhcpEnabled: false,
      staticIPShared: true,
      ipSyncEnabled: true
    })
  })

  test('get network config by name does exist', async () => {
    const netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, new Logger('NetConfigDb'))
    const actual: NetworkConfig = await netConfigDb.getProfileByName('profile111')
    expect(actual).toEqual(null)
  })
})
