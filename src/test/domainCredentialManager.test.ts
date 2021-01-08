/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Brian Osburn
 **********************************************************************/

import { DomainCredentialManager } from '../DomainCredentialManager'
import { ILogger } from '../interfaces/ILogger'
import Logger from '../Logger'
import { DomainConfigDb } from '../DomainConfigDb'
import { readFileSync } from 'fs'
import { join } from 'path'
import { EnvReader } from '../utils/EnvReader'

const logger: ILogger = new Logger('DomainCredentialManagerTests')

const data = JSON.parse(readFileSync(join(__dirname, 'private', 'data.json'), 'utf8'))
EnvReader.configPath = join(__dirname, 'private', 'data.json')
test('retrieve provisioning cert based on domain', async () => {
  // let domainCredentialManager: DomainCredentialManager = new DomainCredentialManager(logger, rcsConfig.AMTDomains, new SecretManagerService(logger));
  const domainCredentialManager: DomainCredentialManager = new DomainCredentialManager(logger, new DomainConfigDb(data.AMTDomains, new Logger('DomainConfigDb')))

  const expectedProvisioningCert: string = 'd2.pfx'
  const actualProvisioningCert: string = await domainCredentialManager.getProvisioningCert('d2.com')
  // let actualProvisioningCertPassword: string = await domainCredentialManager.getProvisioningCertPassword('d2.com');
  expect(actualProvisioningCert).toEqual(expectedProvisioningCert)
  // expect(actualProvisioningCertPassword).toEqual('P@ssw0rd');
})

test('retrieve cert password based on domain', async () => {
  const domainCredentialManager: DomainCredentialManager = new DomainCredentialManager(logger, new DomainConfigDb(data.AMTDomains, new Logger('DomainConfigDb')))

  const expectedProvisioningCert: string = 'PROVISIONING_CERT_PASSWORD_KEY'
  const actualProvisioningCert: string = await domainCredentialManager.getProvisioningCertPassword('d1.net')
  expect(expectedProvisioningCert).toEqual(actualProvisioningCert)
})

test('retrieve cert password based on domain from an unknown domain', async () => {
  const domainCredentialManager: DomainCredentialManager = new DomainCredentialManager(logger, new DomainConfigDb(data.AMTDomains, new Logger('DomainConfigDb')))

  const actualProvisioningCert = await domainCredentialManager.getProvisioningCertPassword('d1.com')
  expect(actualProvisioningCert).toBeNull()
})
