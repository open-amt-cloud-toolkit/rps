/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { NetworkConfig } from '../../RCS.Config'
export interface INetProfilesDb {
  getAllProfiles: () => Promise<NetworkConfig[]>
  getProfileByName: (profileName: string) => Promise<NetworkConfig>
  deleteProfileByName: (profileName: string) => Promise<boolean>
  insertProfile: (netConfig: NetworkConfig) => Promise<NetworkConfig>
  updateProfile: (netConfig: NetworkConfig) => Promise<NetworkConfig>
}
