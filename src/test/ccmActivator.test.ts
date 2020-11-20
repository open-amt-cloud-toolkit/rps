/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import { v4 as uuid } from "uuid";

import { CCMActivator } from "../actions/CCMActivator";
import Logger from "../Logger";
import { SignatureHelper } from "../utils/SignatureHelper";
import { NodeForge } from "../NodeForge";
import { Configurator } from "../Configurator";
import { config } from "./helper/Config";
import { ClientResponseMsg } from "../utils/ClientResponseMsg";
import { WSManProcessor } from "../WSManProcessor";
import { ClientManager } from "../ClientManager";
import { Validator } from "../Validator";
import { EnvReader } from '../utils/EnvReader';
import { CIRAConfigurator } from "../actions/CIRAConfigurator";

//EnvReader.InitFromEnv(config);
EnvReader.GlobalEnvConfig = config;
let nodeForge = new NodeForge();
let helper = new SignatureHelper(nodeForge);
let configurator = new Configurator();
let clientManager = ClientManager.getInstance(Logger("ClientManager"));
let responseMsg = new ClientResponseMsg(Logger("ClientResponseMsg"), nodeForge);
let amtwsman = new WSManProcessor(Logger(`WSManProcessor`), clientManager, responseMsg);
let validator = new Validator(Logger("Validator"), configurator, clientManager, nodeForge);
let ciraConfig = new CIRAConfigurator(Logger(`CIRAConfig`),configurator, responseMsg, amtwsman, clientManager);
let ccmActivate = new CCMActivator(Logger(`CCMActivator`), configurator, responseMsg, amtwsman, clientManager, validator, ciraConfig);
let clientId, activationmsg;

beforeAll(() => {
  clientId = uuid();
  activationmsg = {
    method: "activation",
    apiKey: "key",
    appVersion: "1.0.0",
    protocolVersion: "2.0.0",
    status: "ok",
    message: "all's good!",
    payload: {
      ver: "11.8.50",
      build: "3425",
      password: "KQGnH+N5qJ8YLqjEFJMnGSgcnFLMv0Tk",
      currentMode: 0,
      sku: "16392",
      uuid: "4bac9510-04a6-4321-bae2-d45ddf07b684",
      username: "$$OsAdmin",
      client: "PPC",
      profile: "profile1",
      action: "ccmactivate"
    }
  };
  clientManager.addClient({
    ClientId: clientId,
    ClientSocket: null,
    ClientData: activationmsg
  });
});

describe("Activate in client control mode", () => {
  test("should throw an error when the payload is null", async () => {
    let clientObj = clientManager.getClientObject(clientId);
    clientObj.uuid = activationmsg.payload.uuid;
    clientManager.setClientObject(clientObj);
    let clientMsg = { payload: null };
    let ccmactivateMsg = await ccmActivate.execute(clientMsg, clientId);
    expect(ccmactivateMsg.message).toEqual(`Device ${activationmsg.payload.uuid} activation failed : Missing/invalid WSMan response payload.`);
  });
});
