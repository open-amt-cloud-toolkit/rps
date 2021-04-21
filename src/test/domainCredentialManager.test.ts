/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Brian Osburn
 **********************************************************************/

import { DomainCredentialManager } from '../DomainCredentialManager'
import { ILogger } from '../interfaces/ILogger'
import Logger from '../Logger'
import { AMTDomain } from '../models/Rcs'
import { DomainsDb } from '../repositories/domains'
import { IDbCreator } from '../repositories/interfaces/IDbCreator'

const logger: ILogger = new Logger('DomainCredentialManagerTests')
describe('Domain Credential Manager Tests', () => {
  let creator: IDbCreator

  beforeEach(() => {
    creator = {
      getDb: function () {
        return {
          query: (query) => {
            if (query.indexOf('SELECT') >= 0) {
              return {
                rowCount: 1,
                rows: [{
                  name: '',
                  domainsuffix: 'd2.com',
                  provisioningcert: 'd2.pfx',
                  provisioningcertstorageformat: '',
                  provisioningcertpassword: ''
                }]
              }
            }
          }
        }
      }
    }
  })
  test('retrieve provisioning cert based on domain', async () => {
    const domainCredentialManager: DomainCredentialManager = new DomainCredentialManager(logger, new DomainsDb(creator))

    const expectedProvisioningCert: string = 'd2.pfx'
    const domain: AMTDomain = await domainCredentialManager.getProvisioningCert('d2.com')
    expect(domain.provisioningCert).toEqual(expectedProvisioningCert)
  })
})
