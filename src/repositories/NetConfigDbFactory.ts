/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { DbCreatorFactory } from './DbCreatorFactory'
import { IDbCreator } from './interfaces/IDbCreator'
import { INetProfilesDb } from './interfaces/INetProfilesDb'
import { NetConfigDb } from './netProfiles'
import { EnvReader } from '../utils/EnvReader'
// import { CiraConfigFileStorageDb } from "../AMTConfigDb";
import Logger from '../Logger'
import { NetConfigFileStorageDb } from '../NetConfigFileStorageDb'

export interface INetConfigDbFactory {
  dbCreator: IDbCreator
  dbCreatorFactory: DbCreatorFactory
  netConfigsDb: INetProfilesDb
  getConfigDb: () => INetProfilesDb
}

const NetConfigDbFactory: INetConfigDbFactory = {
  dbCreator: null,
  dbCreatorFactory: null,
  netConfigsDb: null,
  getConfigDb (): INetProfilesDb {
    if (NetConfigDbFactory.netConfigsDb == null) {
      NetConfigDbFactory.dbCreatorFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
      NetConfigDbFactory.dbCreator = NetConfigDbFactory.dbCreatorFactory.getDbCreator()
      NetConfigDbFactory.netConfigsDb = EnvReader.GlobalEnvConfig.DbConfig.useDbForConfig
        ? new NetConfigDb(NetConfigDbFactory.dbCreator)
        : new NetConfigFileStorageDb(NetConfigDbFactory.dbCreator.getDb().AMTConfigurations,
          NetConfigDbFactory.dbCreator.getDb().NETConfigurations,
          new Logger('NETConfigFileStorageDb'))
    }

    return NetConfigDbFactory.netConfigsDb
  }
}
export { NetConfigDbFactory }
