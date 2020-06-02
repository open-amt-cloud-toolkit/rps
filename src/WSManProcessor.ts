/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 * Description:
 **********************************************************************/
import { ILogger } from "./interfaces/ILogger";
import { ClientResponseMsg as ResponseMessage } from "./utils/ClientResponseMsg";
import { ClientMsg, Payload} from "./RCS.Config";
import { IClientManager } from "./interfaces/IClientManager";

const wscomm = require("./amt-libraries/amt-wsman-comm");
const wsman = require("./amt-libraries/amt-wsman");
const amt = require("./amt-libraries/amt");

export class WSManProcessor {
  cache: any;

  constructor(
    private logger: ILogger,
    private clientManager: IClientManager,
    private responseMsg: ResponseMessage
  ) {
    this.cache = {};
  }

  /**
   * @description parse a wsman response and return appropriate json
   * @param {any} wsManResponseXML wsman response xml received from PPC
   * @param {string} clientId Id to keep track of connections
   * @param {string} statusCode
   * @returns {string} json message 
   */
  parseWsManResponseXML(wsManResponseXML: any, clientId: string, statusCode: string): any {
    let clientObj = this.clientManager.getClientObject(clientId);
    try {
      let amtstack = this.getAmtStack(clientId);
      amtstack.wsman.comm.socketAccumulator = "";
      amtstack.wsman.comm.socketHeader = null;
      amtstack.wsman.comm.socketData = "";

      amtstack.wsman.comm.xxOnSocketData(wsManResponseXML);
      if (statusCode == "401") {
        amtstack.wsman.comm.xxOnSocketConnected();
        if (clientObj.payload) {
          let payload = clientObj.payload;
          clientObj.payload = null;
          return this.responseMsg.get( clientId,payload,"wsman","ok","alls good!");
        }
      } else {
        if (clientObj.payload) {
          let response = clientObj.payload;
          clientObj.payload = null;
          return response;
        }
      }
    } catch {
      this.logger.error(`${clientId} : Failed to parse response data`);
    }
    return null;
  }

   /**
   * @description add cert chain to AMT
   * @param {any} cert 
   * @param {boolean} leaf 
   * @param {boolean} root
   * @param {string} clientId
   */
  async getCertChainWSManResponse(cert: any, leaf: boolean, root: boolean, clientId: string) {
    let amtstack = this.getAmtStack(clientId);
    let clientObj = this.clientManager.getClientObject(clientId);
    await amtstack.IPS_HostBasedSetupService_AddNextCertInChain(cert,leaf,root,(stack, name, jsonResponse, status) => {
        if (status !== 200) {
          console.log("AddNextCertInChain error, status=" + status);
          clientObj.payload = status;
        } else if (jsonResponse["Body"]["ReturnValue"] !== 0) {
          console.log("AddNextCertInChain error: " + jsonResponse["Body"]["ReturnValue"]);
          clientObj.payload = jsonResponse;
        } else {
          clientObj.payload = jsonResponse;
        }
      }
    );
  }

   /**
   * @description add cert chain to AMT
   * @param {any} cert 
   * @param {boolean} leaf 
   * @param {boolean} root
   * @param {string} clientId
   */
  async setupACM(clientId: string, password: any, nonce: any, signature: any) {
    let clientObj = this.clientManager.getClientObject(clientId);
    let amtstack = this.getAmtStack(clientId);
    await amtstack.IPS_HostBasedSetupService_AdminSetup(2,password,nonce,2,signature,(stack, name, jsonResponse, status) => {
        if (status !== 200) {
          console.log("Error, AdminSetup status: " + status);
        } else if (jsonResponse["Body"]["ReturnValue"] != 0) {
          clientObj.payload = jsonResponse;
        } else {
          clientObj.payload = jsonResponse;
        }
      }
    ); 
  }
   /**
   * @description To activate AMT in client control mode 
   * @param {string} clientId
   * @param {any} password
   */
  async setupCCM(clientId: string, password: any) {
    let clientObj = this.clientManager.getClientObject(clientId);
    let amtstack = this.getAmtStack(clientId);
    await amtstack.IPS_HostBasedSetupService_Setup(2,password,null,null,null,null,(stack, name, jsonResponse, status) => {
        if (status !== 200) {
          this.logger.debug(`Failed to activate in client control mode.status: ${status}`);
        } else if (jsonResponse["Body"]["ReturnValue"] != 0) {
          clientObj.payload = jsonResponse;
        } else {
          clientObj.payload = jsonResponse;
        }
      }
    );
  }

  /**
   * @description Create wsman stack
   * @param {string} clientId Id to keep track of connections
   * @returns {any} wsman stack
   */
  getAmtStack(clientId: string): any {
    let payload: Payload;
    let clientObj = this.clientManager.getClientObject(clientId);
    try {
      if (typeof this.cache[clientId] === "undefined") {
        payload = clientObj.ClientData.payload;
        let SetupCommunication = (host: string, port: number) => {
          clientObj.socketConn = { socket: clientObj.ClientSocket, state: 1 };
          clientObj.socketConn.close = () => {
            if (clientObj.socketConn.onStateChange) {
              clientObj.socketConn.onStateChange(clientObj.ClientSocket, 0);
            }
          };
          clientObj.socketConn.write = (data: any) => {
            let wsmanJsonPayload:ClientMsg = this.responseMsg.get(clientId,data,"wsman","ok","alls good!");
            this.logger.debug(`ClientResponseMsg: Message sending to device ${payload.uuid}: ${JSON.stringify(wsmanJsonPayload, null, "\t")}`);
            clientObj.ClientSocket.send(JSON.stringify(wsmanJsonPayload));
          };  
          return clientObj.socketConn;
        };
        let wsstack = new wsman(wscomm,payload.uuid,16992,payload.username,payload.password,0,null,SetupCommunication);
        this.cache[clientId] = new amt(wsstack);
      }
    } catch (error) {
      this.logger.error(`${clientId} : Error while creating the wsman stack`);
    }
    return this.cache[clientId];
  }

  /**
   * @description Create wsman message
   * @param {string} clientId Id to keep track of connections
   * @param {string} action WSMan action
   */
  async getWSManResponseXML_BatchEnum(clientId: string, action: string) {
    let clientObj = this.clientManager.getClientObject(clientId);
    try {
      let amtstack = this.getAmtStack(clientId);
      await amtstack.BatchEnum("",["*" + action],(stack, name, jsonResponse, status) => {
          if (status != 200) {
            console.log("Request failed during hardware_info BatchEnum Exec.");
          }
          clientObj.payload = jsonResponse;
        }
      );
      if (clientObj.socketConn && clientObj.socketConn.onStateChange && clientObj.readyState == undefined) {
        clientObj.readyState = 2;
        this.clientManager.setClientObject(clientObj);
        clientObj.socketConn.onStateChange(clientObj.ClientSocket, clientObj.readyState);
      }  
    } catch (error) {
      this.logger.error(`${clientId} : Failed to get the wsman for ${action}`);
    }
  }
}
