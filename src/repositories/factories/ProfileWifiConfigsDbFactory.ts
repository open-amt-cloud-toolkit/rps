/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { DbCreatorFactory } from './DbCreatorFactory'
import { IDbCreator } from '../../interfaces/database/IDbCreator'
import { EnvReader } from '../../utils/EnvReader'
import { IProfileWifiConfigsDb } from '../../interfaces/database/IProfileWifiConfigsDb'
import { ProfilesWifiConfigsDb } from '../profileWifiConfigs'

export interface IProfileWifiConfigsDbFactory {
  dbCreator: IDbCreator
  dbCreatorFactory: DbCreatorFactory
  ProfileWifiConfigsDb: IProfileWifiConfigsDb
  getProfileWifiConfigsDb: () => IProfileWifiConfigsDb
}

const ProfileWifiConfigsDbFactory: IProfileWifiConfigsDbFactory = {
  dbCreator: null,
  dbCreatorFactory: null,
  ProfileWifiConfigsDb: null,
  getProfileWifiConfigsDb (): IProfileWifiConfigsDb {
    if (ProfileWifiConfigsDbFactory.ProfileWifiConfigsDb == null) {
      ProfileWifiConfigsDbFactory.dbCreatorFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
      ProfileWifiConfigsDbFactory.dbCreator = ProfileWifiConfigsDbFactory.dbCreatorFactory.getDbCreator()
      ProfileWifiConfigsDbFactory.ProfileWifiConfigsDb = new ProfilesWifiConfigsDb(ProfileWifiConfigsDbFactory.dbCreator)
    }
    return ProfileWifiConfigsDbFactory.ProfileWifiConfigsDb
  }
}
export { ProfileWifiConfigsDbFactory }
