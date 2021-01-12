/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import * as path from 'path'
import * as express from 'express'
import * as parser from 'body-parser'
import * as https from 'https'

import Logger from './Logger'
import { WebSocketListener } from './WebSocketListener'
import { Configurator } from './Configurator'
import { EnvReader } from './utils/EnvReader'
import { RCSConfig, mapConfig } from './models/Rcs'
import { IConfigurator } from './interfaces/IConfigurator'
import { parseValue } from './utils/parseEnvValue'
import { existsSync, readFileSync } from 'fs'
const rc = require('rc')
const log = new Logger('Index')
const dot = require('dot-object')

// To merge ENV variables. consider after lowercasing ENV since our config keys are lowercase
process.env = Object.keys(process.env)
  .reduce((destination, key) => {
    destination[key.toLowerCase()] = parseValue(process.env[key])
    return destination
  }, {})

// build config object
const rcconfig = rc('rps')
log.silly(`Before config... ${JSON.stringify(rcconfig, null, 2)}`)
const config: RCSConfig = mapConfig(rcconfig, dot)
log.silly(`Updated config... ${JSON.stringify(config, null, 2)}`)
EnvReader.GlobalEnvConfig = config
EnvReader.configPath = path.join(__dirname, '../', config.datapath) // account for the Dist/ folder
// const expressWs = require('express-ws');
const routes = require('./routes')
const app = express()

if (config.NodeEnv === 'dev') {
  // disable Clickjacking defence
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', '*')
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Methods', '*')
      return res.status(200).json({})
    }
    next()
  })
} else {
  // Clickjacking defence
  app.use(function (req, res, next) {
    res.setHeader('X-Frame-Options', 'SAMEORIGIN')
    next()
  })
}

app.use(parser.json())
const configurator: IConfigurator = new Configurator()
log.silly(`WebSocket Cert Info ${JSON.stringify(EnvReader.GlobalEnvConfig.WSConfiguration)}`)
const server: WebSocketListener = new WebSocketListener(new Logger('WebSocketListener'), EnvReader.GlobalEnvConfig.WSConfiguration, configurator.clientManager, configurator.dataProcessor)

const isAuthenticated = (req, res, next) => {
  if (req.header('X-RPS-API-Key') !== EnvReader.GlobalEnvConfig.RPSXAPIKEY) {
    res.status(401).end('Not Authenticated.')
  } else {
    next()
  }
}
// let ws = expressWs(this.app)
app.use('/api/v1', isAuthenticated, (req, res, next) => {
  if (configurator.secretsManager) {
    req.secretsManager = configurator.secretsManager
  }
  next()
}, routes)

let serverHttps: any
if (config.https) {
  const WebSocketCertificatePath = path.join(__dirname, EnvReader.GlobalEnvConfig.WSConfiguration.WebSocketCertificate)
  const WebSocketCertificateKeyPath = path.join(__dirname, EnvReader.GlobalEnvConfig.WSConfiguration.WebSocketCertificateKey)
  let RootCACertPath
  if (EnvReader.GlobalEnvConfig.WSConfiguration.RootCACert) {
    RootCACertPath = path.join(__dirname, EnvReader.GlobalEnvConfig.WSConfiguration.RootCACert)
    if (!existsSync(RootCACertPath)) {
      log.error(`Root cert ${RootCACertPath} doesnt exist. Exiting..`)
      process.exit(1)
    }
  }
  if (!existsSync(WebSocketCertificatePath)) {
    log.error(`Cert File ${WebSocketCertificatePath} doesnt exist. Exiting..`)
    process.exit(1)
  }
  if (!existsSync(WebSocketCertificateKeyPath)) {
    log.error(`Cert KeyFile ${WebSocketCertificateKeyPath} doesnt exist. Exiting..`)
    process.exit(1)
  }
  const certs: any = {
    webConfig: {
      key: readFileSync(WebSocketCertificateKeyPath),
      cert: readFileSync(WebSocketCertificatePath),
      secureOptions: ['SSL_OP_NO_SSLv2', 'SSL_OP_NO_SSLv3', 'SSL_OP_NO_COMPRESSION', 'SSL_OP_CIPHER_SERVER_PREFERENCE', 'SSL_OP_NO_TLSv1', 'SSL_OP_NO_TLSv11'],
      ca: (EnvReader.GlobalEnvConfig.WSConfiguration.RootCACert !== '' ? readFileSync(RootCACertPath) : '')
    }
  }
  log.debug(`Web Endpoint Cert Info ${JSON.stringify(certs.webConfig)}`)
  serverHttps = https.createServer(certs.webConfig, app)
  // this.expressWs = expressWs(this.app, this.serverHttps);
}

if (config.https) {
  serverHttps.listen(config.webport, () => {
    log.info(`RPS Microservice Rest APIs listening on https://:${config.webport}.`)
  })
} else {
  app.listen(config.webport, () => {
    log.info(`RPS Microservice Rest APIs listening on http://:${config.webport}.`)
  })
}
server.connect()
