/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTConfiguration } from '../../models/Rcs'
import { CIRAConfig } from '../../RCS.Config'
import { IDB } from './IDb'

export interface IProfilesDb extends IDB<AMTConfiguration> {
  getCiraConfigForProfile: (ciraConfigName: string, tenantId?: string) => Promise<CIRAConfig>
}
