/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import * as express from 'express'
import * as cors from 'cors'
import Logger from './Logger'
import { WebSocketListener } from './WebSocketListener'
import { Configurator } from './Configurator'
import { EnvReader } from './utils/EnvReader'
import { RPSConfig, mapConfig } from './models'
import { parseValue } from './utils/parseEnvValue'
import dot = require('dot-object')
import routes from './routes'
import rc = require('rc')
import { MqttProvider } from './utils/MqttProvider'
import { DbCreatorFactory } from './repositories/factories/DbCreatorFactory'
import { backOff } from 'exponential-backoff'
import { ISecretManagerService } from './interfaces/ISecretManagerService'
import { IDB } from './interfaces/database/IDb'
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
const config: RPSConfig = mapConfig(rcconfig, dot)
log.silly(`Updated config... ${JSON.stringify(config, null, 2)}`)
EnvReader.GlobalEnvConfig = config
const app = express()
app.use(cors())
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

const configurator = new Configurator()
log.silly(`WebSocket Cert Info ${JSON.stringify(EnvReader.GlobalEnvConfig.WSConfiguration)}`)
const server: WebSocketListener = new WebSocketListener(new Logger('WebSocketListener'), EnvReader.GlobalEnvConfig.WSConfiguration, configurator.dataProcessor)

const mqtt: MqttProvider = new MqttProvider(config)
mqtt.connectBroker()

const dbFactory = new DbCreatorFactory(config)
app.use('/api/v1', async (req: express.Request, res: express.Response, next) => {
  if (configurator.secretsManager) {
    (req as any).secretsManager = configurator.secretsManager
  }
  req.db = await dbFactory.getDb()
  next()
}, routes)

export const waitForDB = async function (db: IDB): Promise<void> {
  await backOff(async () => await db.query('SELECT 1'), {
    retry: (e: any, attemptNumber: number) => {
      log.info(`waiting for db[${attemptNumber}] ${e.code || e.message || e}`)
      return true
    }
  })
}

export const waitForSecretsManager = async function (secretsManager: ISecretManagerService): Promise<void> {
  await backOff(async () => await secretsManager.health(), {
    retry: (e: any, attemptNumber: number) => {
      log.info(`waiting for secret manager service[${attemptNumber}] ${e.message || e.code || e}`)
      return true
    }
  })
}

// the env keys have been lower-cased!!
if (process.env.node_env !== 'test') {
  dbFactory.getDb()
    .then(async (db) => {
      await waitForDB(db)
      await waitForSecretsManager(configurator.secretsManager)
    })
    .then(() => {
      app.listen(config.webport, () => {
        log.info(`RPS Microservice Rest APIs listening on http://:${config.webport}.`)
      })
      server.connect()
    })
    .catch(err => {
      log.error(err)
    })
}
