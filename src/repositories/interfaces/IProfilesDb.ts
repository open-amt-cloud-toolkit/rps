/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTConfig } from "../../RCS.Config";

export interface IProfilesDb {
  getAllProfiles(): Promise<AMTConfig[]>;
  getProfileByName(profileName): Promise<AMTConfig>;
  deleteProfileByName(profileName): Promise<any>;
  insertProfile(amtConfig): Promise<any>;
}
