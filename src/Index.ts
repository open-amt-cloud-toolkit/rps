/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import express from 'express'
import cors from 'cors'
import Logger from './Logger'
import { WebSocketListener } from './WebSocketListener'
import { Configurator } from './Configurator'
import { Environment } from './utils/Environment'
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
import { existsSync, lstatSync, readdirSync } from 'fs'
import path = require('path')
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
Environment.Config = config
const app = express()
app.use(cors())
app.use(express.urlencoded())
app.use(express.json())

const configurator = new Configurator()
log.silly(`WebSocket Cert Info ${JSON.stringify(Environment.Config.WSConfiguration)}`)
const server: WebSocketListener = new WebSocketListener(new Logger('WebSocketListener'), Environment.Config.WSConfiguration, configurator.dataProcessor)

const mqtt: MqttProvider = new MqttProvider(config)
mqtt.connectBroker()

const dbFactory = new DbCreatorFactory(config)

export const loadCustomMiddleware = async function (): Promise<express.RequestHandler[]> {
  const pathToCustomMiddleware = './src/middleware/custom'
  const middleware: express.RequestHandler[] = []
  const doesExist = existsSync(pathToCustomMiddleware)
  const isDirectory = lstatSync(pathToCustomMiddleware).isDirectory()
  if (doesExist && isDirectory) {
    const files = readdirSync(pathToCustomMiddleware)
    for (const file of files) {
      const pathToMiddleware = path.join('../src/middleware/custom/', file)
      console.log(pathToMiddleware)
      const customMiddleware = await import(pathToMiddleware)
      if (customMiddleware?.default != null) {
        middleware.push(customMiddleware.default)
      }
    }
  }

  return middleware
}

loadCustomMiddleware().then(customMiddleware => {
  app.use('/api/v1', async (req: express.Request, res: express.Response, next) => {
    if (configurator.secretsManager) {
      (req as any).secretsManager = configurator.secretsManager
    }
    req.db = await dbFactory.getDb()
    next()
  }, customMiddleware, routes)
}).catch(err => {
  log.error('Error loading custom middleware')
  log.error(err)
  process.exit(0)
})

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
      log.info(`waiting for secret manager service[${attemptNumber}] ${e.code || e.message || e}`)
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
