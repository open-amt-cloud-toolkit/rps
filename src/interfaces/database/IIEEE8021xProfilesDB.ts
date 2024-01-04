/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type Ieee8021xConfig } from '../../models/RCS.Config.js'
import { type ITable } from './ITable.js'

export interface IIEEE8021xProfileTable extends ITable<Ieee8021xConfig> {
  checkProfileExits: (profileName: any, tenantId: string) => Promise<boolean>
}
