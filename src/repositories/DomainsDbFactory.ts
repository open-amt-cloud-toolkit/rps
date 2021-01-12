/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { DbCreatorFactory } from './DbCreatorFactory'
import { IDbCreator } from './interfaces/IDbCreator'
import { EnvReader } from '../utils/EnvReader'
import { IDomainsDb } from './interfaces/IDomainsDb'
import { DomainsDb } from './domains'
import { DomainConfigDb } from '../DomainConfigDb'
import Logger from '../Logger'

export class DomainsDbFactory {
  static dbCreator: IDbCreator = null
  static dbCreatorFactory: DbCreatorFactory
  static domainsDb: IDomainsDb

  static getDomainsDb (): IDomainsDb {
    if (DomainsDbFactory.domainsDb == null) {
      DomainsDbFactory.dbCreatorFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
      DomainsDbFactory.dbCreator = DomainsDbFactory.dbCreatorFactory.getDbCreator()
      DomainsDbFactory.domainsDb = (EnvReader.GlobalEnvConfig.DbConfig.useDbForConfig
        ? new DomainsDb(DomainsDbFactory.dbCreator)
        : new DomainConfigDb(DomainsDbFactory.dbCreator.getDb().AMTDomains, new Logger('DomainConfigDb')))
    }

    return DomainsDbFactory.domainsDb
  }
}
