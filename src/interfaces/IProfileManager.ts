/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: stores amt profile information
 * Author: Brian Osburn
 **********************************************************************/

import { AMTConfiguration } from '../models/Rcs'
import { CIRAConfig } from '../RCS.Config'

export interface IProfileManager {
  validateAMTPasswords: (list: AMTConfiguration[]) => AMTConfiguration[]
  getActivationMode: (profileName: string) => Promise<string>
  getConfigurationScript: (profileName: string) => Promise<string>
  getCiraConfiguration: (profileName: string) => Promise<CIRAConfig>
  getAmtPassword: (profileName: string) => Promise<string>
  doesProfileExist: (profileName: string) => Promise<boolean>
  getAmtProfile: (profileName: string) => Promise<AMTConfiguration>
  getMEBxPassword: (profileName: string) => Promise<string>
}
