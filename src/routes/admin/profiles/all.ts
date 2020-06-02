/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IProfilesDb } from "../../../repositories/interfaces/IProfilesDb";
import { ProfilesDbFactory } from "../../../repositories/ProfilesDbFactory";

export async function allProfiles(req, res) {
  let profilesDb: IProfilesDb = null;
  try {
    profilesDb = ProfilesDbFactory.getProfilesDb();
    const results = await profilesDb.getAllProfiles();
    if(typeof results === 'undefined' || results.length === 0)
      res.status(404).end("Profiles empty.")
    else
      res.status(200).json(results).end()

  } catch (error) {
    console.log(error)
    res.status(500).end("Error retrieving all profiles. Check server logs.")
  }
}
