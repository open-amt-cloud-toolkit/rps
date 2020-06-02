/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 * Description: Helps to validate the client data
 **********************************************************************/
import * as WebSocket from "ws";

import { IValidator } from "./interfaces/IValidator";
import { ILogger } from "./interfaces/ILogger";
import { ClientMsg, ClientAction, Payload } from "./RCS.Config";
import { IConfigurator } from "./interfaces/IConfigurator";
import { IClientManager } from "./interfaces/IClientManager";
import { NodeForge } from "./NodeForge";
import { IClientMessageParser } from "./interfaces/IClientMessageParser";
import { ClientMsgJsonParser } from "./utils/ClientMsgJsonParser";
import { RPSError } from "./utils/RPSError";

export class Validator implements IValidator {
  jsonParser: IClientMessageParser;

  constructor(
    private logger: ILogger,
    private configurator: IConfigurator,
    private clientManager: IClientManager,
    private nodeForge: NodeForge
  ) {
    this.jsonParser = new ClientMsgJsonParser(this.nodeForge);
  }

  /**
   * @description Parse client message and check for mandatory information
   * @param {WebSocket.Data} message the message coming in over the websocket connection
   * @param {string} clientId Id to keep track of connections
   * @returns {ClientMsg} returns ClientMsg object if client message is valid. Otherwise returns null.
   */
  parseClientMsg(message: WebSocket.Data, clientId: string): ClientMsg {
    let msg: ClientMsg = null;
    try {
      //Parse and convert the message
      if (typeof message == "string") {
        msg = this.jsonParser.parse(message, clientId);
      }
    } catch (error) {
      this.logger.error(`${clientId}: Failed to parse client message`);
      throw error;
    }
    return msg;
  }

  /**
   * @description Validate the client message only if action is not acmactivate-success or ccmactivate-success
   * @param {ClientMsg} msg
   * @param {string} clientId
   * @returns {RCSMessage}
   */
  async validateActivationMsg(msg: ClientMsg, clientId: string) {
    let payload: Payload = null;
    if (!msg) {
      throw new RPSError(`Error while Validating the client message`);
    }
    payload = msg.payload;

    // Check for the current mode
    if (payload.currentMode > 0) {
      switch (payload.currentMode) {
        case 1: {
          throw new RPSError(`Device ${payload.uuid} already enabled in client control mode.`);
        }
        case 2: {
          throw new RPSError(`Device ${payload.uuid} already enabled in admin control mode.`);
        }
        default: {
          throw new RPSError(`Device ${payload.uuid} activation failed. It is in unknown mode.`);
        }
      }
    }else this.logger.debug (`Device ${payload.uuid} is in pre-provisioning mode`);

    // Check version and build compatibility
    if (parseInt(payload.ver) > 7 && parseInt(payload.ver) < 12) {
      if (parseInt(payload.build) < 3000) {
        throw new RPSError(`Device ${payload.uuid} activation failed. Only version ${payload.ver} with build greater than 3000 can be remotely configured `);
      }
    } else if (parseInt(payload.ver) < 7) {
      throw new RPSError(`Device ${payload.uuid} activation failed. AMT version: ${payload.ver}. Version less than 7 cannot be remotely configured `);
    }

    if (!payload.password) {
      throw new RPSError(`Device ${payload.uuid} activation failed. Missing password.`);
    }

    //Check for client requested action and profile activation
    let profileExists = await this.configurator.profileManager.doesProfileExist(payload.profile);
    if (!profileExists) {
      throw new RPSError(`Device ${payload.uuid} activation failed. Specified AMT profile name does not match list of available AMT profiles.`);
    }
    payload.action = await this.configurator.profileManager.getActivationMode(payload.profile);

    if(!payload.action){
      throw new RPSError(`Device ${payload.uuid} activation failed. Failed to get activation mode for the profile :${payload.profile}`);
    }

    // Validate client message to configure ACM message
    if (payload.action === ClientAction.ADMINCTLMODE) {
      if(!payload.certHashes){
        throw new RPSError(`Device ${payload.uuid} activation failed. Missing certificate hashes from the device.`);
      }
      if (!payload.fqdn) {
        throw new RPSError(`Device ${payload.uuid} activation failed. Missing DNS Suffix.`);
      }
      if (!(await this.configurator.domainCredentialManager.doesDomainExist(payload.fqdn))) {
        throw new RPSError(`Device ${payload.uuid} activation failed. Specified AMT domain suffix: ${payload.fqdn} does not match list of available AMT domain suffixes.`);
      }
    }

    //Store the client message
    let clientObj = this.clientManager.getClientObject(clientId);
    msg.payload = payload;
    clientObj.ClientData = msg;
    this.clientManager.setClientObject(clientObj);
  }

  /**
   * @description Validate realm of client message
   * @param {string} realm
   * @param {string} clientId
   * @returns {boolean}
   */
  isDigestRealmValid(realm: string): boolean {
    const regex: RegExp = /[0-9A-Fa-f]{32}/g;
    let isValidRealm: boolean = false;
      let realmElements: any = {};
      if (realm && realm.startsWith(`Digest:`)) {
        realmElements = realm.split(`Digest:`);
        if (realmElements[1].length === 32 && regex.test(realmElements[1])) {
          isValidRealm = true;
        }
      }
    return isValidRealm;
  }
}
