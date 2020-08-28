/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IProfilesDb } from "../../../repositories/interfaces/IProfilesDb";
import { ProfilesDbFactory } from "../../../repositories/ProfilesDbFactory";
import { EnvReader } from "../../../utils/EnvReader";
import { PROFILE_NOT_FOUND, PROFILE_ERROR } from "../../../utils/constants";

export async function getProfile (req, res) {
  let profilesDb: IProfilesDb = null;
  const { profileName } = req.params
  try {
    profilesDb = ProfilesDbFactory.getProfilesDb();

    const results = await profilesDb.getProfileByName(profileName);
    if(typeof results === 'undefined' || results === null)
      res.status(404).end(PROFILE_NOT_FOUND(profileName))
    else {
      if (results.GenerateRandomPassword === false && req.secretsManager)
        results.AMTPassword = await req.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${results.ProfileName}`, `${results.ProfileName}_DEVICE_AMT_PASSWORD`);
      res.status(200).json(results).end()
    }
  } catch (error) {
    console.log(error)
    res.status(500).end(PROFILE_ERROR(profileName))
  }

}