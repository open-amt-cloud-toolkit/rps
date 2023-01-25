/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type IDB } from './interfaces/database/IDb'
import { type ISecretManagerService } from './interfaces/ISecretManagerService'

declare module 'express' {
  export interface Request {
    secretsManager: ISecretManagerService
    tenantId?: string
    db: IDB
  }
}
