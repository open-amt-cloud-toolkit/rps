/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { RCSConfig } from '../models/Rcs'
import { ProfileManager } from '../ProfileManager'
import { ILogger } from '../interfaces/ILogger'
import Logger from '../Logger'
import { AMTConfigDb } from '../AMTConfigDb'
import * as path from 'path'
import { EnvReader } from '../utils/EnvReader'
import { CiraConfigFileStorageDb } from '../CiraConfigFileStorageDb'

const logger: ILogger = new Logger('ProfileManagerTests')

const rcsConfig: RCSConfig = {
  Name: 'RCS Configuration File',
  Description: 'Contains settings to configure the RCS Server',
  WSConfiguration: {
    WebSocketPort: 8080,
    WebSocketTLS: false,
    WebSocketCertificate: 'tlscert.pem',
    WebSocketCertificateKey: 'tlskey.pem'
  },
  mpsusername: 'admin',
  mpspass: 'P@ssw0rd',
  amtusername: 'admin',
  RPSXAPIKEY: 'P@ssw0rd',
  VaultConfig: {
    usevault: false,
    SecretsPath: 'kv/data/rcs/',
    token: '',
    address: ''
  },
  devmode: true,
  https: false,
  webport: 8081,
  credentialspath: '../../../MPS_MicroService/private/data.json',
  corsHeaders: '*',
  corsMethods: '*',
  corsOrigin: '*',
  DbConfig: {
    useDbForConfig: false,
    dbhost: '',
    dbname: '',
    dbport: 0,
    dbuser: '',
    dbpassword: ''
  }
}

const CIRAConfigurations = [{
  ConfigName: 'ciraconfig1',
  MPSServerAddress: 'localhost',
  MPSPort: 4433,
  Username: 'admin',
  Password: 'P@ssw0rd',
  CommonName: 'localhost',
  ServerAddressFormat: 201, // IPv4 (3), IPv6 (4), FQDN (201)
  AuthMethod: 2, // Mutual Auth (1), Username/Password (2) (We only support 2)
  MPSRootCertificate: 'rootcert', // Assumption is Root Cert for MPS. Need to validate.
  ProxyDetails: ''
},
{
  ConfigName: 'ciraconfig2',
  MPSServerAddress: 'localhost',
  MPSPort: 4433,
  Username: 'admin',
  Password: 'P@ssw0rd',
  CommonName: 'localhost',
  ServerAddressFormat: 201, // IPv4 (3), IPv6 (4), FQDN (201)
  AuthMethod: 2, // Mutual Auth (1), Username/Password (2) (We only support 2)
  MPSRootCertificate: 'rootcert', // Assumption is Root Cert for MPS. Need to validate.
  ProxyDetails: ''
}]

const AMTConfigurations = [
  {
    ProfileName: 'profile 1',
    AMTPassword: '<StrongPassword1!>',
    MEBxPassword: 'P@ssw0rd',
    GenerateRandomPassword: false,
    RandomPasswordLength: 8,
    GenerateRandomMEBxPassword: false,
    RandomMEBxPasswordLength: 8,
    RandomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
    ConfigurationScript: 'sample config script 1',
    Activation: 'ccmactivate',
    CIRAConfigName: 'ciraconfig1'
  },
  {
    ProfileName: 'profile 2',
    AMTPassword: '<StrongPassword2!>',
    MEBxPassword: 'P@ssw0rd',
    GenerateRandomPassword: true,
    RandomPasswordLength: 8,
    GenerateRandomMEBxPassword: false,
    RandomMEBxPasswordLength: 8,
    RandomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
    ConfigurationScript: 'sample config script 2',
    Activation: 'acmactivate',
    CIRAConfigName: 'ciraconfig1'
  }
]
const NETConfigurations = [
  {
    ProfileName: 'netprofile1',
    DHCPEnabled: true,
    StaticIPShared: true,
    IPSyncEnabled: true
  }
]

EnvReader.configPath = path.join(__dirname, './helper/data.json')

