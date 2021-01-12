/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: interface for rcs configurations
 * Author: Brian Osburn
 **********************************************************************/

import { RCSConfig } from '../models/Rcs'

export interface IRCSConfigReader {
  importconfig: () => RCSConfig
}
