/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/

import * as WebSocket from 'ws'
import { ClientMsg } from '../models/RCS.Config'

export interface IWebSocketListener{
  onClientConnected: (ws: WebSocket) => void
  onClientDisconnected: (clientId: string) => void
  onMessageReceived: (message: WebSocket.Data, clientId: string) => void
  onError: (error: Error, clientId: string) => void
  sendMessage: (message: ClientMsg, clientId: string) => void
}
