/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { DbCreatorFactory } from './DbCreatorFactory'
import { IDbCreator } from '../interfaces/IDbCreator'
import { EnvReader } from '../../utils/EnvReader'
import { IDomainsDb } from '../interfaces/IDomainsDb'
import { DomainsDb } from '../domains'

export interface IDomainsDbFactory {
  dbCreator: IDbCreator
  dbCreatorFactory: DbCreatorFactory
  domainsDb: IDomainsDb
  getDomainsDb: () => IDomainsDb
}

const DomainsDbFactory: IDomainsDbFactory = {
  dbCreator: null,
  dbCreatorFactory: null,
  domainsDb: null,
  getDomainsDb (): IDomainsDb {
    if (DomainsDbFactory.domainsDb == null) {
      DomainsDbFactory.dbCreatorFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
      DomainsDbFactory.dbCreator = DomainsDbFactory.dbCreatorFactory.getDbCreator()
      DomainsDbFactory.domainsDb = new DomainsDb(DomainsDbFactory.dbCreator)
    }

    return DomainsDbFactory.domainsDb
  }
}
export { DomainsDbFactory }
