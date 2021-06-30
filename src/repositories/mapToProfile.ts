/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { AMTConfiguration } from '../models/Rcs'

export function mapToProfile (results): AMTConfiguration {
  return {
    profileName: results.profilename,
    amtPassword: results.amtpassword,
    generateRandomPassword: results.generaterandompassword,
    passwordLength: results.passwordlength,
    randomPasswordCharacters: results.randompasswordcharacters,
    activation: results.activation,
    ciraConfigName: results.ciraconfigname,
    networkConfigName: results.networkprofilename,
    mebxPassword: results.mebxpassword,
    generateRandomMEBxPassword: results.generaterandommebxpassword,
    mebxPasswordLength: results.mebxpasswordlength,
    tags: results.tags
  } as AMTConfiguration
}
