/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 * Description: Keeps track of client connections
 **********************************************************************/

import { IClientManager }  from "./interfaces/IClientManager";
import {ClientObject} from "./RCS.Config";
import { ILogger} from "./interfaces/ILogger";

export class ClientManager implements IClientManager {
  
  clients: Array<ClientObject>;
  logger: any;

  private static instance: ClientManager;

  private constructor(logger: ILogger) {
    this.logger = logger;
    this.clients = new Array<ClientObject>();
  }

  // Single entry to keep track of all client connections
  static getInstance(logger: any) {
    if (!ClientManager.instance) {
      ClientManager.instance = new ClientManager(logger);
    }
    return ClientManager.instance;
  }

  getClientObject(clientId: string): ClientObject {
    let clientObj: ClientObject = { ClientId: clientId };
    let index = this.getClientIndex(clientId);
    if (index > -1) {
      clientObj = this.clients[index];
    }
    return clientObj;
  }

  setClientObject(clientObj: ClientObject) {
    let index = this.getClientIndex(clientObj.ClientId);
    if (index > -1) {
      this.clients[index] = clientObj;
    }
  }

  getClientIndex(ClientId: string): number {
    let index: number;
    try {
      index = this.clients.findIndex(x => x.ClientId === ClientId);
    } catch (error) {
      this.logger.error(`Failed to get a client index: ${error}`);
      return -1;
    }
    return index;
  }

  addClient(client: ClientObject): void {
    try {
      this.clients.push(client);
      this.logger.info(`Active clients : ${this.clients.length}`);
    } catch (error) {
      this.logger.error(`Failed to add a client: ${error}`);
    }
  }

  removeClient(clientId: string) {
    try {
      let index = this.getClientIndex(clientId);
      this.clients.splice(index, 1);
      this.logger.info(`Active clients : ${this.clients.length}`);
    } catch (error) {
      this.logger.error(`Failed to remove a client: ${error}`);
    }
  }
  
}
