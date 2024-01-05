/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import type { IDomainCredentialManager } from './interfaces/IDomainCredentialManager'
import type { IProfileManager } from './interfaces/IProfileManager'
import { DomainCredentialManager } from './DomainCredentialManager'
import { ProfileManager } from './ProfileManager'
import Logger from './Logger'
import type { ISecretManagerService } from './interfaces/ISecretManagerService'
import { Environment } from './utils/Environment'
import type { IValidator } from './interfaces/IValidator'
import { Validator } from './Validator'
import { DataProcessor } from './DataProcessor'
import { DbCreatorFactory } from './factories/DbCreatorFactory'
import { SecretManagerCreatorFactory } from './factories/SecretManagerCreatorFactory'

export class Configurator {
  domainCredentialManager: IDomainCredentialManager
  profileManager: IProfileManager
  secretsManager: ISecretManagerService
  readonly dataProcessor: DataProcessor

  constructor () {
    const log = new Logger('Configurator')

    const validator: IValidator = new Validator(new Logger('Validator'), this)

    this.dataProcessor = new DataProcessor(new Logger('DataProcessor'), validator)

    const dbf = new DbCreatorFactory()
    const smcf = new SecretManagerCreatorFactory()

    smcf.getSecretManager(new Logger('SecretManagerService')).then((secretManager) => {
      this.secretsManager = secretManager
    }).catch((err) => {
      log.error(err as string)
      throw new Error('Unable to get secret manager configuration')
    })

    dbf.getDb().then((db) => {
      this.domainCredentialManager = new DomainCredentialManager(new Logger('DomainCredentialManager'), db.domains, this)
      this.profileManager = new ProfileManager(new Logger('ProfileManager'), this, db.profiles, Environment.Config)
    }).catch((err) => {
      log.error(err as string)
      throw new Error('Unable to get db configuration')
    })
  }
}
