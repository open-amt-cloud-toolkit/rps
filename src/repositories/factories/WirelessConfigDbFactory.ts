/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { DbCreatorFactory } from './DbCreatorFactory'
import { IDbCreator } from '.././interfaces/IDbCreator'
import { IWirelessProfilesDb } from '../interfaces/IWirelessProfilesDB'
import { WirelessConfigDb } from '../wirelessProfiles'
import { EnvReader } from '../../utils/EnvReader'

export interface IWirelessConfigDbFactory {
  dbCreator: IDbCreator
  dbCreatorFactory: DbCreatorFactory
  wirelessConfigsDb: IWirelessProfilesDb
  getConfigDb: () => IWirelessProfilesDb
}

const WirelessConfigDbFactory: IWirelessConfigDbFactory = {
  dbCreator: null,
  dbCreatorFactory: null,
  wirelessConfigsDb: null,
  getConfigDb (): IWirelessProfilesDb {
    if (WirelessConfigDbFactory.wirelessConfigsDb == null) {
      WirelessConfigDbFactory.dbCreatorFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
      WirelessConfigDbFactory.dbCreator = WirelessConfigDbFactory.dbCreatorFactory.getDbCreator()
      WirelessConfigDbFactory.wirelessConfigsDb = new WirelessConfigDb(WirelessConfigDbFactory.dbCreator)
    }

    return WirelessConfigDbFactory.wirelessConfigsDb
  }
}
export { WirelessConfigDbFactory }
