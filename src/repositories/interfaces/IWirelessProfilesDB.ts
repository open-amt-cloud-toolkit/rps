/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { WirelessConfig } from '../../RCS.Config'

export interface IWirelessProfilesDb {
  getAllProfiles: () => Promise<WirelessConfig[]>
  getProfileByName: (profileName: string) => Promise<WirelessConfig>
  deleteProfileByName: (profileName: string) => Promise<boolean>
  insertProfile: (netConfig: WirelessConfig) => Promise<WirelessConfig>
  updateProfile: (netConfig: WirelessConfig) => Promise<WirelessConfig>
}
