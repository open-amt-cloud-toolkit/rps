/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMTConfiguration } from '../../models/index.js'
import { type Ieee8021xConfig, type CIRAConfig } from '../../models/RCS.Config.js'
import { type ITable } from './ITable.js'

export interface IProfilesTable extends ITable<AMTConfiguration> {
  getCiraConfigForProfile: (ciraConfigName: string, tenantId?: string) => Promise<CIRAConfig | null>
  get8021XConfigForProfile: (profileName: string, tenantId?: string) => Promise<Ieee8021xConfig | null>
}
