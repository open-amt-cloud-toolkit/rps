/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import * as path from "path";
import * as express from 'express';
import * as parser from "body-parser";
import * as https from "https";

import Logger from "./Logger";
import { WebSocketListener } from "./WebSocketListener";
import { Configurator } from "./Configurator";
import { EnvReader } from "./utils/EnvReader";
import { RCSFileImporter } from "./RCSFileImporter";
import { RCSConfig } from "./models/Rcs";
import { IConfigurator } from "./interfaces/IConfigurator";

let log = Logger(`Index`);

const nodeENV = process.env.NODE_ENV || 'dev';
//const expressWs = require('express-ws');
const routes = require('./routes');

EnvReader.configPath = path.join(process.cwd(), `app.config.${nodeENV}.json`);

let config: RCSConfig = new RCSFileImporter(Logger("RCSFileImporter"), EnvReader.configPath).importconfig();
EnvReader.InitFromEnv(config);

if (config.devmode === true) {
  config.VaultConfig.usevault = false;
  config.DbConfig.useDbForConfig = false;
}

log.info(`Updated config... ${JSON.stringify(config, null, 2)}`);

let app = express();

app.use(parser.json());

let configurator: IConfigurator = new Configurator();

let server: WebSocketListener = new WebSocketListener(Logger(`WebSocketListener`), EnvReader.GlobalEnvConfig.WSConfiguration, configurator.clientManager, configurator.dataProcessor);

let isAuthenticated = (req, res, next) => {
  if (req.header('X-RPS-API-Key') !== EnvReader.GlobalEnvConfig.RPSXAPIKEY)
    res.status(401).end("Not Authenticated.")
  else
    next(); 
}
//let ws = expressWs(this.app)
app.use('/api/v1', isAuthenticated, (req, res, next) => {
  if (configurator.secretsManager)
    req.secretsManager = configurator.secretsManager;
  next();
}, routes)

let serverHttps: any;
if (config.https) {
  let certs = EnvReader.getCertConfig();
  serverHttps = https.createServer(certs.webConfig, app);
  // this.expressWs = expressWs(this.app, this.serverHttps);
}

//Clickjacking defence
app.use(function (req, res, next) {
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  next();
})

if (config.https) {
  serverHttps.listen(config.webport, () => {
   console.log(`RPS Microservice Rest APIs listening on ${config.webport}.`);
  });
}
else {
  app.listen(config.webport, () => {
    console.log(`RPS Microservice Rest APIs listening on ${config.webport}.`);
  });
}
server.connect();