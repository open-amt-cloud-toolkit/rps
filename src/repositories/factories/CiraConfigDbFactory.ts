/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { DbCreatorFactory } from './DbCreatorFactory'
import { IDbCreator } from '../interfaces/IDbCreator'
import { ICiraConfigDb } from '../interfaces/ICiraConfigDb'
import { CiraConfigDb } from '../ciraConfigs'
import { EnvReader } from '../../utils/EnvReader'

export interface ICiraConfigDbFactory {
  dbCreator: IDbCreator
  dbCreatorFactory: DbCreatorFactory
  ciraConfigsDb: ICiraConfigDb
  getCiraConfigDb: () => ICiraConfigDb
}

const CiraConfigDbFactory: ICiraConfigDbFactory = {
  dbCreator: null,
  dbCreatorFactory: null,
  ciraConfigsDb: null,
  getCiraConfigDb (): ICiraConfigDb {
    if (CiraConfigDbFactory.ciraConfigsDb == null) {
      CiraConfigDbFactory.dbCreatorFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
      CiraConfigDbFactory.dbCreator = CiraConfigDbFactory.dbCreatorFactory.getDbCreator()
      CiraConfigDbFactory.ciraConfigsDb = new CiraConfigDb(CiraConfigDbFactory.dbCreator)
    }

    return CiraConfigDbFactory.ciraConfigsDb
  }
}

export { CiraConfigDbFactory }
