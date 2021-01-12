/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { DbCreatorFactory } from './DbCreatorFactory'
import { IDbCreator } from './interfaces/IDbCreator'
import { IProfilesDb } from './interfaces/IProfilesDb'
import { ProfilesDb } from './profiles'
import { EnvReader } from '../utils/EnvReader'
import { AMTConfigDb } from '../AMTConfigDb'
import Logger from '../Logger'

export class ProfilesDbFactory {
  static dbCreator: IDbCreator = null;
  static dbCreatorFactory: DbCreatorFactory;
  static profilesDb: IProfilesDb;

  static getProfilesDb (): IProfilesDb {
    if (ProfilesDbFactory.profilesDb == null) {
      ProfilesDbFactory.dbCreatorFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
      ProfilesDbFactory.dbCreator = ProfilesDbFactory.dbCreatorFactory.getDbCreator()
      ProfilesDbFactory.profilesDb = (EnvReader.GlobalEnvConfig.DbConfig.useDbForConfig === true
        ? new ProfilesDb(ProfilesDbFactory.dbCreator)
        : new AMTConfigDb(ProfilesDbFactory.dbCreator.getDb().AMTConfigurations,
          ProfilesDbFactory.dbCreator.getDb().CIRAConfigurations,
          ProfilesDbFactory.dbCreator.getDb().NETConfigurations,
          new Logger('ProfilesConfigDb')))
    }

    return ProfilesDbFactory.profilesDb
  }
}
