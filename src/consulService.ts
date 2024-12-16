/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import Consul from 'consul'
import Logger from './Logger.js'
import { type RPSConfig } from './models/index.js'
import type { IServiceManager } from './interfaces/IServiceManager.js'
import { Environment } from './utils/Environment.js'

export class ConsulService implements IServiceManager {
  consul: Consul
  log = new Logger('ConsulService')
  constructor(host: string, port: number) {
    this.consul = new Consul({
      host,
      port,
      secure: false // set to true if your Consul server uses https
    })
  }

  async health(serviceName: string): Promise<any> {
    return await this.consul.health.service({ service: serviceName, passing: true })
  }

  async seed(prefix: string, config: RPSConfig): Promise<boolean> {
    try {
      await this.consul.kv.set(`${prefix}/config`, JSON.stringify(config, null, 2))
      this.log.info('Wrote configuration settings to Consul.')
      return true
    } catch (e) {
      return false
    }
  }

  async get(prefix: string): Promise<any> {
    return await this.consul.kv.get({ key: prefix + '/', recurse: true })
  }

  process(consulValues: object): string {
    let value = ''
    for (const consulKey in consulValues) {
      value = consulValues[consulKey].Value
      Environment.Config = JSON.parse(value)
    }
    return value
  }
}
