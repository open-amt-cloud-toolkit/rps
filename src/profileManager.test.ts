/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMTConfiguration, RPSConfig } from './models'
import { ProfileManager } from './ProfileManager'
import { ILogger } from './interfaces/ILogger'
import Logger from './Logger'
import { IProfilesTable } from './interfaces/database/IProfilesDb'
import { CIRAConfig, ClientAction } from './models/RCS.Config'

const logger: ILogger = new Logger('ProfileManagerTests')

const rcsConfig: RPSConfig = {
  WSConfiguration: {
    WebSocketPort: 8080
  },
  VaultConfig: {
    usevault: false,
    SecretsPath: 'kv/data/rcs/',
    token: '',
    address: ''
  },
  webport: 8081,
  credentialspath: '../../../MPS_MicroService/private/data.json',
  corsHeaders: '*',
  corsMethods: '*',
  corsOrigin: '*',
  mpsServer: 'https://localhost:3000',
  dbProvider: 'postgres',
  connectionString: 'postgresql://postgresadmin:admin123@localhost:5432/rpsdb',
  delayTimer: 12
}

const ciraConfigurations: CIRAConfig[] = [{
  configName: 'ciraconfig1',
  mpsServerAddress: 'localhost',
  mpsPort: 4433,
  username: 'admin',
  password: 'P@ssw0rd',
  commonName: 'localhost',
  serverAddressFormat: 201, // IPv4 (3), IPv6 (4), FQDN (201)
  authMethod: 2, // Mutual Auth (1), Username/Password (2) (We only support 2)
  mpsRootCertificate: 'rootcert', // Assumption is Root Cert for MPS. Need to validate.
  proxyDetails: '',
  tenantId: ''
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
  proxyDetails: '',
  tenantId: ''
}]

const amtConfigurations: AMTConfiguration[] = [
  {
    profileName: 'profile 1',
    amtPassword: '<StrongPassword1!>',
    mebxPassword: 'P@ssw0rd',
    generateRandomPassword: false,
    generateRandomMEBxPassword: false,
    activation: ClientAction.CLIENTCTLMODE,
    ciraConfigName: 'ciraconfig1',
    ciraConfigObject: ciraConfigurations[0],
    tlsMode: 1,
    tenantId: ''
  },
  {
    profileName: 'profile 2',
    amtPassword: '<StrongPassword2!>',
    mebxPassword: 'P@ssw0rd',
    generateRandomPassword: false,
    generateRandomMEBxPassword: false,
    activation: ClientAction.ADMINCTLMODE,
    ciraConfigName: 'ciraconfig1',
    ciraConfigObject: ciraConfigurations[0],
    tenantId: ''
  }
]
const profileStub: IProfilesTable = {
  getCount: async () => {
    return 2
  },
  getByName: async (name) => {
    return amtConfigurations.find(c => c.profileName === name)
  },
  get: async (top, skip) => {
    return amtConfigurations
  },
  getCiraConfigForProfile: async (ciraConfigName) => {
    return ciraConfigurations.find(c => c.configName === ciraConfigName)
  },
  delete: async (profileName) => {
    return true
  },
  insert: async (amtConfig: AMTConfiguration) => {
    amtConfigurations.push(amtConfig)
    return amtConfig
  },
  update: async (amtConfig) => {
    const index = amtConfigurations.findIndex((item): boolean => item.profileName === amtConfig.profileName)
    if (index >= 0) {
      amtConfigurations.splice(index, 1)
      amtConfigurations.push(amtConfig)
      return amtConfig
    }
    return null
  }
}
test('test if profile exists', () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, profileStub)

  const actual = profileManager.doesProfileExist('profile 1')
  expect(actual).toBeTruthy()
})

test('test if profile exists', async () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, profileStub)

  const actual = await profileManager.doesProfileExist('profile 5')
  expect(actual).toBeFalsy()
})

test('retrieve activation based on profile', async () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, profileStub)

  const expected = ClientAction.ADMINCTLMODE
  const actual = await profileManager.getActivationMode('profile 2')
  expect(actual).toEqual(expected)
})

test('retrieve activation based on profile', async () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, profileStub, rcsConfig)

  const expected = ClientAction.CLIENTCTLMODE
  const actual = await profileManager.getActivationMode('profile 1')
  expect(actual).toEqual(expected)
})

test('retrieve configuration for cira', async () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, profileStub, rcsConfig)

  const expected = 'ciraconfig1'
  const actual = await profileManager.getCiraConfiguration('profile 2')
  expect(actual.configName).toEqual(expected)
})

test('retrieve amt password', async () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, profileStub)

  const expected = '<StrongPassword1!>'
  const profile = 'profile 1'
  const actual = await profileManager.getAmtPassword(profile)

  expect(actual).toEqual(expected)
})

test('retrieve amt password auto generated', async () => {
  const profileManager: ProfileManager = new ProfileManager(logger, null, profileStub, rcsConfig)

  const profile = 'profile 2'
  const expected = '<StrongPassword2!>'
  const actual = await profileManager.getAmtPassword(profile)
  expect(actual).toBe(expected)
})
