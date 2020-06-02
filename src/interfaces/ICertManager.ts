/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: Interface for certificate related functionality
 * Author: Brian Osburn
 **********************************************************************/

import { certificateObject } from '../models/Rcs'

export interface ICertManager {
    dumpPfx(pfxobj: any): any;
    sortCertificate(intermediate: certificateObject, root: certificateObject): boolean;
    convertPfxToObject(pfxb64: string, passphrase: string): any;
}