/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTDomain } from '../../models/Rcs'
export interface IDomainsDb {
  getAllDomains: () => Promise<any>
  getDomainByName: (domainName) => Promise<any>
  insertDomain: (amtDomain) => Promise<AMTDomain>
  updateDomain: (amtDomain) => Promise<AMTDomain>
  deleteDomainByName: (domainName) => Promise<any>
}
