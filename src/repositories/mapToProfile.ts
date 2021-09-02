/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { AMTConfiguration } from '../models/Rcs'

export function mapToProfile (results): AMTConfiguration {
  const config: AMTConfiguration = {
    profileName: results.profilename,
    amtPassword: results.amtpassword,
    generateRandomPassword: results.generaterandompassword,
    activation: results.activation,
    ciraConfigName: results.ciraconfigname,
    mebxPassword: results.mebxpassword,
    generateRandomMEBxPassword: results.generaterandommebxpassword,
    tags: results.tags,
    dhcpEnabled: results.dhcp_enabled,
    tenantId: results.tenant_id
  }
  return config
}
