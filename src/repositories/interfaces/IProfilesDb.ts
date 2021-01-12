/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTConfig, CIRAConfig, NetworkConfig } from '../../RCS.Config'

export interface IProfilesDb {
  getAllProfiles(): Promise<AMTConfig[]>;
  getProfileByName(profileName): Promise<AMTConfig>;
  getCiraConfigForProfile(ciraConfigName): Promise<CIRAConfig>
  getNetworkConfigForProfile(networkConfigName): Promise<NetworkConfig>
  deleteProfileByName(profileName): Promise<any>;
  insertProfile(amtConfig): Promise<any>;
  updateProfile(amtConfig): Promise<any>;
}
