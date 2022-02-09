/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Brian Osburn
 **********************************************************************/

import { DomainCredentialManager } from './DomainCredentialManager'
import { ILogger } from './interfaces/ILogger'
import Logger from './Logger'
import { AMTDomain } from './models'
import { DomainsTable } from './data/postgres/tables/domains'
import Db from './data/postgres'

const logger: ILogger = new Logger('DomainCredentialManagerTests')
describe('Domain Credential Manager Tests', () => {
  let creator: Db

  beforeEach(() => {
    creator = {
      query: (query) => {
        if (query.indexOf('SELECT') >= 0) {
          return {
            rowCount: 1,
            rows: [{
              name: '',
              domainSuffix: 'd2.com',
              provisioningCert: 'd2.pfx',
              provisioningCertstorageFormat: '',
              provisioningCertPassword: ''
            }]
          }
        }
      }
    } as any
  })
  test('retrieve provisioning cert based on domain', async () => {
    const domainCredentialManager: DomainCredentialManager = new DomainCredentialManager(logger, new DomainsTable(creator))

    const expectedProvisioningCert: string = 'd2.pfx'
    const domain: AMTDomain = await domainCredentialManager.getProvisioningCert('d2.com')
    expect(domain.provisioningCert).toEqual(expectedProvisioningCert)
  })
})
