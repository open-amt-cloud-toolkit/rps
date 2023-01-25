/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type ICiraConfigTable } from './ICiraConfigDb'
import { type IDomainsTable } from './IDomainsDb'
import { type IProfilesTable } from './IProfilesDb'
import { type IProfilesWifiConfigsTable } from './IProfileWifiConfigsDb'
import { type IWirelessProfilesTable } from './IWirelessProfilesDB'

export interface IDB {
  ciraConfigs: ICiraConfigTable
  domains: IDomainsTable
  profiles: IProfilesTable
  wirelessProfiles: IWirelessProfilesTable
  profileWirelessConfigs: IProfilesWifiConfigsTable
  query: (text: string, params?: any) => Promise<any>
}
