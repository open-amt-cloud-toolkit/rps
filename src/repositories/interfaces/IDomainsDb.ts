/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTDomain } from '../../models/Rcs'
export interface IDomainsDb {
  getCount: (tenantId?: string) => Promise<number>
  getAllDomains: (limit: number, offset: number, tenantId?: string) => Promise<AMTDomain[]>
  getDomainByName: (domainName: string, tenantId?: string) => Promise<AMTDomain>
  getDomainByDomainSuffix: (domainSuffix: string, tenantId?: string) => Promise<AMTDomain>
  insertDomain: (amtDomain: AMTDomain) => Promise<AMTDomain>
  updateDomain: (amtDomain: AMTDomain) => Promise<AMTDomain>
  deleteDomainByName: (domainName: string, tenantId?: string) => Promise<boolean>
}
