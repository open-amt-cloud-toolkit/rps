/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Madhavi Losetty
 **********************************************************************/
import * as WebSocket from 'ws'
import { ClientMsg } from '../models/RCS.Config'

export interface IDataProcessor{
  processData: (message: WebSocket.Data, clientId: string) => Promise<ClientMsg | null>
}
