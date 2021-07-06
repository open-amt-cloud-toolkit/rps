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
    passwordLength: results.passwordlength,
    randomPasswordCharacters: results.randompasswordcharacters,
    activation: results.activation,
    ciraConfigName: results.ciraconfigname,
    mebxPassword: results.mebxpassword,
    generateRandomMEBxPassword: results.generaterandommebxpassword,
    mebxPasswordLength: results.mebxpasswordlength,
    tags: results.tags,
    dhcpEnabled: results.dhcp_enabled
  }
  return config
}
