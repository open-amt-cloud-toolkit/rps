/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTDomain } from '../../models/Rcs'
import { ITable } from './ITable'
export interface IDomainsTable extends ITable<AMTDomain> {
  getDomainByDomainSuffix: (domainSuffix: string, tenantId?: string) => Promise<AMTDomain>
}
