/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 * Description: Process client data and gets response for desired action
 **********************************************************************/
import * as WebSocket from "ws";

import { ILogger } from "./interfaces/ILogger";
import { IDataProcessor } from "./interfaces/IDataProcessor";
import { IClientManager } from "./interfaces/IClientManager";
import { ClientMsg, ClientAction, Payload } from "./RCS.Config";
import { ClientActions } from "./ClientActions";
import { ICertManager } from "./interfaces/ICertManager";
import { SignatureHelper } from "./utils/SignatureHelper";
import Logger from "./Logger";
import { IConfigurator } from "./interfaces/IConfigurator";
import { RPSError } from "./utils/RPSError";
import { WSManProcessor } from "./WSManProcessor";
import { ClientResponseMsg } from "./utils/ClientResponseMsg";
import { IValidator } from "./interfaces/IValidator";

export class DataProcessor implements IDataProcessor {
  private clientActions: ClientActions;

  constructor(
    private logger: ILogger,
    private helper: SignatureHelper,
    private configurator: IConfigurator,
    private validator: IValidator,
    private certManager: ICertManager,
    private clientManager: IClientManager,
    private responseMsg: ClientResponseMsg,
    private amtwsman: WSManProcessor
  ) {
    this.clientActions = new ClientActions(Logger(`ClientActions`), configurator, certManager, helper, responseMsg, amtwsman, clientManager, validator);
  }

  /**
   * @description Process client data and gets response for desired action
   * @param {WebSocket.Data} message the message coming in over the websocket connection
   * @param {string} clientId Id to keep track of connections
   * @returns {RCSMessage} returns configuration message
   */
  async processData(message: WebSocket.Data, clientId: string): Promise<any> {
    try {
      let clientMsg: ClientMsg = null;
      try {
        clientMsg = this.validator.parseClientMsg(message, clientId);
      } catch (parseErr) {
        throw new RPSError(parseErr);
      }
      
      if (clientMsg.method === ClientAction.ACTIVATION) {
        this.logger.debug(`ProcessData: Parsed Message received from device ${clientMsg.payload.uuid}: ${JSON.stringify(clientMsg, null, "\t")}`);
        try {
          await this.validator.validateActivationMsg(clientMsg, clientId); // Validate the activation message payload
        } catch (validateErr) {
          throw validateErr;
        }
        // Makes the first wsman call
        if (!clientMsg.payload.digestRealm) {
          await this.amtwsman.getWSManResponseXML_BatchEnum(clientId, "AMT_GeneralSettings");
        }

      } else if (clientMsg.method === ClientAction.RESPONSE) {
        let payload = this.clientManager.getClientObject(clientId).ClientData.payload;
        this.logger.debug(`ProcessData: Parsed Message received from device ${payload.uuid}: ${JSON.stringify(clientMsg, null, "\t")}`);
        let msg = clientMsg.payload.split("\r\n");
        let statusCode = msg[0].substr(9, 3).trim();

        if (statusCode === "401") {
          return this.amtwsman.parseWsManResponseXML(clientMsg.payload, clientId, statusCode);
        } else if (statusCode === "200") {
          clientMsg.payload = this.amtwsman.parseWsManResponseXML(clientMsg.payload, clientId,  statusCode);
          this.logger.debug(`Device ${payload.uuid} wsman response: ${JSON.stringify(clientMsg.payload , null, "\t")}`);
        } else{
          throw new RPSError(`Device ${payload.uuid} activation failed. Bad wsman response from AMT device`);
        }
        return await this.clientActions.BuildResponseMessage(clientMsg, clientId);
      } else {
        let uuid = clientMsg.payload.uuid ? clientMsg.payload.uuid : this.clientManager.getClientObject(clientId).ClientData.payload.uuid ;
        throw new RPSError(`Device ${uuid} Not a supported method received from AMT device`);
      }
     
    } catch (error) {
      this.logger.error(`${clientId} : Failed to process data -${error.message}`);
      if (error instanceof RPSError) {
        return this.responseMsg.get(clientId, null, "error", "failed", error.message);
      }
    }
  }
}
