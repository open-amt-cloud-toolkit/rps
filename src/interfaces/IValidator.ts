/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import type * as WebSocket from 'ws'
import { type ClientMsg } from '../models/RCS.Config.js'

export interface IValidator {
  validateMaintenanceMsg: (clientMsg: ClientMsg, clientId: string) => any
  parseClientMsg: (message: WebSocket.Data, clientId: string) => any
  isDigestRealmValid: (realm: string) => boolean
  validateActivationMsg: (message: ClientMsg, clientId: string) => any
  validateDeactivationMsg: (msg: ClientMsg, clientId: string) => any
}
