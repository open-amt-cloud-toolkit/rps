/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IProfilesDb } from "../../../repositories/interfaces/IProfilesDb";
import { ProfilesDbFactory } from "../../../repositories/ProfilesDbFactory";
import { PROFILE_NOT_FOUND, PROFILE_ERROR } from "../../../utils/constants";


export async function deleteProfile (req, res) {
  let profilesDb: IProfilesDb = null;
  const { profileName } = req.params
  try {
    profilesDb = ProfilesDbFactory.getProfilesDb();
    const results = await profilesDb.deleteProfileByName(profileName);
    if(typeof results === 'undefined'  || results === null)
      res.status(404).end(PROFILE_NOT_FOUND(profileName))
    else
      res.status(200).end(results)
  } catch (error) {
    console.log(error)
    res.status(500).end(PROFILE_ERROR(profileName))
  }

}