/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import express from 'express'
import cors from 'cors'
import Logger from './Logger.js'
import { WebSocketListener } from './WebSocketListener.js'
import { Configurator } from './Configurator.js'
import { Environment } from './utils/Environment.js'
import { type RPSConfig } from './models/index.js'
import { parseValue } from './utils/parseEnvValue.js'
import routes from './routes/index.js'
import rc from 'rc'
// import pkg from 'rc'
// const { rc } = pkg
import { MqttProvider } from './utils/MqttProvider.js'
import { DbCreatorFactory } from './factories/DbCreatorFactory.js'
import { backOff } from 'exponential-backoff'
import { type ISecretManagerService } from './interfaces/ISecretManagerService.js'
import { type IDB } from './interfaces/database/IDb.js'
import { WSEnterpriseAssistantListener } from './WSEnterpriseAssistantListener.js'
import { existsSync, lstatSync, readdirSync } from 'fs'
import * as ServiceManager from './serviceManager.js'
import { ConsulService } from './consul.js'
import { type IServiceManager } from './interfaces/IServiceManager.js'
import { extname, join } from 'path'

const log = new Logger('Index')

// To merge ENV variables. consider after lowercasing ENV since our config keys are lowercase
process.env = Object.keys(process.env)
  .reduce((destination, key) => {
    destination[key.toLowerCase()] = parseValue(process.env[key])
    return destination
  }, {})

// build config object
const config: RPSConfig = rc('rps')
config.delay_activation_sync = config.delay_timer * 1000
config.delay_setup_and_config_sync = 5000
config.delay_tls_put_data_sync = 5000
log.silly(`config: ${JSON.stringify(config, null, 2)}`)

Environment.Config = config

const app = express()
app.use(cors())
app.use(express.urlencoded())
app.use(express.json())

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

export const startItUp = (): void => {
  const configurator = new Configurator()
  log.silly(`WebSocket Cert Info ${JSON.stringify(Environment.Config)}`)
  const serverForEnterpriseAssistant: WSEnterpriseAssistantListener = new WSEnterpriseAssistantListener(new Logger('WSEnterpriseAssistantListener'))
  const server: WebSocketListener = new WebSocketListener(new Logger('WebSocketListener'), configurator.dataProcessor)

  const mqtt: MqttProvider = new MqttProvider(config)
  mqtt.connectBroker()

  const dbFactory = new DbCreatorFactory()

  const loadCustomMiddleware = async function (): Promise<express.RequestHandler[]> {
    const pathToCustomMiddleware = join(__dirname, './middleware/custom/')
    const middleware: express.RequestHandler[] = []
    const doesExist = existsSync(pathToCustomMiddleware)
    const isDirectory = lstatSync(pathToCustomMiddleware).isDirectory()
    if (doesExist && isDirectory) {
      const files = readdirSync(pathToCustomMiddleware)
      for (const file of files) {
        if (extname(file) === '.js' && !file.endsWith('test.js')) {
          const pathToMiddleware = join(pathToCustomMiddleware, file.substring(0, file.lastIndexOf('.')))
          log.info('Loading custom middleware: ' + file)
          const customMiddleware = await import(pathToMiddleware)
          if (customMiddleware?.default != null) {
            middleware.push(customMiddleware.default)
          }
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

  // the env keys have been lower-cased!!
  if (process.env.node_env !== 'test') {
    dbFactory.getDb()
      .then(async (db) => {
        await waitForDB(db)
        await waitForSecretsManager(configurator.secretsManager)
      })
      .then(() => {
        app.listen(config.web_port, () => {
          log.info(`RPS Microservice Rest APIs listening on http://:${config.web_port}.`)
        })
        server.connect()
        serverForEnterpriseAssistant.connect()
      })
      .catch(err => {
        log.error(err)
        process.exit(0)
      })
  }
}

export async function setupServiceManager (config: RPSConfig): Promise<void> {
  const consul: IServiceManager = new ConsulService(config.consul_host, config.consul_port)
  await ServiceManager.waitForServiceManager(consul, 'consul')
  await ServiceManager.processServiceConfigs(consul, config)
}

if (config.consul_enabled) {
  setupServiceManager(config).then(() => {
    startItUp()
  }).catch(err => {
    log.error(`Unable to reach consul: ${err}`)
    process.exit(0)
  })
} else {
  startItUp()
}
