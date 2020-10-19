/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { AMTConfig } from "../RCS.Config";

export function mapToProfile(results): AMTConfig {
  return <AMTConfig>{
    ProfileName: results.profilename,
    AMTPassword: results.amtpassword,   
    GenerateRandomPassword: results.generaterandompassword,
    RandomPasswordLength: results.randompasswordlength,
    RandomPasswordCharacters: results.randompasswordcharacters,
    ConfigurationScript: results.configurationscript,
    Activation: results.activation,
    CIRAConfigName: results.ciraconfigname,
    NetworkConfigName: results.networkprofilename
  }
}