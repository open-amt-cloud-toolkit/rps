/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type Ieee8021xConfig, type Ieee8021xCountByInterface } from '../../models/RCS.Config'
import { type ITable } from './ITable'

export interface IIEEE8021xProfileTable extends ITable<Ieee8021xConfig> {
  checkProfileExits: (profileName: any, tenantId: string) => Promise<boolean>
  getCountByInterface: (tenantId: string) => Promise<Ieee8021xCountByInterface>
}
