/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Brian Osburn
 **********************************************************************/
import { v4 as uuid } from "uuid";

import { Deactivator } from "../actions/Deactivator";
import Logger from "../Logger";
import { NodeForge } from "../NodeForge";
import { Configurator } from "../Configurator";
import { config } from "./helper/Config";
import { ClientResponseMsg } from "../utils/ClientResponseMsg";
import { WSManProcessor } from "../WSManProcessor";
import { ClientManager } from "../ClientManager";
import { Validator } from "../Validator";
import { EnvReader } from '../utils/EnvReader';

//EnvReader.InitFromEnv(config);

EnvReader.GlobalEnvConfig = config;

let nodeForge = new NodeForge();
let configurator = new Configurator();
let clientManager = ClientManager.getInstance(Logger("ClientManager"));
let responseMsg = new ClientResponseMsg(Logger("ClientResponseMsg"), nodeForge);
let amtwsman = new WSManProcessor(Logger(`WSManProcessor`), clientManager, responseMsg);
let validator = new Validator(Logger("Validator"), configurator, clientManager, nodeForge);
let deactivate = new Deactivator(Logger(`Deactivator`), responseMsg, amtwsman, clientManager);
let clientId, deactivatemsg;

beforeAll(() => {
  clientId = uuid();
  deactivatemsg = {
    method: "deactivation",
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
      action: "deactivate"
    }
  };
  clientManager.addClient({
    ClientId: clientId,
    ClientSocket: null,
    ClientData: deactivatemsg
  });
});

describe("deactivate from admin control mode", () => {
  test("should throw an error when the payload is null", async () => {
    let clientObj = clientManager.getClientObject(clientId);
    clientObj.uuid = deactivatemsg.payload.uuid;
    clientManager.setClientObject(clientObj);

    let clientMsg = { payload: null };
    let deactivateMsg = await deactivate.execute(clientMsg, clientId);
    expect(deactivateMsg.message).toEqual(`Device ${deactivatemsg.payload.uuid} deactivate failed : Missing/invalid WSMan response payload.`);
  });
});
