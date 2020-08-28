/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IProfilesDb } from "../../../repositories/interfaces/IProfilesDb";
import { ProfilesDbFactory } from "../../../repositories/ProfilesDbFactory";
import { EnvReader } from "../../../utils/EnvReader";
import { PROFILE_CONFIG_EMPTY, PROFILE_ERROR } from "../../../utils/constants";

export async function allProfiles(req, res) {
  let profilesDb: IProfilesDb = null;
  try {
    profilesDb = ProfilesDbFactory.getProfilesDb();
    let mapperFn = async (profileName, amtPassword) => {
      if (req.secretsManager)
        return await req.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${profileName}`, `${profileName}_DEVICE_AMT_PASSWORD`);

      return amtPassword;
    }
    const results = await profilesDb.getAllProfiles(mapperFn);
    if(typeof results === 'undefined' || results.length === 0)
      res.status(404).end(PROFILE_CONFIG_EMPTY())
    else
      res.status(200).json(results).end()

  } catch (error) {
    console.log(error)
    res.status(500).end(PROFILE_ERROR(""))
  }
}
