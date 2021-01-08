/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Madhavi Losetty
 **********************************************************************/
import { ClientObject } from '../RCS.Config'

export interface IClientManager{
    clients: Array<ClientObject>;
    addClient(client: ClientObject): void;
    removeClient(ClientId: string): void;
    getClientIndex(ClientId: string): number;
    getClientObject(clientId: string): ClientObject;
    setClientObject(clientObj: ClientObject);
}
