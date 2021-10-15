import { TlsConfigs } from '../models/RCS.Config'
import {
  getUpdatedData
} from '../routes/admin/tls/editTlsConfig'

test('test getUpdatedData with all values changed', async () => {
  const oldConfig: TlsConfigs = {
    configName: 'configName_old',
    commonName: 'commonName_old',
    issuedCommonName: 'issuedCommonName_old',
    organization: 'organization_old',
    stateOrProvince: 'stateOrProvince_old',
    country: 'country_old',
    isTrustedCert: true,
    tlsMode: 2,
    tenantId: 'tenantId_old'
  }

  const newConfig: TlsConfigs = {
    configName: 'configName_new',
    commonName: 'commonName_new',
    issuedCommonName: 'issuedCommonName_new',
    organization: 'organization_new',
    stateOrProvince: 'stateOrProvince_new',
    country: 'country_new',
    isTrustedCert: false,
    tlsMode: 3,
    tenantId: 'tenantId_new'
  }

  const expectedConfig: TlsConfigs = {
    configName: 'configName_old',
    commonName: 'commonName_old',
    issuedCommonName: 'issuedCommonName_old',
    organization: 'organization_old',
    stateOrProvince: 'stateOrProvince_old',
    country: 'country_old',
    isTrustedCert: false,
    tlsMode: 3,
    tenantId: 'tenantId_new'
  }
  const result: TlsConfigs = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(expectedConfig)
})

test('test getUpdatedData with isTrustedCert value changed', async () => {
  const oldConfig: TlsConfigs = {
    configName: 'tls_old',
    commonName: 'root_old',
    issuedCommonName: 'issuedCommonName_old',
    organization: 'organization_old',
    stateOrProvince: 'stateOrProvince_old',
    country: 'country_old',
    isTrustedCert: true,
    tlsMode: 2,
    tenantId: 'tenantId_old'
  }

  const newConfig: TlsConfigs = {
    configName: 'configName_new',
    commonName: 'commonName_new',
    issuedCommonName: 'issuedCommonName_new',
    organization: 'organization_new',
    stateOrProvince: 'stateOrProvince_new',
    country: 'country_new',
    isTrustedCert: false,
    tlsMode: 2,
    tenantId: 'tenantId_old'
  }

  const expectedConfig: TlsConfigs = {
    configName: 'tls_old',
    commonName: 'root_old',
    issuedCommonName: 'issuedCommonName_old',
    organization: 'organization_old',
    stateOrProvince: 'stateOrProvince_old',
    country: 'country_old',
    isTrustedCert: false,
    tlsMode: 2,
    tenantId: 'tenantId_old'
  }
  const result: TlsConfigs = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(expectedConfig)
})

test('test getUpdatedData with tlsMode value changed', async () => {
  const oldConfig: TlsConfigs = {
    configName: 'configName_old',
    commonName: 'commonName_old',
    issuedCommonName: 'issuedCommonName_old',
    organization: 'organization_old',
    stateOrProvince: 'stateOrProvince_old',
    country: 'country_old',
    isTrustedCert: true,
    tlsMode: 2,
    tenantId: 'tenantId_old'
  }

  const newConfig: TlsConfigs = {
    configName: 'configName_new',
    commonName: 'commonName_new',
    issuedCommonName: 'issuedCommonName_new',
    organization: 'organization_new',
    stateOrProvince: 'stateOrProvince_new',
    country: 'country_new',
    isTrustedCert: true,
    tlsMode: 3,
    tenantId: 'tenantId_old'
  }

  const expectedConfig: TlsConfigs = {
    configName: 'configName_old',
    commonName: 'commonName_old',
    issuedCommonName: 'issuedCommonName_old',
    organization: 'organization_old',
    stateOrProvince: 'stateOrProvince_old',
    country: 'country_old',
    isTrustedCert: true,
    tlsMode: 3,
    tenantId: 'tenantId_old'
  }
  const result: TlsConfigs = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(expectedConfig)
})

test('test getUpdatedData with tenantId value changed', async () => {
  const oldConfig: TlsConfigs = {
    configName: 'configName_old',
    commonName: 'commonName_old',
    issuedCommonName: 'issuedCommonName_old',
    organization: 'organization_old',
    stateOrProvince: 'stateOrProvince_old',
    country: 'country_old',
    isTrustedCert: true,
    tlsMode: 2,
    tenantId: 'tenantId_old'
  }

  const newConfig: TlsConfigs = {
    configName: 'configName_new',
    commonName: 'commonName_new',
    issuedCommonName: 'issuedCommonName_new',
    organization: 'organization_new',
    stateOrProvince: 'stateOrProvince_new',
    country: 'country_new',
    isTrustedCert: true,
    tlsMode: 2,
    tenantId: 'tenantId_new'
  }

  const expectedConfig: TlsConfigs = {
    configName: 'configName_old',
    commonName: 'commonName_old',
    issuedCommonName: 'issuedCommonName_old',
    organization: 'organization_old',
    stateOrProvince: 'stateOrProvince_old',
    country: 'country_old',
    isTrustedCert: true,
    tlsMode: 2,
    tenantId: 'tenantId_new'
  }
  const result: TlsConfigs = await getUpdatedData(newConfig, oldConfig)
  expect(result).toEqual(expectedConfig)
})
