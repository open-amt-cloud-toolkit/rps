/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Brian Osburn
 **********************************************************************/

import { IDomainCredentialManager } from './interfaces/IDomainCredentialManager'
import { IProfileManager } from './interfaces/IProfileManager'
import { IConfigurator } from './interfaces/IConfigurator'
import { DomainCredentialManager } from './DomainCredentialManager'
import { ProfileManager } from './ProfileManager'
import Logger from './Logger'
import { ISecretManagerService } from './interfaces/ISecretManagerService'
import { IAMTDeviceRepository } from './interfaces/database/IAMTDeviceRepository'
import { SecretManagerService } from './utils/SecretManagerService'
import { AmtDeviceFactory } from './repositories/factories/AmtDeviceFactory'
import { EnvReader } from './utils/EnvReader'
import { NodeForge } from './NodeForge'
import { IClientManager } from './interfaces/IClientManager'
import { ClientManager } from './ClientManager'
import { ClientResponseMsg } from './utils/ClientResponseMsg'
import { IValidator } from './interfaces/IValidator'
import { Validator } from './Validator'
import { WSManProcessor } from './WSManProcessor'
import { CertManager } from './CertManager'
import { SignatureHelper } from './utils/SignatureHelper'
import { DataProcessor } from './DataProcessor'
import { DbCreatorFactory } from './repositories/factories/DbCreatorFactory'

export class Configurator implements IConfigurator {
  amtDeviceRepository: IAMTDeviceRepository
  domainCredentialManager: IDomainCredentialManager
  profileManager: IProfileManager
  readonly secretsManager: ISecretManagerService
  readonly dataProcessor: DataProcessor
  readonly clientManager: IClientManager

  constructor () {
    const log = new Logger('Configurator')
    this.secretsManager = new SecretManagerService(new Logger('SecretManagerService'))
    const nodeForge = new NodeForge()
    this.clientManager = ClientManager.getInstance(new Logger('ClientManager'))
    const responseMsg: ClientResponseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
    const validator: IValidator = new Validator(new Logger('Validator'), this, this.clientManager)
    const amtwsman: WSManProcessor = new WSManProcessor(new Logger('WSManProcessor'), this.clientManager, responseMsg)
    const certManager = new CertManager(new Logger('CertManager'), nodeForge)
    const helper = new SignatureHelper(nodeForge)

    this.dataProcessor = new DataProcessor(new Logger('DataProcessor'), helper, this, validator, certManager, this.clientManager, responseMsg, amtwsman)
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
