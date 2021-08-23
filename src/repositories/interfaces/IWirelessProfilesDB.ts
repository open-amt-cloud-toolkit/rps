/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { WirelessConfig } from '../../RCS.Config'
import { IDB } from './IDb'

export interface IWirelessProfilesDb extends IDB<WirelessConfig> {
  checkProfileExits: (configName: string, tenantId?: string) => Promise<boolean>
}
