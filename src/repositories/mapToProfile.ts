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
    activation: results.activation,
    ciraConfigName: results.ciraconfigname,
    mebxPassword: results.mebxpassword,
    tags: results.tags,
    dhcpEnabled: results.dhcp_enabled
  }
  return config
}
