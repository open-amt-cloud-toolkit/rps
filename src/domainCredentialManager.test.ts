/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { DomainCredentialManager } from './DomainCredentialManager'
import { type ILogger } from './interfaces/ILogger'
import Logger from './Logger'
import { type AMTDomain } from './models'
import { DomainsTable } from './data/postgres/tables/domains'
import type Db from './data/postgres'
import { type Configurator } from './Configurator'

const logger: ILogger = new Logger('DomainCredentialManagerTests')
describe('Domain Credential Manager Tests', () => {
  let creator: Db
  let domainCredentialManager: DomainCredentialManager
  beforeEach(() => {
    creator = {
      query: (query) => {
        if (query.indexOf('SELECT') >= 0) {
          return {
            rowCount: 1,
            rows: [{
              name: '',
              domainSuffix: 'd2.com',
              provisioningCert: ' ',
              provisioningCertStorageFormat: '',
              provisioningCertPassword: ''
            }]
          }
        }
      }
    } as any
    domainCredentialManager = new DomainCredentialManager(logger,
      new DomainsTable(creator), {
        secretsManager: {
          getSecretAtPath: jest.fn().mockResolvedValue({ CERT: 'd2.pfx', CERT_PASSWORD: 'password' })
        } as any
      } as Configurator)
  })
  test('retrieve provisioning cert based on domain', async () => {
    const expectedProvisioningCert: string = 'd2.pfx'
    const domain: AMTDomain = await domainCredentialManager.getProvisioningCert('d2.com', '')
    expect(domain.provisioningCert).toEqual(expectedProvisioningCert)
    expect(domain.provisioningCertPassword).toEqual('password')
  })
  test('does domain exist should return true', async () => {
    const result = await domainCredentialManager.doesDomainExist('d2.com', '')
    expect(result).toBeTruthy()
  })
})
