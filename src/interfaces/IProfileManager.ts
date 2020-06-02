/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: stores amt profile information
 * Author: Brian Osburn
 **********************************************************************/

import { AMTConfigurations } from "../models/Rcs";

export interface IProfileManager {
    validateAMTPasswords(list: AMTConfigurations): AMTConfigurations;
    getActivationMode(profileName: string): Promise<string>;
    getConfigurationScript(profileName: string): Promise<string>;
    getAmtPassword(profileName: string): Promise<string>;
    doesProfileExist(profileName: string): Promise<boolean>;
}