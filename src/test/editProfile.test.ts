import { AMTConfiguration } from '../models/Rcs'
import { getUpdatedData } from '../routes/admin/profiles/editProfile'

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
    mebxPassword: null,
    tenantId: ''
  }
  const result: AMTConfiguration = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(amtConfig)
})
