/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { IDomainCredentialManager } from './interfaces/IDomainCredentialManager'
import { IProfileManager } from './interfaces/IProfileManager'
import { DomainCredentialManager } from './DomainCredentialManager'
import { ProfileManager } from './ProfileManager'
import Logger from './Logger'
import { ISecretManagerService } from './interfaces/ISecretManagerService'
import { IAMTDeviceRepository } from './interfaces/database/IAMTDeviceRepository'
import { SecretManagerService } from './utils/SecretManagerService'
import { AmtDeviceFactory } from './repositories/factories/AmtDeviceFactory'
import { EnvReader } from './utils/EnvReader'
import { IValidator } from './interfaces/IValidator'
import { Validator } from './Validator'
import { DataProcessor } from './DataProcessor'
import { DbCreatorFactory } from './repositories/factories/DbCreatorFactory'

export class Configurator {
  amtDeviceRepository: IAMTDeviceRepository
  domainCredentialManager: IDomainCredentialManager
  profileManager: IProfileManager
  readonly secretsManager: ISecretManagerService
  readonly dataProcessor: DataProcessor

  constructor () {
    const log = new Logger('Configurator')
    this.secretsManager = new SecretManagerService(new Logger('SecretManagerService'))
    const validator: IValidator = new Validator(new Logger('Validator'), this)

    this.dataProcessor = new DataProcessor(new Logger('DataProcessor'), validator)
    const dbf = new DbCreatorFactory(EnvReader.GlobalEnvConfig)

    this.amtDeviceRepository = AmtDeviceFactory.getAmtDeviceRepository(this)
    dbf.getDb().then((db) => {
      this.domainCredentialManager = new DomainCredentialManager(new Logger('DomainCredentialManager'), db.domains, this)
      this.profileManager = new ProfileManager(new Logger('ProfileManager'), this, db.profiles, EnvReader.GlobalEnvConfig)
    }).catch((err) => {
      log.error(err)
      throw new Error('Unable to get db configuration')
    })
  }
}
