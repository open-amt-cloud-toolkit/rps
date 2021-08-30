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
import { ProfilesDbFactory } from './repositories/factories/ProfilesDbFactory'
import { DomainsDbFactory } from './repositories/factories/DomainsDbFactory'
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
import { IDataProcessor } from './interfaces/IDataProcessor'

export class Configurator implements IConfigurator {
  private readonly _amtDeviceRepository: IAMTDeviceRepository
  get amtDeviceRepository (): IAMTDeviceRepository {
    return this._amtDeviceRepository
  }

  private readonly _domainCredentialManager: IDomainCredentialManager
  get domainCredentialManager (): IDomainCredentialManager {
    return this._domainCredentialManager
  }

  private readonly _profileManager: IProfileManager
  get profileManager (): IProfileManager {
    return this._profileManager
  }

  private readonly _secretManager: ISecretManagerService
  get secretsManager (): ISecretManagerService {
    return this._secretManager
  }

  private readonly _dataProcessor: DataProcessor
  get dataProcessor (): IDataProcessor {
    return this._dataProcessor
  }

  private readonly _clientManager: IClientManager
  get clientManager (): IClientManager {
    return this._clientManager
  }

  constructor () {
    this._secretManager = new SecretManagerService(new Logger('SecretManagerService'))
    const nodeForge = new NodeForge()
    this._clientManager = ClientManager.getInstance(new Logger('ClientManager'))
    const responseMsg: ClientResponseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'), nodeForge)
    const validator: IValidator = new Validator(new Logger('Validator'), this, this._clientManager, nodeForge)
    const amtwsman: WSManProcessor = new WSManProcessor(new Logger('WSManProcessor'), this._clientManager, responseMsg)
    const certManager = new CertManager(nodeForge)
    const helper = new SignatureHelper(nodeForge)

    this._dataProcessor = new DataProcessor(new Logger('DataProcessor'), helper, this, validator, certManager, this._clientManager, responseMsg, amtwsman)

    this._amtDeviceRepository = AmtDeviceFactory.getAmtDeviceRepository(this)
    this._domainCredentialManager = new DomainCredentialManager(new Logger('DomainCredentialManager'), DomainsDbFactory.getDomainsDb(), this)
    this._profileManager = new ProfileManager(new Logger('ProfileManager'), this, ProfilesDbFactory.getProfilesDb(), EnvReader.GlobalEnvConfig)
  }
}
