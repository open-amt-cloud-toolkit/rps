/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 * Description: Keeps track of client connections
 **********************************************************************/

import { IClientManager } from './interfaces/IClientManager'
import { ClientObject } from './RCS.Config'
import Logger from './Logger'

export class ClientManager implements IClientManager {
  clients: ClientObject[]

  private readonly log: Logger = new Logger('ClientManager')
  private static instance: ClientManager

  private constructor () {
    this.clients = new Array<ClientObject>()
  }

  // Single entry to keep track of all client connections
  static getInstance (): ClientManager {
    if (!ClientManager.instance) {
      ClientManager.instance = new ClientManager()
    }
    return ClientManager.instance
  }

  getClientObject (clientId: string): ClientObject {
    let clientObj: ClientObject = { ClientId: clientId }
    const index = this.getClientIndex(clientId)
    if (index > -1) {
      clientObj = this.clients[index]
    }
    return clientObj
  }

  setClientObject (clientObj: ClientObject): void {
    const index = this.getClientIndex(clientObj.ClientId)
    if (index > -1) {
      this.clients[index] = clientObj
    }
  }

  getClientIndex (ClientId: string): number {
    let index: number
    try {
      index = this.clients.findIndex(x => x.ClientId === ClientId)
    } catch (error) {
      this.log.error(`Failed to get a client index: ${error}`)
      return -1
    }
    return index
  }

  addClient (client: ClientObject): void {
    try {
      this.clients.push(client)
      this.log.info(`Active clients : ${this.clients.length}`)
    } catch (error) {
      this.log.error(`Failed to add a client: ${error}`)
    }
  }

  removeClient (clientId: string): void {
    try {
      const index = this.getClientIndex(clientId)
      this.clients.splice(index, 1)
      this.log.info(`Active clients : ${this.clients.length}`)
    } catch (error) {
      this.log.error(`Failed to remove a client: ${error}`)
    }
  }
}
