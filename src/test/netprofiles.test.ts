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
    ProfileName: 'profile1',
    AMTPassword: 'P@ssw0rd',
    MEBxPassword: 'P@ssw0rd',
    GenerateRandomPassword: false,
    RandomPasswordLength: 8,
    GenerateRandomMEBxPassword: false,
    RandomMEBxPasswordLength: 8,
    RandomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
    ConfigurationScript: null,
    Activation: 'acmactivate',
    CIRAConfigName: 'ciraconfig1'
  },
  {
    ProfileName: 'profile2',
    AMTPassword: 'P@ssw0rd',
    MEBxPassword: 'P@ssw0rd',
    GenerateRandomPassword: false,
    RandomPasswordLength: 8,
    GenerateRandomMEBxPassword: false,
    RandomMEBxPasswordLength: 8,
    RandomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
    ConfigurationScript: null,
    Activation: 'ccmactivate',
    CIRAConfigName: 'ciraconfig1'
  },
  {
    ProfileName: 'profile3',
    AMTPassword: 'P@ssw0rd',
    MEBxPassword: 'P@ssw0rd',
    GenerateRandomPassword: false,
    RandomPasswordLength: 8,
    GenerateRandomMEBxPassword: false,
    RandomMEBxPasswordLength: 8,
    RandomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
    ConfigurationScript: null,
    Activation: 'invalid',
    CIRAConfigName: 'ciraconfig1'
  },
  {
    ProfileName: 'profile4',
    AMTPassword: 'P@ssw0rd',
    MEBxPassword: 'P@ssw0rd',
    GenerateRandomPassword: false,
    RandomPasswordLength: 8,
    GenerateRandomMEBxPassword: false,
    RandomMEBxPasswordLength: 8,
    RandomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
    ConfigurationScript: null,
    Activation: '',
    CIRAConfigName: 'ciraconfig1',
    NetworkConfigName: 'profile1'
  }
]

const NETConfigurations = [
  {
    ProfileName: 'profile1',
    DHCPEnabled: true,
    StaticIPShared: true,
    IPSyncEnabled: true
  },
  {
    ProfileName: 'profile2',
    DHCPEnabled: true,
    StaticIPShared: true,
    IPSyncEnabled: true
  },
  {
    ProfileName: 'profile3',
    DHCPEnabled: true,
    StaticIPShared: true,
    IPSyncEnabled: true
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
      ProfileName: 'profile3',
      DHCPEnabled: false,
      StaticIPShared: true,
      IPSyncEnabled: true
    }
    const actual = await netConfigDb.updateProfile(newProfile)
    expect(actual).toEqual(true)
  })

  test('update configuration for network profile doesnt exist', async () => {
    const netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, new Logger('NetConfigDb'))
    const newProfile = {
      ProfileName: 'profile4',
      DHCPEnabled: false,
      StaticIPShared: true,
      IPSyncEnabled: true
    }
    const actual = await netConfigDb.updateProfile(newProfile)
    expect(actual).toEqual(false)
  })

  test('update configuration for network profile associated with profile', async () => {
    const netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, new Logger('NetConfigDb'))
    const newProfile = {
      ProfileName: 'profile1',
      DHCPEnabled: false,
      StaticIPShared: true,
      IPSyncEnabled: true
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
      ProfileName: 'profile11',
      DHCPEnabled: false,
      StaticIPShared: true,
      IPSyncEnabled: true
    }
    const actual = await netConfigDb.insertProfile(newProfile)
    expect(actual).toEqual(true)
  })

  test('create configuration for network profile already exist', async () => {
    const netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, new Logger('NetConfigDb'))
    const newProfile = {
      ProfileName: 'profile11',
      DHCPEnabled: false,
      StaticIPShared: true,
      IPSyncEnabled: true
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
      ProfileName: 'profile11',
      DHCPEnabled: false,
      StaticIPShared: true,
      IPSyncEnabled: true
    })
  })

  test('get network config by name does exist', async () => {
    const netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, new Logger('NetConfigDb'))
    const actual: NetworkConfig = await netConfigDb.getProfileByName('profile111')
    expect(actual).toEqual(null)
  })
})
