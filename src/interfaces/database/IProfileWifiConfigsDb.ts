/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type ProfileWifiConfigs } from '../../models/RCS.Config'

export interface IProfilesWifiConfigsTable {
  getProfileWifiConfigs: (profileName: string) => Promise<ProfileWifiConfigs[]>
  deleteProfileWifiConfigs: (profileName: string, tenantId: string) => Promise<boolean>
  createProfileWifiConfigs: (wifiConfigs: ProfileWifiConfigs[], profileName: string, tenantId?: string) => Promise<boolean>
}
