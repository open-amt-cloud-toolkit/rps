/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTDomain } from '../../models/Rcs'
import { IDB } from './IDb'
export interface IDomainsDb extends IDB<AMTDomain> {
  getDomainByDomainSuffix: (domainSuffix: string, tenantId?: string) => Promise<AMTDomain>
}
