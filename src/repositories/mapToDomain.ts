
/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { AMTDomain } from '../models/Rcs'

export function mapToDomain (result): AMTDomain {
  const domain: AMTDomain = {
    profileName: result.name,
    domainSuffix: result.domainsuffix,
    provisioningCert: result.provisioningcert,
    provisioningCertStorageFormat: result.provisioningcertstorageformat,
    provisioningCertPassword: result.provisioningcertpassword,
    tenantId: result.tenant_id
  }
  return domain
}
