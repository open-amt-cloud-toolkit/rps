/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { DbCreatorFactory } from "./PostgresDbCreator";
import { IDbCreator } from "./interfaces/IDbCreator";
import { IProfilesDb } from "./interfaces/IProfilesDb";
import { ProfilesDb } from "./profiles";
import { EnvReader } from "../utils/EnvReader";
import { AMTConfigDb } from "../AMTConfigDb";
import Logger from "../Logger";


export class ProfilesDbFactory {
  static dbCreator: IDbCreator = null;
  static dbCreatorFactory: DbCreatorFactory;
  static profilesDb: IProfilesDb;

  static getProfilesDb(): IProfilesDb {
    if (ProfilesDbFactory.profilesDb == null) {
      if (EnvReader.GlobalEnvConfig.DbConfig.useDbForConfig) {
        ProfilesDbFactory.dbCreatorFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig);
        ProfilesDbFactory.dbCreator = ProfilesDbFactory.dbCreatorFactory.getDbCreator();
        ProfilesDbFactory.profilesDb = new ProfilesDb(ProfilesDbFactory.dbCreator);
      } else {
        ProfilesDbFactory.profilesDb = new AMTConfigDb(EnvReader.GlobalEnvConfig, Logger("AMTConfigDb"));
      }
    }

    return ProfilesDbFactory.profilesDb;
  }
}