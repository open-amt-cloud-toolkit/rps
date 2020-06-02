/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IProfilesDb } from "../../../repositories/interfaces/IProfilesDb";
import { ProfilesDbFactory } from "../../../repositories/ProfilesDbFactory";


export async function deleteProfile (req, res) {
  let profilesDb: IProfilesDb = null;
  try {
   
    profilesDb = ProfilesDbFactory.getProfilesDb();
    const { profileName } = req.params
    const results = await profilesDb.deleteProfileByName(profileName);
    if(typeof results === 'undefined'  || results === null)
      res.status(404).end("Profile not found")
    else
      res.status(200).json(results)
  } catch (error) {
    console.log(error)
    res.status(500).end("Error deleting profile. Check server logs.")
  }

}