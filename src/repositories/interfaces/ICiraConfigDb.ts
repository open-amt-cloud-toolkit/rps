/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { CIRAConfig } from '../../RCS.Config'

export interface ICiraConfigDb {
  getCount: (tenantId?: string) => Promise<number>
  getAllCiraConfigs: (limit: number, offset: number, tenantId?: string) => Promise<CIRAConfig[]>
  getCiraConfigByName: (configName, tenantId?: string) => Promise<CIRAConfig>
  deleteCiraConfigByName: (configName, tenantId?: string) => Promise<boolean>
  insertCiraConfig: (ciraConfig) => Promise<CIRAConfig>
  updateCiraConfig: (ciraConfig) => Promise<CIRAConfig>
}
