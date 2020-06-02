/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IProfilesDb } from "../../../repositories/interfaces/IProfilesDb";
import { ProfilesDbFactory } from "../../../repositories/ProfilesDbFactory";
import { AMTConfig } from "../../../RCS.Config";
import { EnvReader } from "../../../utils/EnvReader";

export async function createProfile (req, res) {
  
  let profilesDb: IProfilesDb = null;
  try {
    const amtConfig: AMTConfig = readBody(req, res)

    // console.log("SecretsManagement", req.secretsManager);
    // if generateRandomPassword is false, insert the amtPassword into vault using a 
    // key and insert the modified profile into db.

    profilesDb = ProfilesDbFactory.getProfilesDb();

    let pwdBefore = amtConfig.AMTPassword;
    if(!amtConfig.GenerateRandomPassword) {
      // store the password key into db
      if(req.secretsManager) {
        console.log("Generate password key")
        amtConfig.AMTPassword = `${amtConfig.ProfileName}_DEVICE_AMT_PASSWORD`;
      }
    }

    let errorReason
    // SQL Query > Insert Data
    const results = await profilesDb.insertProfile(amtConfig).catch((reason) => { errorReason = reason })

    // profile inserted  into db successfully. insert the secret into vault

    if(!errorReason && !amtConfig.GenerateRandomPassword) {
      // store the password sent into Vault
      if(req.secretsManager) {
        console.log("Store in vault");
        await req.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${amtConfig.ProfileName}`, `${amtConfig.ProfileName}_DEVICE_AMT_PASSWORD`, pwdBefore);
        console.log("Password written to vault")
      }
      else {
        console.log('No secrets manager configured. Storing in DB.');
        console.log('Password will be visible in plain text.')
      }
    }

    if(!errorReason && results)
      res.status(200).end("Profile inserted")
    else {
      res.status(500).end(`Error inserting profile. ${errorReason}`)
    }
  } catch (error) {
    if(res.status) return;
    console.log(error)
    res.status(500).end("Error creating profile. Check server logs.")
  }
}

function readBody(req, res): AMTConfig {
  let config: AMTConfig = <AMTConfig>{};
  let body = req.body;

  config.ProfileName = body.payload.profileName;
  config.AMTPassword = body.payload.amtPassword;
  config.GenerateRandomPassword = body.payload.generateRandomPassword === "true" ? true : false;
  config.RandomPasswordLength = body.payload.passwordLength;
  config.ConfigurationScript = body.payload.configScript;
  config.Activation = body.payload.activation;

  config.RandomPasswordCharacters = body.payload.randomPasswordCharacters;


  if (config.ProfileName === null ||
    config.GenerateRandomPassword === null ||
    config.Activation === null) {
    res.status(400).end("Invalid input. Check input and try again.")
    throw new Error("Invalid input. Check input and try again.")
  }
  return config;
}
