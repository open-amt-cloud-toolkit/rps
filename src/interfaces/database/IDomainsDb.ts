/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMTDomain } from '../../models'
import { ITable } from './ITable'
export interface IDomainsTable extends ITable<AMTDomain> {
  getDomainByDomainSuffix: (domainSuffix: string, tenantId?: string) => Promise<AMTDomain>
}
