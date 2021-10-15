/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTConfiguration } from '../../models/Rcs'
import { CIRAConfig, TlsConfigs } from '../../models/RCS.Config'
import { ITable } from './ITable'

export interface IProfilesTable extends ITable<AMTConfiguration> {
  getCiraConfigForProfile: (ciraConfigName: string, tenantId?: string) => Promise<CIRAConfig>
  getTLSConfigForProfile: (configName: string, tenantId?: string) => Promise<TlsConfigs>
}
