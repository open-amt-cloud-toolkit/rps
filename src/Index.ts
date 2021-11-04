/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import * as express from 'express'
import * as cors from 'cors'
import Logger from './Logger'
import { WebSocketListener } from './WebSocketListener'
import { Configurator } from './Configurator'
import { EnvReader } from './utils/EnvReader'
import { RCSConfig, mapConfig } from './models/Rcs'
import { IConfigurator } from './interfaces/IConfigurator'
import { parseValue } from './utils/parseEnvValue'
import dot = require('dot-object')
import routes from './routes'
import rc = require('rc')
import { MqttProvider } from './utils/MqttProvider'
import { DbCreatorFactory } from './repositories/factories/DbCreatorFactory'
const log = new Logger('Index')

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
const app = express()
app.use(cors())
app.use(express.urlencoded())
app.use(express.json())

const configurator: IConfigurator = new Configurator()
log.silly(`WebSocket Cert Info ${JSON.stringify(EnvReader.GlobalEnvConfig.WSConfiguration)}`)
const server: WebSocketListener = new WebSocketListener(new Logger('WebSocketListener'), EnvReader.GlobalEnvConfig.WSConfiguration, configurator.clientManager, configurator.dataProcessor)

const mqtt: MqttProvider = new MqttProvider(config)
mqtt.connectBroker()

app.use('/api/v1', async (req: express.Request, res: express.Response, next) => {
  if (configurator.secretsManager) {
    (req as any).secretsManager = configurator.secretsManager
  }
  const newdb = new DbCreatorFactory(config)
  req.db = await newdb.getDb()
  next()
}, routes)

app.listen(config.webport, () => {
  log.info(`RPS Microservice Rest APIs listening on http://:${config.webport}.`)
})

server.connect()
