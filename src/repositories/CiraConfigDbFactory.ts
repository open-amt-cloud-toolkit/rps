/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { DbCreatorFactory } from './DbCreatorFactory'
import { IDbCreator } from './interfaces/IDbCreator'
import { ICiraConfigDb } from './interfaces/ICiraConfigDb'
import { CiraConfigDb } from './ciraConfigs'
import { EnvReader } from '../utils/EnvReader'
// import { CiraConfigFileStorageDb } from "../AMTConfigDb";
import Logger from '../Logger'
import { CiraConfigFileStorageDb } from '../CiraConfigFileStorageDb'

export class CiraConfigDbFactory {
  static dbCreator: IDbCreator = null;
  static dbCreatorFactory: DbCreatorFactory;
  static ciraConfigsDb: ICiraConfigDb;

  static getCiraConfigDb (): ICiraConfigDb {
    if (CiraConfigDbFactory.ciraConfigsDb == null) {
      CiraConfigDbFactory.dbCreatorFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
      CiraConfigDbFactory.dbCreator = CiraConfigDbFactory.dbCreatorFactory.getDbCreator()
      CiraConfigDbFactory.ciraConfigsDb = EnvReader.GlobalEnvConfig.DbConfig.useDbForConfig
        ? new CiraConfigDb(CiraConfigDbFactory.dbCreator)
        : new CiraConfigFileStorageDb(CiraConfigDbFactory.dbCreator.getDb().AMTConfigurations,
          CiraConfigDbFactory.dbCreator.getDb().CIRAConfigurations,
          new Logger('CIRAFileStorageDb'))
    }

    return CiraConfigDbFactory.ciraConfigsDb
  }
}
