/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { CIRAConfig } from '../../RCS.Config'

export interface ICiraConfigDb {
  getAllCiraConfigs(mapper?: (configName, data) => Promise<string>): Promise<CIRAConfig[]>;
  getCiraConfigByName(configName): Promise<CIRAConfig>;
  deleteCiraConfigByName(configName): Promise<any>;
  insertCiraConfig(ciraConfig): Promise<any>;
  updateCiraConfig(ciraConfig): Promise<number>;
}
