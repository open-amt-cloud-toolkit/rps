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
import { RPSError } from '../utils/RPSError'

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
  corsAllowCredentials: 'true',
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
  configName: 'ciraconfig1',
  mpsServerAddress: 'localhost',
  mpsPort: 4433,
  username: 'admin',
  password: 'P@ssw0rd',
  commonName: 'localhost',
  serverAddressFormat: 201, // IPv4 (3), IPv6 (4), FQDN (201)
  authMethod: 2, // Mutual Auth (1), Username/Password (2) (We only support 2)
  mpsRootCertificate: 'rootcert', // Assumption is Root Cert for MPS. Need to validate.
  proxyDetails: ''
},
{
  configName: 'ciraconfig2',
  mpsServerAddress: 'localhost',
  mpsPort: 4433,
  username: 'admin',
  password: 'P@ssw0rd',
  commonName: 'localhost',
  serverAddressFormat: 201, // IPv4 (3), IPv6 (4), FQDN (201)
  authMethod: 2, // Mutual Auth (1), Username/Password (2) (We only support 2)
  mpsRootCertificate: 'rootcert', // Assumption is Root Cert for MPS. Need to validate.
  proxyDetails: ''
}]

const AMTConfigurations = [
  {
    profileName: 'profile 1',
    amtPassword: '<StrongPassword1!>',
    mebxPassword: 'P@ssw0rd',
    generateRandomPassword: false,
    passwordLength: 8,
    generateRandomMEBxPassword: false,
    mebxPasswordLength: 8,
    randomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
    configurationScript: 'sample config script 1',
    activation: 'ccmactivate',
    ciraConfigName: 'ciraconfig1'
  },
  {
    profileName: 'profile 2',
    amtPassword: '<StrongPassword2!>',
    mebxPassword: 'P@ssw0rd',
    generateRandomPassword: true,
    passwordLength: 8,
    generateRandomMEBxPassword: false,
    mebxPasswordLength: 8,
    randomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
    configurationScript: 'sample config script 2',
    activation: 'acmactivate',
    ciraConfigName: 'ciraconfig1'
  }
]
const NETConfigurations = [
  {
    profileName: 'netprofile1',
    dhcpEnabled: true,
    staticIPShared: true,
    ipSyncEnabled: true
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
  expect(actual.configName).toEqual(expected)
})

test('delete configuration for cira', async () => {
  const ciraConfigDb = new CiraConfigFileStorageDb(AMTConfigurations, CIRAConfigurations, new Logger('AMTConfigDb'))
  let rpsError = null
  try {
    await ciraConfigDb.deleteCiraConfigByName('ciraconfig1')
  } catch (error) {
    rpsError = error
  }
  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toEqual('CIRA Config: ciraconfig1 associated with an AMT profile')
})

test('delete configuration for cira not associated with a profile', async () => {
  const ciraConfigDb = new CiraConfigFileStorageDb(AMTConfigurations, CIRAConfigurations, new Logger('CIRAConfigDb'))
  const actual = await ciraConfigDb.deleteCiraConfigByName('ciraconfig2')
  expect(actual).toEqual(true)
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
    configName: 'ciraconfig1',
    mpsServerAddress: 'localhost',
    mpsPort: 4433,
    username: 'admin',
    password: 'P@ssw0rd',
    commonName: 'localhost',
    serverAddressFormat: 201, // IPv4 (3), IPv6 (4), FQDN (201)
    authMethod: 2, // Mutual Auth (1), Username/Password (2) (We only support 2)
    mpsRootCertificate: 'rootcert', // Assumption is Root Cert for MPS. Need to validate.
    proxyDetails: ''
  }]

  const amtConfigurations = [
    {
      profileName: 'profile 1',
      amtPassword: '<StrongPassword1!>',
      mebxPassword: '<StrongPassword1!>',
      generateRandomPassword: false,
      passwordLength: 8,
      generateRandomMEBxPassword: false,
      mebxPasswordLength: 8,
      randomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
      configurationScript: 'sample config script 1',
      activation: 'ccmactivate',
      ciraConfigName: 'ciraconfig1'
    },
    {
      profileName: 'profile 2',
      amtPassword: '<StrongPassword>',
      mebxPassword: '<StrongPassword1!>',
      generateRandomPassword: false,
      passwordLength: 8,
      generateRandomMEBxPassword: false,
      mebxPasswordLength: 8,
      randomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
      configurationScript: 'sample config script 2',
      activation: 'acmactivate',
      ciraConfigName: 'ciraconfig1'
    },
    {
      profileName: 'profile 3',
      amtPassword: '<StrongPassword2!>',
      mebxPassword: '<StrongPassword1!>',
      generateRandomPassword: true,
      passwordLength: 8,
      generateRandomMEBxPassword: false,
      mebxPasswordLength: 8,
      randomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
      configurationScript: 'sample config script 3',
      activation: 'acmactivate',
      ciraConfigName: 'ciraconfig1'
    }
  ]

  const profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(amtConfigurations, CIRAConfigurations, NETConfigurations, new Logger('AMTConfigDb')))

  const actual = profileManager.validateAMTPasswords(amtConfigurations)

  expect(actual.length).toBe(3)
  expect(actual[0].profileName).toBe('profile 1')
  expect(actual[1].profileName).toBe('profile 2')
})

test('validate password with bad amt passwords', () => {
  const CIRAConfigurations = [{
    configName: 'ciraconfig1',
    mpsServerAddress: 'localhost',
    mpsPort: 4433,
    username: 'admin',
    password: 'P@ssw0rd',
    commonName: 'localhost',
    serverAddressFormat: 201, // IPv4 (3), IPv6 (4), FQDN (201)
    authMethod: 2, // Mutual Auth (1), Username/Password (2) (We only support 2)
    mpsRootCertificate: 'rootcert', // Assumption is Root Cert for MPS. Need to validate.
    proxyDetails: ''
  }]
  const AMTConfigurations = [
    {
      profileName: 'profile 1',
      amtPassword: 'password1',
      mebxPassword: 'password1',
      generateRandomPassword: false,
      passwordLength: 8,
      generateRandomMEBxPassword: false,
      mebxPasswordLength: 8,
      randomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
      configurationScript: 'sample config script 1',
      activation: 'ccmactivate',
      ciraConfigName: 'ciraconfig1'
    },
    {
      profileName: 'profile 2',
      amtPassword: 'password2',
      mebxPassword: 'password2',
      generateRandomPassword: false,
      passwordLength: 8,
      generateRandomMEBxPassword: false,
      mebxPasswordLength: 8,
      randomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
      configurationScript: 'sample config script 2',
      activation: 'acmactivate',
      ciraConfigName: 'ciraconfig1'
    }

  ]

  const profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(AMTConfigurations, CIRAConfigurations, NETConfigurations, new Logger('AMTConfigDb')))

  const activation1 = profileManager.getActivationMode('profile 1')
  const activation2 = profileManager.getActivationMode('profile 2')

  expect(activation1).toBeDefined()
  expect(activation2).toBeDefined()
})
