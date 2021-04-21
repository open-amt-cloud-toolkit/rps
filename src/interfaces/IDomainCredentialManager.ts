/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: contains domain certificate information
 * Author: Brian Osburn
 **********************************************************************/

import { AMTDomain } from '../models/Rcs'

export interface IDomainCredentialManager {
  getProvisioningCertStorageType: (domain: string) => Promise<string>
  getProvisioningCert: (domainSuffix: string) => Promise<AMTDomain>
  doesDomainExist: (domainSuffix: string) => Promise<boolean>
}
