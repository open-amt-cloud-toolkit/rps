/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: contains rcs configurations
 * Author: Brian Osburn
 **********************************************************************/

import { IDomainCredentialManager } from './IDomainCredentialManager'
import { IProfileManager } from './IProfileManager'
import { ISecretManagerService } from './ISecretManagerService'
import { IAMTDeviceRepository } from './database/IAMTDeviceRepository'
import { IClientManager } from './IClientManager'
import { IDataProcessor } from './IDataProcessor'

export interface IConfigurator {
  domainCredentialManager: IDomainCredentialManager
  profileManager: IProfileManager
  secretsManager: ISecretManagerService
  amtDeviceRepository: IAMTDeviceRepository
  dataProcessor: IDataProcessor
  clientManager: IClientManager
}
