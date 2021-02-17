/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { CIRAConfig } from '../../RCS.Config'

export interface ICiraConfigDb {
  getAllCiraConfigs: () => Promise<CIRAConfig[]>
  getCiraConfigByName: (configName) => Promise<CIRAConfig>
  deleteCiraConfigByName: (configName) => Promise<boolean>
  insertCiraConfig: (ciraConfig) => Promise<boolean>
  updateCiraConfig: (ciraConfig) => Promise<CIRAConfig>
}
