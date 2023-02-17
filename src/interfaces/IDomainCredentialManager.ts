/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMTDomain } from '../models'

export interface IDomainCredentialManager {
  getProvisioningCert: (domainSuffix: string, tenantId: string) => Promise<AMTDomain>
  doesDomainExist: (domainSuffix: string, tenantId: string) => Promise<boolean>
}
