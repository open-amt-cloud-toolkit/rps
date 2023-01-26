/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMTConfiguration } from '../../models'
import { type CIRAConfig } from '../../models/RCS.Config'
import { type ITable } from './ITable'

export interface IProfilesTable extends ITable<AMTConfiguration> {
  getCiraConfigForProfile: (ciraConfigName: string, tenantId?: string) => Promise<CIRAConfig>
}
