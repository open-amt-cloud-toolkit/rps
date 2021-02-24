/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTConfiguration } from '../../models/Rcs'
import { CIRAConfig, NetworkConfig } from '../../RCS.Config'

export interface IProfilesDb {
  getAllProfiles: () => Promise<AMTConfiguration[]>
  getProfileByName: (profileName) => Promise<AMTConfiguration>
  getCiraConfigForProfile: (ciraConfigName) => Promise<CIRAConfig>
  getNetworkConfigForProfile: (networkConfigName) => Promise<NetworkConfig>
  deleteProfileByName: (profileName) => Promise<boolean>
  insertProfile: (amtConfig) => Promise<AMTConfiguration>
  updateProfile: (amtConfig) => Promise<AMTConfiguration>
}
