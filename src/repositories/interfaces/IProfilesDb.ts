/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTConfiguration } from '../../models/Rcs'
import { CIRAConfig } from '../../RCS.Config'

export interface IProfilesDb {
  getCount: () => Promise<number>
  getAllProfiles: (limit: number, offset: number) => Promise<AMTConfiguration[]>
  getProfileByName: (profileName: string) => Promise<AMTConfiguration>
  getCiraConfigForProfile: (ciraConfigName: string) => Promise<CIRAConfig>
  deleteProfileByName: (profileName: string) => Promise<boolean>
  insertProfile: (amtConfig: AMTConfiguration) => Promise<AMTConfiguration>
  updateProfile: (amtConfig: AMTConfiguration) => Promise<AMTConfiguration>
}
