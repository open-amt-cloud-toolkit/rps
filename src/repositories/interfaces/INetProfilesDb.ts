/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { NetworkConfig } from '../../RCS.Config'
export interface INetProfilesDb {
  getAllProfiles: () => Promise<NetworkConfig[]>
  getProfileByName: (profileName) => Promise<NetworkConfig>
  deleteProfileByName: (profileName) => Promise<boolean>
  insertProfile: (netConfig) => Promise<boolean>
  updateProfile: (netConfig) => Promise<NetworkConfig>
}
