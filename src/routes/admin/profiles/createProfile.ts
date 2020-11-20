/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IProfilesDb } from "../../../repositories/interfaces/IProfilesDb";
import { ProfilesDbFactory } from "../../../repositories/ProfilesDbFactory";
import { AMTConfig } from "../../../RCS.Config";
import { EnvReader } from "../../../utils/EnvReader";
import Logger from "../../../Logger";
import { PROFILE_INSERTION_SUCCESS, PROFILE_ERROR, PROFILE_INVALID_INPUT } from "../../../utils/constants";

export async function createProfile (req, res) {
  
  let profilesDb: IProfilesDb = null;
  let log = Logger("createProfile")
  const amtConfig: AMTConfig = readBody(req, res)

  try {
    
    // console.log("SecretsManagement", req.secretsManager);
    // if generateRandomPassword is false, insert the amtPassword into vault using a 
    // key and insert the modified profile into db.

    profilesDb = ProfilesDbFactory.getProfilesDb();

    let pwdBefore = amtConfig.AMTPassword;
    if(!amtConfig.GenerateRandomPassword) {
      // store the password key into db
      if(req.secretsManager) {
        log.silly("Generate password key")
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
        log.debug("Store in vault");
        await req.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${amtConfig.ProfileName}`, `${amtConfig.ProfileName}_DEVICE_AMT_PASSWORD`, pwdBefore);
        log.debug("Password written to vault")
      }
      else {
        log.debug('No secrets manager configured. Storing in DB.');
        log.debug('Password will be visible in plain text.')
      }
    }

    if(!errorReason && results)
      res.status(200).end(PROFILE_INSERTION_SUCCESS(amtConfig.ProfileName))
    else {
      res.status(500).end(`${errorReason}`)
    }
  } catch (error) {
    if(res.status) return;
    console.log(error)
    res.status(500).end(PROFILE_ERROR(amtConfig.ProfileName))
  }
}

function readBody(req, res): AMTConfig {
  let config: AMTConfig = <AMTConfig>{};
  let body = req.body;

  if (typeof body.payload.generateRandomPassword === 'string') {
    if (body.payload.generateRandomPassword.toLowerCase() === 'true') {
      body.payload.generateRandomPassword = true;
    }
    else if (body.payload.generateRandomPassword.toLowerCase() === 'false') {
      body.payload.generateRandomPassword = false;
    }
  }

  config.ProfileName = body.payload.profileName;
  config.AMTPassword = body.payload.amtPassword;
  config.GenerateRandomPassword = body.payload.generateRandomPassword;
  config.RandomPasswordLength = body.payload.passwordLength;
  config.ConfigurationScript = body.payload.configScript;
  config.CIRAConfigName = body.payload.ciraConfigName;
  config.Activation = body.payload.activation;
  config.RandomPasswordCharacters = body.payload.randomPasswordCharacters;
  config.NetworkConfigName = body.payload.networkConfigName;


  if (config.ProfileName === null ||
    config.GenerateRandomPassword === null ||
    config.Activation === null ||
    (config.GenerateRandomPassword === true && config.RandomPasswordLength == null)) {
    res.status(400).end(PROFILE_INVALID_INPUT())
    throw new Error(PROFILE_INVALID_INPUT())
  }
  return config;
}
