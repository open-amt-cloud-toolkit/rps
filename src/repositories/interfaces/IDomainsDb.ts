/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
export interface IDomainsDb {
  getAllDomains(mapperFn?: (data) => any ): Promise<any>;
  getDomainByName(domainName): Promise<any>;
  insertDomain(amtDomain): Promise<any>;
  deleteDomainByName(domainName): Promise<any>;
}
