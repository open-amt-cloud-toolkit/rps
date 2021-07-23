/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { WirelessConfig } from '../../RCS.Config'

export interface IWirelessProfilesDb {
  getCount: () => Promise<number>
  getAllProfiles: (limit: number, offset: number) => Promise<WirelessConfig[]>
  getProfileByName: (profileName: string) => Promise<WirelessConfig>
  checkProfileExits: (configName: string) => Promise<boolean>
  deleteProfileByName: (profileName: string) => Promise<boolean>
  insertProfile: (netConfig: WirelessConfig) => Promise<WirelessConfig>
  updateProfile: (netConfig: WirelessConfig) => Promise<WirelessConfig>
}
