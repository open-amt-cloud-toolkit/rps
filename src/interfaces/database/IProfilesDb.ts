/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMTConfiguration } from '../../models'
import { type Ieee8021xConfig, type CIRAConfig } from '../../models/RCS.Config'
import { type ITable } from './ITable'

export interface IProfilesTable extends ITable<AMTConfiguration> {
  getCiraConfigForProfile: (ciraConfigName: string, tenantId?: string) => Promise<CIRAConfig>
  get8021XConfigForProfile: (profileName: string, tenantId?: string) => Promise<Ieee8021xConfig>
}
