/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { v4 as uuid } from 'uuid';

import { IClientManager } from "../interfaces/IClientManager";
import { ClientManager } from "../ClientManager";
import { ClientObject, ClientAction } from "../RCS.Config";
import { ILogger } from '../interfaces/ILogger';
import Logger from '../Logger';


let logger: ILogger = Logger('ClientManager');
let clientManager: IClientManager = ClientManager.getInstance(logger);

describe("Check Client Manager", () => {

    it("should add a client object with action DEACTIVATE", () => {
        let clientId = uuid();
        let client: ClientObject = { ClientId: clientId, ClientSocket: null, action: ClientAction.DEACTIVATE }

        clientManager.addClient(client);

        let clientObj = clientManager.getClientObject(clientId);
        expect(clientObj.action).toEqual("deactivate");
    });

    it("should add a client object with action ADMINCTLMODE", () => {
        let clientId = uuid();
        let client: ClientObject = { ClientId: clientId, ClientSocket: null, action: ClientAction.ADMINCTLMODE }

        clientManager.addClient(client);

        let clientObj = clientManager.getClientObject(clientId);
        expect(clientObj.action).toEqual("acmactivate");
    });

    it("should add a client object with action CLIENTCTLMODE", () => {
        let clientId = uuid();
        let client: ClientObject = { ClientId: clientId, ClientSocket: null, action: ClientAction.CLIENTCTLMODE }

        clientManager.addClient(client);

        let clientObj = clientManager.getClientObject(clientId);
        expect(clientObj.action).toEqual("ccmactivate");
    });

    it("should add a client object", () => {
        let clientId = uuid();
        let client: ClientObject = { ClientId: clientId, ClientSocket: null }

        clientManager.addClient(client);
        expect(clientManager.clients.length).toEqual(1);
    });

    it("should return the same instance of client Manager", () => {

        let clientId1 = uuid();
        let clientObject1: ClientObject = { ClientId: clientId1, ClientSocket: null }
        clientManager.addClient(clientObject1);

        let newClientManager = ClientManager.getInstance(logger);
        expect(clientManager.clients.length).toEqual(newClientManager.clients.length);

    });

    it("should get a specific client object based on clientId", () => {

        let clientId1 = uuid();
        let clientObject1: ClientObject = { ClientId: clientId1, ClientSocket: null, ClientData: 'client1' }
        clientManager.addClient(clientObject1);

        let clientId2 = uuid();
        let clientObject2: ClientObject = { ClientId: clientId2, ClientSocket: null, ClientData: 'client2' }
        clientManager.addClient(clientObject2);

        let clientId3 = uuid();
        let clientObject3: ClientObject = { ClientId: clientId3, ClientSocket: null, ClientData: 'client3' }
        clientManager.addClient(clientObject3);

        expect(clientManager.clients.length).toEqual(3);

        clientManager.removeClient(clientId2);

        expect(clientManager.clients.length).toEqual(2);

        let index = clientManager.getClientIndex(clientId3)

        expect(clientManager.clients[index].ClientData).toEqual("client3");
    });

    it("should remove a client object", () => {

        let clientId1 = uuid();
        let clientObject1: ClientObject = { ClientId: clientId1, ClientSocket: null }
        clientManager.addClient(clientObject1);

        let clientId2 = uuid();
        let clientObject2: ClientObject = { ClientId: clientId2, ClientSocket: null }
        clientManager.addClient(clientObject2);

        let clientId3 = uuid();
        let clientObject3: ClientObject = { ClientId: clientId3, ClientSocket: null }
        clientManager.addClient(clientObject3);

        clientManager.removeClient(clientId2);

        expect(clientManager.clients.length).toEqual(2);
    });

    it("should update the client object", () => {
        let clientId1 = uuid();
        let clientObject1: ClientObject = { ClientId: clientId1, ClientSocket: null }
        clientManager.addClient(clientObject1);

        let clientId2 = uuid();
        let clientObject2: ClientObject = { ClientId: clientId2, ClientSocket: null }
        clientManager.addClient(clientObject2);

        let clientId3 = uuid();
        let clientObject3: ClientObject = { ClientId: clientId3, ClientSocket: null }
        clientManager.addClient(clientObject3);

        expect(clientManager.clients.length).toEqual(3);

        clientManager.removeClient(clientId1);

        expect(clientManager.clients.length).toEqual(2);

        let index = clientManager.getClientIndex(clientId2);
        clientManager.clients[index].ClientData = 'client2'

        expect(clientManager.clients[index].ClientData).toEqual("client2");

    });

    afterEach(() => {
        clientManager.clients = [];
    });

});