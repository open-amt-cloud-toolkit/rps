/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { DbCreatorFactory } from './DbCreatorFactory'
import { IDbCreator } from '../interfaces/IDbCreator'
import { IProfilesDb } from '../interfaces/IProfilesDb'
import { ProfilesDb } from '../profiles'
import { EnvReader } from '../../utils/EnvReader'

export interface IProfilesDbFactory {
  dbCreator: IDbCreator
  dbCreatorFactory: DbCreatorFactory
  profilesDb: IProfilesDb
  getProfilesDb: () => IProfilesDb
}
const ProfilesDbFactory: IProfilesDbFactory = {
  dbCreator: null,
  dbCreatorFactory: null,
  profilesDb: null,
  getProfilesDb: (): IProfilesDb => {
    if (ProfilesDbFactory.profilesDb == null) {
      ProfilesDbFactory.dbCreatorFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
      ProfilesDbFactory.dbCreator = ProfilesDbFactory.dbCreatorFactory.getDbCreator()
      ProfilesDbFactory.profilesDb = new ProfilesDb(ProfilesDbFactory.dbCreator)
    }

    return ProfilesDbFactory.profilesDb
  }
}

export { ProfilesDbFactory }
