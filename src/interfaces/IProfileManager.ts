/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMTConfiguration } from '../models'
import { type CIRAConfig } from '../models/RCS.Config'

export interface IProfileManager {
  getActivationMode: (profileName: string, tenantId: string) => Promise<string>
  getCiraConfiguration: (profileName: string, tenantId: string) => Promise<CIRAConfig>
  getAmtPassword: (profileName: string, tenantId: string) => Promise<string>
  doesProfileExist: (profileName: string, tenantId: string) => Promise<boolean>
  getAmtProfile: (profileName: string, tenantId: string) => Promise<AMTConfiguration>
  getMEBxPassword: (profileName: string, tenantId: string) => Promise<string>
  getMPSPassword: (profileName: string, tenantId: string) => Promise<string>
}
