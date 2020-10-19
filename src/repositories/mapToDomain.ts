
/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { AMTDomain } from "../models/Rcs";

export function mapToDomain(result): AMTDomain {
  return <AMTDomain>{
    Name: result.name,
    DomainSuffix: result.domainsuffix,
    ProvisioningCert: result.provisioningcert, 
    ProvisioningCertStorageFormat: result.provisioningcertstorageformat,
    ProvisioningCertPassword: result.provisioningcertpassword 
  }
}