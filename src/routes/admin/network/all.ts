/*********************************************************************
* Copyright (c) Intel Corporation 2019
* SPDX-License-Identifier: Apache-2.0
* Author : Ramu Bachala
**********************************************************************/
import { INetProfilesDb } from "../../../repositories/interfaces/INetProfilesDb";
import { NetConfigDbFactory } from "../../../repositories/NetConfigDbFactory";
import { NETWORK_CONFIG_ERROR, NETWORK_CONFIG_EMPTY } from "../../../utils/constants";

export async function allProfiles(req, res) {
 let profilesDb: INetProfilesDb = null;
 try {
   profilesDb = NetConfigDbFactory.getConfigDb();
   
   const results = await profilesDb.getAllProfiles();
   if(typeof results === 'undefined' || results.length === 0)
     res.status(404).end(NETWORK_CONFIG_EMPTY())
   else
     res.status(200).json(results).end()

 } catch (error) {
   console.log(error)
   res.status(500).end(NETWORK_CONFIG_ERROR(""))
 }
}