/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpHandler } from '../HttpHandler'
import { ClientMsg } from '../models/RCS.Config'

export interface IExecutor{
  execute: (message: any, clientId: string, httpHandler?: HttpHandler) => Promise<ClientMsg>
}
