/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import * as WebSocket from "ws";

export interface IValidator {
    parseClientMsg(message: WebSocket.Data, clientId: string): any;
    isDigestRealmValid(realm: string): boolean;
    validateActivationMsg(message: any, clientId: string): any;
}