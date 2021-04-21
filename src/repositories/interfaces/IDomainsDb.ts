/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTDomain } from '../../models/Rcs'
export interface IDomainsDb {
  getAllDomains: () => Promise<AMTDomain[]>
  getDomainByName: (domainName: string) => Promise<AMTDomain>
  getDomainByDomainSuffix: (domainSuffix: string) => Promise<AMTDomain>
  insertDomain: (amtDomain: AMTDomain) => Promise<AMTDomain>
  updateDomain: (amtDomain: AMTDomain) => Promise<AMTDomain>
  deleteDomainByName: (domainName: string) => Promise<boolean>
}
