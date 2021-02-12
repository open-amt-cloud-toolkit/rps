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
import { existsSync, readFileSync } from 'fs' // account for the Dist/ folder
import { API_RESPONSE } from './utils/constants'
// const expressWs = require('express-ws');
import routes from './routes'
import rc = require('rc')
const log = new Logger('Index')
import dot = require('dot-object')

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
EnvReader.configPath = path.join(__dirname, '../', config.datapath)
const app = express()

app.use(function (req, res, next) {
// disable Clickjacking defence

  res.setHeader('X-Frame-Options', 'SAMEORIGIN')
  res.setHeader('Access-Control-Allow-Credentials', config.corsAllowCredentials)
  const allowedOrigins: string[] = config.corsOrigin.split(',').map((domain) => {
    return domain.trim()
  })
  if (allowedOrigins.includes(req.headers.origin)) {
    res.setHeader('Access-Control-Allow-Origin', req.headers.origin)
  }
  if (config.corsHeaders != null && config.corsHeaders !== '') {
    res.setHeader('Access-Control-Allow-Headers', config.corsHeaders)
  }
  if (req.method === 'OPTIONS') {
    if (config.corsMethods != null && config.corsMethods !== '') {
      res.setHeader('Access-Control-Allow-Methods', config.corsMethods)
    } else {
      res.setHeader('Access-Control-Allow-Methods', '*')
    }
    return res.status(200).end()
  }
  next()
})

app.use(parser.json())
const configurator: IConfigurator = new Configurator()
log.silly(`WebSocket Cert Info ${JSON.stringify(EnvReader.GlobalEnvConfig.WSConfiguration)}`)
const server: WebSocketListener = new WebSocketListener(new Logger('WebSocketListener'), EnvReader.GlobalEnvConfig.WSConfiguration, configurator.clientManager, configurator.dataProcessor)

const isAuthenticated = (req, res, next): void => {
  if (req.header('X-RPS-API-Key') !== EnvReader.GlobalEnvConfig.RPSXAPIKEY) {
    res.status(401).json(API_RESPONSE(null, 'Authentication Error', 'Mismatched API key')).end()
  } else {
    next()
  }
}
// let ws = expressWs(this.app)
app.use('/api/v1', isAuthenticated, (req, res, next) => {
  if (configurator.secretsManager) {
    (req as any).secretsManager = configurator.secretsManager
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
