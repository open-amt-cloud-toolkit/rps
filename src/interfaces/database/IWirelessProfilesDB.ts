/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { WirelessConfig } from '../../models/RCS.Config'
import { ITable } from './ITable'

export interface IWirelessProfilesTable extends ITable<WirelessConfig> {
  checkProfileExits: (configName: string, tenantId?: string) => Promise<boolean>
}
