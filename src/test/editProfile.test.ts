import { AMTConfiguration } from '../models/Rcs'
import {
  handleAMTPassword,
  handleMEBxPassword,
  handleGenerateRandomPassword,
  handleGenerateRandomMEBxPassword,
  getUpdatedData
} from '../routes/admin/profiles/editProfile'

test('test handleAMTpassword when the request body amtPassword is null or undefined', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', amtPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    amtPassword: 'P@ssw0rd',
    generateRandomPassword: false,
    tenantId: ''
  }
  const result: AMTConfiguration = handleAMTPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleAMTpassword when the request body amtPassword is not null', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', amtPassword: 'Intel@123', tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', amtPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    amtPassword: 'Intel@123',
    tenantId: ''
  }
  const result: AMTConfiguration = handleAMTPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleMEBxPassword when the request body mebxPassword is null or undefined', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', mebxPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    mebxPassword: 'P@ssw0rd',
    generateRandomMEBxPassword: false,
    tenantId: ''
  }
  const result: AMTConfiguration = handleMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleMEBxPassword when the request body mebxPassword is not null', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', mebxPassword: 'Intel@123', tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', mebxPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    mebxPassword: 'Intel@123',
    tenantId: ''
  }
  const result: AMTConfiguration = handleMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomPassword when the request body generateRandomPassword is true', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomPassword: true, tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', amtPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    generateRandomPassword: true,
    amtPassword: null,
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomPassword when passwordLength is updated', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomPassword: true, tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomPassword: true, tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    generateRandomPassword: true,
    amtPassword: null,
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomPassword when the request body generateRandomPassword is undefined and profile created with amtPassword', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', amtPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const expected: AMTConfiguration = {
    activation: 'acmactivate',
    generateRandomPassword: undefined,
    profileName: 'acm',
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomPassword when the request body generateRandomPassword is undefined and profile created with random amtPassword', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomPassword: true, tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const expected: AMTConfiguration = {
    activation: 'acmactivate',
    generateRandomPassword: true,
    profileName: 'acm',
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomMEBxPassword when the request body generateRandomMEBxPassword is true', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomMEBxPassword: true, tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', mebxPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    generateRandomMEBxPassword: true,
    mebxPassword: null,
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomMEBxPassword when mebxPasswordLength is updated', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomMEBxPassword: true, tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomMEBxPassword: true, tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const expected: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    generateRandomMEBxPassword: true,
    mebxPassword: null,
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test handleGenerateRandomMEBxPassword when the request body generateRandomMEBxPassword is undefined and profile created with mebxPassword', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', mebxPassword: 'P@ssw0rd', tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const expected: AMTConfiguration = {
    activation: 'acmactivate',
    generateRandomMEBxPassword: undefined,
    profileName: 'acm',
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test getUpdatedData when the request body when activation changed', () => {
  const newConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const oldConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', generateRandomMEBxPassword: true, tenantId: '' }
  const amtConfig: AMTConfiguration = { profileName: 'acm', activation: 'acmactivate', tenantId: '' }
  const expected: AMTConfiguration = {
    activation: 'acmactivate',
    generateRandomMEBxPassword: true,
    profileName: 'acm',
    tenantId: ''
  }
  const result: AMTConfiguration = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  expect(result).toEqual(expected)
})

test('test getUpdatedData when static passwords are changed to random', async () => {
  const newConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    generateRandomMEBxPassword: true,
    generateRandomPassword: true,
    tenantId: ''
  }
  const oldConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    mebxPassword: 'P@ssw0rd',
    amtPassword: 'P@ssw0rd',
    tenantId: ''
  }
  const amtConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    amtPassword: null,
    ciraConfigName: undefined,
    generateRandomMEBxPassword: true,
    generateRandomPassword: true,
    mebxPassword: null,
    tenantId: ''
  }
  const result: AMTConfiguration = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(amtConfig)
})

test('test getUpdatedData when random passwords are changed to static', async () => {
  const newConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    mebxPassword: 'P@ssw0rd',
    amtPassword: 'P@ssw0rd',
    tenantId: ''
  }
  const oldConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    generateRandomMEBxPassword: true,
    generateRandomPassword: true,
    tenantId: ''
  }
  const amtConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    amtPassword: 'P@ssw0rd',
    ciraConfigName: undefined,
    generateRandomMEBxPassword: false,
    generateRandomPassword: false,
    mebxPassword: 'P@ssw0rd',
    tenantId: '',
    tags: undefined
  }
  const result: AMTConfiguration = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(amtConfig)
})

test('test getUpdatedData when activation messaged changed from acmactivate to ccmactivate', async () => {
  const newConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'ccmactivate',
    tenantId: ''
  }
  const oldConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'acmactivate',
    mebxPassword: 'P@ssw0rd',
    amtPassword: 'P@ssw0rd',
    tenantId: ''
  }
  const amtConfig: AMTConfiguration = {
    profileName: 'acm',
    activation: 'ccmactivate',
    amtPassword: 'P@ssw0rd',
    ciraConfigName: undefined,
    dhcpEnabled: undefined,
    generateRandomMEBxPassword: false,
    generateRandomPassword: undefined,
    mebxPassword: null,
    tags: undefined,
    tenantId: ''
  }
  const result: AMTConfiguration = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(amtConfig)
})
