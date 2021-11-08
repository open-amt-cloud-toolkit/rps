/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { healthCheckError } from '../RCS.Config'

export interface IHealthCheck{
  getHealthCheck: () => Promise<healthCheckError[]>
}
