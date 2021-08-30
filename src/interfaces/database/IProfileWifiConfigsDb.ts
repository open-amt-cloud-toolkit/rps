/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ProfileWifiConfigs } from '../../RCS.Config'

export interface IProfileWifiConfigsDb {
  getProfileWifiConfigs: (profileName: string) => Promise<ProfileWifiConfigs[]>
  deleteProfileWifiConfigs: (profileName: string) => Promise<boolean>
  createProfileWifiConfigs: (wifiConfigs: ProfileWifiConfigs[], profileName: string) => Promise<boolean>
}
