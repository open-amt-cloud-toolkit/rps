/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: interface for rcs configurations
 * Author: Brian Osburn
 **********************************************************************/

import { RPSConfig } from '../models'

export interface IRCSConfigReader {
  importconfig: () => RPSConfig
}
