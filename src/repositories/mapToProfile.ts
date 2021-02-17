/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { AMTConfig } from '../RCS.Config'

export function mapToProfile (results): AMTConfig {
  return {
    profileName: results.profilename,
    amtPassword: results.amtpassword,
    generateRandomPassword: results.generaterandompassword,
    randomPasswordLength: results.randompasswordlength,
    randomPasswordCharacters: results.randompasswordcharacters,
    configurationScript: results.configurationscript,
    activation: results.activation,
    ciraConfigName: results.ciraconfigname,
    networkConfigName: results.networkprofilename,
    mebxPassword: results.mebxpassword,
    generateRandomMEBxPassword: results.generaterandommebxpassword,
    randomMEBxPasswordLength: results.randommebxpasswordlength
  } as AMTConfig
}
