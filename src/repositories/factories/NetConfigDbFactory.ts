/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { DbCreatorFactory } from './DbCreatorFactory'
import { IDbCreator } from '.././interfaces/IDbCreator'
import { INetProfilesDb } from '../interfaces/INetProfilesDb'
import { NetConfigDb } from '../netProfiles'
import { EnvReader } from '../../utils/EnvReader'

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
      NetConfigDbFactory.netConfigsDb = new NetConfigDb(NetConfigDbFactory.dbCreator)
    }

    return NetConfigDbFactory.netConfigsDb
  }
}
export { NetConfigDbFactory }
