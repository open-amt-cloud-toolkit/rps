/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import Logger from './Logger.js'
import { Environment } from './utils/Environment.js'
import { backOff } from 'exponential-backoff'
import { type RPSConfig } from './models/index.js'
import { type IServiceManager } from './interfaces/IServiceManager.js'

const log = new Logger('Index')

export const waitForServiceManager = async function (service: IServiceManager, serviceName: string): Promise<void> {
  await backOff(async () => await service.health(serviceName), {
    retry: (e: any, attemptNumber: number) => {
      log.info(`waiting for consul[${attemptNumber}] ${e.code || e.message || e}`)
      return true
    }
  })
}
export async function processServiceConfigs(consul: IServiceManager, config: RPSConfig): Promise<boolean> {
  const prefix = Environment.Config.consul_key_prefix
  const consulValues = await consul.get(prefix)
  if (consulValues == null) {
    await consul.seed(prefix, config)
  } else {
    consul.process(consulValues)
  }
  return true
}
