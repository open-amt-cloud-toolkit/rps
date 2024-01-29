/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMTConfiguration } from '../models/index.js'
import { type CIRAConfig } from '../models/RCS.Config.js'

export interface IProfileManager {
  getActivationMode: (profileName: string, tenantId: string) => Promise<string | null>
  getCiraConfiguration: (profileName: string | null, tenantId: string) => Promise<CIRAConfig | null>
  getAmtPassword: (profileName: string, tenantId: string) => Promise<string | null>
  doesProfileExist: (profileName: string, tenantId: string) => Promise<boolean>
  getAmtProfile: (profileName: string, tenantId: string) => Promise<AMTConfiguration | null>
  getMEBxPassword: (profileName: string, tenantId: string) => Promise<string | null>
  getMPSPassword: (profileName: string, tenantId: string) => Promise<string>
}
