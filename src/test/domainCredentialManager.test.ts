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
import { AMTDomain } from '../models/Rcs'

const logger: ILogger = new Logger('DomainCredentialManagerTests')

const data = JSON.parse(readFileSync(join(__dirname, 'private', 'data.json'), 'utf8'))
EnvReader.configPath = join(__dirname, 'private', 'data.json')
test('retrieve provisioning cert based on domain', async () => {
  const domainCredentialManager: DomainCredentialManager = new DomainCredentialManager(logger, new DomainConfigDb(data.AMTDomains, new Logger('DomainConfigDb')))

  const expectedProvisioningCert: string = 'd2.pfx'
  const domain: AMTDomain = await domainCredentialManager.getProvisioningCert('d2.com')
  expect(domain.provisioningCert).toEqual(expectedProvisioningCert)
})
