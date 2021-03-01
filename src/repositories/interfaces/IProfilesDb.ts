/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTConfiguration } from '../../models/Rcs'
import { CIRAConfig, NetworkConfig } from '../../RCS.Config'

export interface IProfilesDb {
  getAllProfiles: () => Promise<AMTConfiguration[]>
  getProfileByName: (profileName: string) => Promise<AMTConfiguration>
  getCiraConfigForProfile: (ciraConfigName: string) => Promise<CIRAConfig>
  getNetworkConfigForProfile: (networkConfigName: string) => Promise<NetworkConfig>
  deleteProfileByName: (profileName: string) => Promise<boolean>
  insertProfile: (amtConfig: AMTConfiguration) => Promise<AMTConfiguration>
  updateProfile: (amtConfig: AMTConfiguration) => Promise<AMTConfiguration>
}
