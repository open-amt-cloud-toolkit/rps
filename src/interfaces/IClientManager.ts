/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Madhavi Losetty
 **********************************************************************/
import { ClientObject } from '../models/RCS.Config'

export interface IClientManager{
  clients: ClientObject[]
  addClient: (client: ClientObject) => void
  removeClient: (clientId: string) => void
  getClientIndex: (clientId: string) => number
  getClientObject: (clientId: string) => ClientObject
  setClientObject: (clientObj: ClientObject) => void
}