test('test if profile exists', () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(AMTConfigurations, CIRAConfigurations, NETConfigurations, new Logger('AMTConfigDb')))

  const actual = profileManager.doesProfileExist('profile 1')
  console.log('actual : ', actual)
  expect(actual).toBeTruthy()
})

test('test if profile exists', async () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(AMTConfigurations, CIRAConfigurations, NETConfigurations, new Logger('AMTConfigDb')))

  const actual = await profileManager.doesProfileExist('profile 5')
  expect(actual).toBeFalsy()
})

test('retrieve activation based on profile', async () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(AMTConfigurations, CIRAConfigurations, NETConfigurations, new Logger('AMTConfigDb')))

  const expected = 'ccmactivate'
  const actual = await profileManager.getActivationMode('profile 1')
  expect(actual).toEqual(expected)
})

test('retrieve activation based on profile', async () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(AMTConfigurations, CIRAConfigurations, NETConfigurations, new Logger('AMTConfigDb')), rcsConfig)

  const expected = 'acmactivate'
  const actual = await profileManager.getActivationMode('profile 2')
  expect(actual).toEqual(expected)
})

test('retrieve config script', async () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(AMTConfigurations, CIRAConfigurations, NETConfigurations, new Logger('AMTConfigDb')))
  const expected = 'sample config script 1'
  const actual = await profileManager.getConfigurationScript('profile 1')
  expect(actual).toEqual(expected)
})

test('retrieve config script', async () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(AMTConfigurations, CIRAConfigurations, NETConfigurations, new Logger('AMTConfigDb')), rcsConfig)

  const expected = 'sample config script 2'
  const actual = await profileManager.getConfigurationScript('profile 2')
  expect(actual).toEqual(expected)
})

test('retrieve configuration for cira', async () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(AMTConfigurations, CIRAConfigurations, NETConfigurations, new Logger('AMTConfigDb')), rcsConfig)

  const expected = 'ciraconfig1'
  const actual = await profileManager.getCiraConfiguration('profile 2')
  expect(actual.ConfigName).toEqual(expected)
})

test('delete configuration for cira', async () => {
  const ciraConfigDb = new CiraConfigFileStorageDb(AMTConfigurations, CIRAConfigurations, new Logger('AMTConfigDb'))
  let reason
  await ciraConfigDb.deleteCiraConfigByName('ciraconfig1').catch((error) => {
    reason = error
  })
  expect(reason).toEqual('Deletion failed for CIRA Config: ciraconfig1. Profile associated with this Config.')
})

test('delete configuration for cira not associated with a profile', async () => {
  const ciraConfigDb = new CiraConfigFileStorageDb(AMTConfigurations, CIRAConfigurations, new Logger('CIRAConfigDb'))
  const actual = await ciraConfigDb.deleteCiraConfigByName('ciraconfig2')
  expect(actual).toEqual('CIRA Config ciraconfig2 successfully deleted')
})

test('retrieve amt password', async () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(AMTConfigurations, CIRAConfigurations, NETConfigurations, new Logger('AMTConfigDb')))

  const expected = '<StrongPassword1!>'
  const profile = 'profile 1'
  const actual = await profileManager.getAmtPassword(profile)

  expect(actual).toEqual(expected)
})

test('retrieve amt password auto generated', async () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(AMTConfigurations, CIRAConfigurations, NETConfigurations, new Logger('AMTConfigDb')), rcsConfig)

  const profile = 'profile 2'
  const expected = '<StrongPassword2!>'
  const actual = await profileManager.getAmtPassword(profile)
  expect(actual).not.toBe(expected)
})

