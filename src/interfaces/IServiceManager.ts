/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type RPSConfig } from '../models'

export interface IServiceManager {
  health: (prefix: string) => Promise<boolean>
  get: (prefix: string) => Promise<any>
  process: (consulValues: any) => void
  seed: (prefix: string, config: RPSConfig) => Promise<boolean>
}
