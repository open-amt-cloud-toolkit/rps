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
import { PROFILE_INSERTION_SUCCESS, PROFILE_ERROR, PROFILE_INVALID_INPUT, PROFILE_NOT_FOUND, PROFILE_UPDATE_SUCCESS, PROFILE_INVALID_INPUT_PASSWORD } from "../../../utils/constants";
import { passwordValidation, passwordLengthValidation } from "../../../utils/passwordValidationUtils";

export async function editProfile (req, res) {
  
  let profilesDb: IProfilesDb = null;
  let log = Logger("editProfile")
  const amtConfig: AMTConfig = readBody(req, res)

  try {
    
    // console.log("SecretsManagement", req.secretsManager);
    // if generateRandomPassword is false, insert the amtPassword into vault using a 
    // key and insert the modified profile into db.

    profilesDb = ProfilesDbFactory.getProfilesDb();

    let pwdBefore = amtConfig.AMTPassword;

    if(!amtConfig.GenerateRandomPassword){
      if(!passwordValidation(pwdBefore) || !passwordLengthValidation(pwdBefore))
      {
        res.status(400).end(PROFILE_INVALID_INPUT_PASSWORD())
        return
      }
      // store the password key into db
      if(req.secretsManager) {
        log.silly("Generate password key")
        amtConfig.AMTPassword = `${amtConfig.ProfileName}_DEVICE_AMT_PASSWORD`;
      }
    }

    if(amtConfig.GenerateRandomPassword) {
      if(!(amtConfig.RandomPasswordLength >= 8 && amtConfig.RandomPasswordLength <= 32))
      {
        res.status(400).end(PROFILE_INVALID_INPUT())
        return
      }
    }

    let errorReason
    // SQL Query > Insert Data
    const results = await profilesDb.updateProfile(amtConfig).catch((reason) => { errorReason = reason })

    // profile inserted  into db successfully. insert the secret into vault

    if(amtConfig.GenerateRandomPassword){
      if(req.secretsManager) {
        log.debug("Delete in vault"); // User might be flipping from false to true which we dont know. So try deleting either way.
        await req.secretsManager.deleteSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${amtConfig.ProfileName}`, `${amtConfig.ProfileName}_DEVICE_AMT_PASSWORD`);
        log.debug("Password deleted from vault")
      }
    }

    if(!errorReason && !amtConfig.GenerateRandomPassword && results > 0) {
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

    if(!errorReason && results > 0)
      res.status(200).end(PROFILE_UPDATE_SUCCESS(amtConfig.ProfileName))
    else {
      if(errorReason) res.status(500).end(`${errorReason}`)
      else res.status(404).end(PROFILE_NOT_FOUND(amtConfig.ProfileName))
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
