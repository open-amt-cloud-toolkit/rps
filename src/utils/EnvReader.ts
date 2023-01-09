/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { RPSConfig } from '../models'

export interface webConfigType {
  ca: any
  cert: any
  key: any
  secureOptions?: any
}

interface IEnvReader {
  GlobalEnvConfig: RPSConfig
}
const EnvReader: IEnvReader = {
  GlobalEnvConfig: null
}

export { EnvReader }
