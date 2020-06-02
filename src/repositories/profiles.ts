/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDbCreator } from "./interfaces/IDbCreator";
import { IProfilesDb } from "./interfaces/IProfilesDb";
import { AMTConfig } from "../RCS.Config";
import { mapToProfile } from "./mapToProfile";

export class ProfilesDb implements IProfilesDb {
  db:any;
  constructor(dbCreator: IDbCreator) {
    this.db = dbCreator.getDb();
  }

  async getAllProfiles(): Promise<AMTConfig[]> {
    let results = await this.db.query('SELECT profile_name as ProfileName, activation as Activation, amt_password as AMTPassword, generate_random_password as GenerateRandomPassword, configuration_script as ConfigurationScript, random_password_length as RandomPasswordLength FROM profiles');
    
    return results.rows.map(p => mapToProfile(p));
  }

  async getProfileByName(profileName): Promise<AMTConfig> {
    let results = await this.db.query('SELECT profile_name as ProfileName, activation as Activation, amt_password as AMTPassword, generate_random_password as GenerateRandomPassword, configuration_script as ConfigurationScript, random_password_length as RandomPasswordLength FROM profiles WHERE profile_name = $1', [profileName])
    return (results.rowCount > 0 ? mapToProfile(results.rows[0]) : null);
  }

  async deleteProfileByName(profileName): Promise<any> {
    let results = await this.db.query('DELETE FROM profiles WHERE profile_name = $1', [profileName])
    return (results.rowCount > 0 ? results.rowCount : null);
  }

  async insertProfile(amtConfig): Promise<any> {
    try {
      let results = await this.db.query('INSERT INTO profiles(profile_name, activation, amt_password, configuration_script, generate_random_password, random_password_characters, random_password_length) ' +
        'values($1, $2, $3, $4, $5, $6, $7)',
        [
          amtConfig.ProfileName,
          amtConfig.Activation,
          amtConfig.AMTPassword,
          amtConfig.ConfigurationScript,
          amtConfig.GenerateRandomPassword,
          amtConfig.RandomPasswordCharacters,
          amtConfig.RandomPasswordLength
        ]);

      if (results.rowCount > 0)
        return results.rowCount;
      return null;
    } catch (error) {
        console.log(error)
        if(error.code == '23505') // Unique key violation
          throw ("Duplicate profile. Profile already exists.")
        
        throw ("Unknown Error. Check Server Logs.")
    }

  }
}