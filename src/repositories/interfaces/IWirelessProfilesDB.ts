/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { WirelessConfig } from '../../RCS.Config'

export interface IWirelessProfilesDb {
  getCount: (tenantId?: string) => Promise<number>
  getAllProfiles: (limit: number, offset: number, tenantId?: string) => Promise<WirelessConfig[]>
  getProfileByName: (profileName: string, tenantId?: string) => Promise<WirelessConfig>
  checkProfileExits: (configName: string, tenantId?: string) => Promise<boolean>
  deleteProfileByName: (profileName: string, tenantId?: string) => Promise<boolean>
  insertProfile: (netConfig: WirelessConfig) => Promise<WirelessConfig>
  updateProfile: (netConfig: WirelessConfig) => Promise<WirelessConfig>
}
