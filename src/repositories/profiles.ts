/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDbCreator } from "./interfaces/IDbCreator";
import { IProfilesDb } from "./interfaces/IProfilesDb";
import { AMTConfig, CIRAConfig } from "../RCS.Config";
import { mapToProfile } from "./mapToProfile";
import { AMTConfiguration } from "../models/Rcs";
import { mapToCiraConfig } from "./mapToCiraConfig";
import { CiraConfigDb } from "./ciraConfigs";
import { PROFILE_SUCCESSFULLY_DELETED, PROFILE_INSERTION_FAILED_DUPLICATE, PROFILE_INSERTION_CIRA_CONSTRAINT } from "../utils/constants";

export class ProfilesDb implements IProfilesDb {
  db:any;
  ciraConfigs: CiraConfigDb;
  constructor(dbCreator: IDbCreator) {
    this.db = dbCreator.getDb();
    this.ciraConfigs = new CiraConfigDb(dbCreator)
  }

  async getAllProfiles(mapperFn?: (profileName, data) => any): Promise<AMTConfig[]> {
    let results = await this.db.query('SELECT profile_name as ProfileName, activation as Activation, amt_password as AMTPassword, generate_random_password as GenerateRandomPassword, configuration_script as ConfigurationScript, cira_config_name as ciraConfigName, random_password_length as RandomPasswordLength FROM profiles');
    
    return Promise.all(results.rows.map( async p => {
      let result = mapToProfile(p);
      if (result.GenerateRandomPassword === false && mapperFn)
        result.AMTPassword = await mapperFn(result.ProfileName, result.AMTPassword);
      return result;
    }));
  }

  async getProfileByName(profileName): Promise<AMTConfig> {
    let results = await this.db.query('SELECT profile_name as ProfileName, activation as Activation, amt_password as AMTPassword, generate_random_password as GenerateRandomPassword, configuration_script as ConfigurationScript, cira_config_name as ciraConfigName, random_password_length as RandomPasswordLength FROM profiles WHERE profile_name = $1', [profileName])
    return (results.rowCount > 0 ? mapToProfile(results.rows[0]) : null);
  }

  async getCiraConfigForProfile(configName): Promise<CIRAConfig> {
      return await this.ciraConfigs.getCiraConfigByName(configName); 
  }

  async deleteProfileByName(profileName): Promise<any> {
    let results = await this.db.query('DELETE FROM profiles WHERE profile_name = $1', [profileName])
    return (results.rowCount > 0 ? PROFILE_SUCCESSFULLY_DELETED(profileName) : null);
  }

  async insertProfile(amtConfig: AMTConfiguration): Promise<any> {
    try {
      let results = await this.db.query('INSERT INTO profiles(profile_name, activation, amt_password, configuration_script, cira_config_name, generate_random_password, random_password_characters, random_password_length) ' +
        'values($1, $2, $3, $4, $5, $6, $7, $8)',
        [
          amtConfig.ProfileName,
          amtConfig.Activation,
          amtConfig.AMTPassword,
          amtConfig.ConfigurationScript,
          amtConfig.CIRAConfigName,
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
          throw (PROFILE_INSERTION_FAILED_DUPLICATE(amtConfig.ProfileName))
        if(error.code == '23503') // Unique key violation
          throw (PROFILE_INSERTION_CIRA_CONSTRAINT(amtConfig.CIRAConfigName))
        
        throw ("Unknown Error. Check Server Logs.")
    }

  }
}