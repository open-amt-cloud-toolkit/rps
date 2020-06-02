/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: Activate AMT in client control mode
 * Author : Madhavi Losetty
 **********************************************************************/

import { IActivator } from "../interfaces/IActivator";
import { ICertManager } from "../interfaces/ICertManager";
import { ILogger } from "../interfaces/ILogger";
import { SignatureHelper } from "../utils/SignatureHelper";
import { ClientMsg } from "../RCS.Config";
import { IConfigurator } from "../interfaces/IConfigurator";
import { AMTDeviceDTO } from "../repositories/dto/AmtDeviceDTO";
import { ClientResponseMsg } from "../utils/ClientResponseMsg";
import { WSManProcessor } from "../WSManProcessor";
import { IClientManager } from "../interfaces/IClientManager";
import { RPSError } from "../utils/RPSError";
import { IValidator } from "../interfaces/IValidator";
import { EnvReader } from "../utils/EnvReader";

export class CCMActivator implements IActivator {
  certManager: ICertManager;
  constructor(
    private logger: ILogger,
    private configurator: IConfigurator,
    private signatureHelper: SignatureHelper,
    private responseMsg: ClientResponseMsg,
    private amtwsman: WSManProcessor,
    private clientManager: IClientManager,
    private validator: IValidator
  ) {}

  /**
   * @description activate AMT in client control mode
   * @param {any} message valid client message
   * @param {string} clientId Id to keep track of connections
   * @returns {ClientMsg} message to sent to client
   */
  async activate(message: any, clientId: string): Promise<ClientMsg> {
    try {
      let clientObj = this.clientManager.getClientObject(clientId);
      let wsmanResponse = message.payload;

      if(!wsmanResponse){
        throw new RPSError(`Device ${clientObj.ClientData.payload.uuid} activation failed : Missing/invalid WSMan response payload.`);
      }
     
      if (wsmanResponse["AMT_GeneralSettings"] !== undefined) {
        let response = wsmanResponse["AMT_GeneralSettings"].response;
        //Validate Digest Realm
        if (!this.validator.isDigestRealmValid(response.DigestRealm)) {
          throw new RPSError(`Device ${clientObj.ClientData.payload.uuid} activation failed : Not a valid digest realm.`);
        }
        clientObj.ClientData.payload.digestRealm = response.DigestRealm;
        this.clientManager.setClientObject(clientObj);
      } else if (wsmanResponse["Header"]["Method"] === "Setup") {
        if (wsmanResponse["Body"]["ReturnValue"] !== 0) {
          throw new RPSError(`Device ${clientObj.ClientData.payload.uuid} activation failed : Error while activating the AMT device in client mode.`);
        } else
          return this.responseMsg.get(clientId,null,"success","success",`Device ${clientObj.ClientData.payload.uuid} activated in client mode.`);
      }

     let amtPassword: string = await this.configurator.profileManager.getAmtPassword(clientObj.ClientData.payload.profile);

      if (this.configurator && this.configurator.amtDeviceWriter) {
        await this.configurator.amtDeviceWriter.insert(new AMTDeviceDTO(clientObj.ClientData.payload.uuid,
          clientObj.ClientData.payload.uuid,
          EnvReader.GlobalEnvConfig.mpsusername,
          EnvReader.GlobalEnvConfig.mpspass,
          EnvReader.GlobalEnvConfig.amtusername,
          amtPassword));
      } else {
        this.logger.error(`unable to write device`);
      }
      let data: string = "admin:" + clientObj.ClientData.payload.digestRealm + ":" + amtPassword;
      let password = SignatureHelper.createMd5Hash(data);
     
      await this.amtwsman.setupCCM(clientId, password);
    } catch (error) {
      this.logger.error(
        `${clientId} : Failed to activate in client control mode : ${error}`
      );
      if (error instanceof RPSError) {
        return this.responseMsg.get(clientId, null, "error", "failed", error.message);
      } else{
        return this.responseMsg.get(clientId, null, "error", "failed", " Failed to activate in client control mode");
      }
    }
  }
}