test('validate password', () => {
  const CIRAConfigurations = [{
    ConfigName: 'ciraconfig1',
    MPSServerAddress: 'localhost',
    MPSPort: 4433,
    Username: 'admin',
    Password: 'P@ssw0rd',
    CommonName: 'localhost',
    ServerAddressFormat: 201, // IPv4 (3), IPv6 (4), FQDN (201)
    AuthMethod: 2, // Mutual Auth (1), Username/Password (2) (We only support 2)
    MPSRootCertificate: 'rootcert', // Assumption is Root Cert for MPS. Need to validate.
    ProxyDetails: ''
  }]

  const amtConfigurations = [
    {
      ProfileName: 'profile 1',
      AMTPassword: '<StrongPassword1!>',
      MEBxPassword: '<StrongPassword1!>',
      GenerateRandomPassword: false,
      RandomPasswordLength: 8,
      GenerateRandomMEBxPassword: false,
      RandomMEBxPasswordLength: 8,
      RandomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
      ConfigurationScript: 'sample config script 1',
      Activation: 'ccmactivate',
      CIRAConfigName: 'ciraconfig1'
    },
    {
      ProfileName: 'profile 2',
      AMTPassword: '<StrongPassword>',
      MEBxPassword: '<StrongPassword1!>',
      GenerateRandomPassword: false,
      RandomPasswordLength: 8,
      GenerateRandomMEBxPassword: false,
      RandomMEBxPasswordLength: 8,
      RandomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
      ConfigurationScript: 'sample config script 2',
      Activation: 'acmactivate',
      CIRAConfigName: 'ciraconfig1'
    },
    {
      ProfileName: 'profile 3',
      AMTPassword: '<StrongPassword2!>',
      MEBxPassword: '<StrongPassword1!>',
      GenerateRandomPassword: true,
      RandomPasswordLength: 8,
      GenerateRandomMEBxPassword: false,
      RandomMEBxPasswordLength: 8,
      RandomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
      ConfigurationScript: 'sample config script 3',
      Activation: 'acmactivate',
      CIRAConfigName: 'ciraconfig1'
    }
  ]

  const profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(amtConfigurations, CIRAConfigurations, NETConfigurations, new Logger('AMTConfigDb')))

  const actual = profileManager.validateAMTPasswords(amtConfigurations)

  expect(actual.length).toBe(3)
  expect(actual[0].ProfileName).toBe('profile 1')
  expect(actual[1].ProfileName).toBe('profile 2')
})

test('validate password with bad amt passwords', () => {
  const CIRAConfigurations = [{
    ConfigName: 'ciraconfig1',
    MPSServerAddress: 'localhost',
    MPSPort: 4433,
    Username: 'admin',
    Password: 'P@ssw0rd',
    CommonName: 'localhost',
    ServerAddressFormat: 201, // IPv4 (3), IPv6 (4), FQDN (201)
    AuthMethod: 2, // Mutual Auth (1), Username/Password (2) (We only support 2)
    MPSRootCertificate: 'rootcert', // Assumption is Root Cert for MPS. Need to validate.
    ProxyDetails: ''
  }]
  const AMTConfigurations = [
    {
      ProfileName: 'profile 1',
      AMTPassword: 'password1',
      MEBxPassword: 'password1',
      GenerateRandomPassword: false,
      RandomPasswordLength: 8,
      GenerateRandomMEBxPassword: false,
      RandomMEBxPasswordLength: 8,
      RandomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
      ConfigurationScript: 'sample config script 1',
      Activation: 'ccmactivate',
      CIRAConfigName: 'ciraconfig1'
    },
    {
      ProfileName: 'profile 2',
      AMTPassword: 'password2',
      MEBxPassword: 'password2',
      GenerateRandomPassword: false,
      RandomPasswordLength: 8,
      GenerateRandomMEBxPassword: false,
      RandomMEBxPasswordLength: 8,
      RandomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
      ConfigurationScript: 'sample config script 2',
      Activation: 'acmactivate',
      CIRAConfigName: 'ciraconfig1'
    }

  ]

  const profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(AMTConfigurations, CIRAConfigurations, NETConfigurations, new Logger('AMTConfigDb')))

  const activation1 = profileManager.getActivationMode('profile 1')
  const activation2 = profileManager.getActivationMode('profile 2')

  expect(activation1).toBeDefined()
  expect(activation2).toBeDefined()
})
