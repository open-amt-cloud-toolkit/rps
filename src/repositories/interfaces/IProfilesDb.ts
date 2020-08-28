/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTConfig, CIRAConfig } from "../../RCS.Config";

export interface IProfilesDb {
  getAllProfiles(mapperFn?: (profileName, data) => any ): Promise<AMTConfig[]>;
  getProfileByName(profileName): Promise<AMTConfig>;
  getCiraConfigForProfile(ciraConfigName): Promise<CIRAConfig>
  deleteProfileByName(profileName): Promise<any>;
  insertProfile(amtConfig): Promise<any>;
}
