/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import * as WebSocket from 'ws'
import { ClientMsg } from '../models/RCS.Config'

export interface IValidator {
  validateMaintenanceMsg: (clientMsg: ClientMsg, clientId: string) => any
  parseClientMsg: (message: WebSocket.Data, clientId: string) => any
  isDigestRealmValid: (realm: string) => boolean
  validateActivationMsg: (message: ClientMsg, clientId: string) => any
  validateDeactivationMsg: (msg: ClientMsg, clientId: string) => any
}
