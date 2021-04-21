import { AMTConfiguration } from '../models/Rcs'
import {
  handleAMTPassword,
  handleMEBxPassword,
  handleGenerateRandomPassword,
  handleGenerateRandomMEBxPassword,
  getUpdatedData
} from '../routes/admin/profiles/editProfile'

test('test handleAMTpassword when the request body amtPassword is null or undefined', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', amtPassword: 'P@ssw0rd' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    amtPassword: 'P@ssw0rd',
    generateRandomPassword: false,
    passwordLength: null
  }
  const result: AMTConfiguration = handleAMTPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleAMTpassword when the request body amtPassword is not null', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', amtPassword: 'Intel@123' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', amtPassword: 'P@ssw0rd' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    amtPassword: 'Intel@123'
  }
  const result: AMTConfiguration = handleAMTPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleMEBxPassword when the request body mebxPassword is null or undefined', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', mebxPassword: 'P@ssw0rd' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    mebxPassword: 'P@ssw0rd',
    generateRandomMEBxPassword: false,
    mebxPasswordLength: null
  }
  const result: AMTConfiguration = handleMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleMEBxPassword when the request body mebxPassword is not null', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', mebxPassword: 'Intel@123' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', mebxPassword: 'P@ssw0rd' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    mebxPassword: 'Intel@123'
  }
  const result: AMTConfiguration = handleMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomPassword when the request body generateRandomPassword is true', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomPassword: true, passwordLength: 10 }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', amtPassword: 'P@ssw0rd' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    generateRandomPassword: true,
    passwordLength: 10,
    amtPassword: null
  }
  const result: AMTConfiguration = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomPassword when passwordLength is updated', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomPassword: true, passwordLength: 10 }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomPassword: true, passwordLength: 8 }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    generateRandomPassword: true,
    passwordLength: 10,
    amtPassword: null
  }
  const result: AMTConfiguration = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomPassword when the request body generateRandomPassword is undefined and profile created with amtPassword', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', amtPassword: 'P@ssw0rd' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const expected: AMTConfiguration = {
    activation: 'acmactivate',
    generateRandomPassword: undefined,
    passwordLength: undefined,
    profileName: 'acm'
  }
  const result: AMTConfiguration = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomPassword when the request body generateRandomPassword is undefined and profile created with random amtPassword', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomPassword: true, passwordLength: 10 }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const expected: AMTConfiguration = {
    activation: 'acmactivate',
    generateRandomPassword: true,
    passwordLength: 10,
    profileName: 'acm'
  }
  const result: AMTConfiguration = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomMEBxPassword when the request body generateRandomMEBxPassword is true', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomMEBxPassword: true, mebxPasswordLength: 10 }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', mebxPassword: 'P@ssw0rd' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    generateRandomMEBxPassword: true,
    mebxPasswordLength: 10,
    mebxPassword: null
  }
  const result: AMTConfiguration = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomMEBxPassword when mebxPasswordLength is updated', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomMEBxPassword: true, mebxPasswordLength: 10 }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomMEBxPassword: true, mebxPasswordLength: 8 }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    generateRandomMEBxPassword: true,
    mebxPasswordLength: 10,
    mebxPassword: null
  }
  const result: AMTConfiguration = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomMEBxPassword when the request body generateRandomMEBxPassword is undefined and profile created with mebxPassword', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', mebxPassword: 'P@ssw0rd' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const expected: AMTConfiguration = {
    activation: 'acmactivate',
    generateRandomMEBxPassword: undefined,
    mebxPasswordLength: undefined,
    profileName: 'acm'
  }
  const result: AMTConfiguration = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test getUpdatedData when the request body when activation changed', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomMEBxPassword: true, mebxPasswordLength: 10 }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate' }
  const expected: AMTConfiguration = {
    activation: 'acmactivate',
    generateRandomMEBxPassword: true,
    mebxPasswordLength: 10,
    profileName: 'acm'
  }
  const result: AMTConfiguration = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test getUpdatedData when static passwords are changed to random', () => {
  const newConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    generateRandomMEBxPassword: true,
    mebxPasswordLength: 8,
    generateRandomPassword: true,
    passwordLength: 10
  }
  const oldConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    mebxPassword: 'P@ssw0rd',
    amtPassword: 'P@ssw0rd'
  }
  const amtConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    amtPassword: null,
    ciraConfigName: undefined,
    generateRandomMEBxPassword: true,
    generateRandomPassword: true,
    mebxPassword: null,
    mebxPasswordLength: 8,
    networkConfigName: undefined,
    passwordLength: 10
  }
  const result: AMTConfiguration = getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(amtConfig)
})

test('test getUpdatedData when random passwords are changed to static', () => {
  const newConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    mebxPassword: 'P@ssw0rd',
    amtPassword: 'P@ssw0rd'
  }
  const oldConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    generateRandomMEBxPassword: true,
    mebxPasswordLength: 8,
    generateRandomPassword: true,
    passwordLength: 10
  }
  const amtConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    amtPassword: 'P@ssw0rd',
    ciraConfigName: undefined,
    generateRandomMEBxPassword: false,
    generateRandomPassword: false,
    mebxPassword: 'P@ssw0rd',
    mebxPasswordLength: null,
    networkConfigName: undefined,
    passwordLength: null,
    tags: undefined
  }
  const result: AMTConfiguration = getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(amtConfig)
})

test('test getUpdatedData when activation messaged changed from acmactivate to ccmactivate', () => {
  const newConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'ccmactivate'
  }
  const oldConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    mebxPassword: 'P@ssw0rd',
    amtPassword: 'P@ssw0rd'
  }
  const amtConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'ccmactivate',
    amtPassword: 'P@ssw0rd',
    ciraConfigName: undefined,
    generateRandomMEBxPassword: false,
    generateRandomPassword: undefined,
    mebxPassword: null,
    mebxPasswordLength: null,
    networkConfigName: undefined,
    passwordLength: undefined
  }
  const result: AMTConfiguration = getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(amtConfig)
})
