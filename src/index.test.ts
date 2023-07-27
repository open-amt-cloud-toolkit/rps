/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import * as indexFile from './Index'
import * as exponentialBackoff from 'exponential-backoff'
import { type ISecretManagerService } from './interfaces/ISecretManagerService'
import { type IDB } from './interfaces/database/IDb'
import { config } from './test/helper/Config'
import { type IServiceManager } from './interfaces/IServiceManager'
import { ConsulService } from './consul'

const consul: IServiceManager = new ConsulService('consul', '8500')
let componentName: string

describe('Index', () => {
  // const env = process.env
  componentName = 'RPS'
  afterEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    jest.resetAllMocks()
    // process.env = env
  })
  beforeEach(() => {
    jest.clearAllMocks()
    jest.restoreAllMocks()
    jest.resetAllMocks()
    jest.resetModules()
    config.consul_enabled = false
    jest.spyOn(indexFile, 'startItUp').mockImplementation(() => {})
    // process.env = { ...env }
    process.env.NODE_ENV = 'test'
    /*
    jest.mock('fs', () => ({
      existsSync: jest.fn(() => true),
      lstatSync: jest.fn(() => ({ isDirectory: () => true })),
      readdirSync: jest.fn(() => ['example.js'] as any)
    }))
    */
    // jest.mock('./middleware/custom/example', () => function (req, res, next) {})
  })

  /*
  it('should load custom middleware', async () => {
    const result = await indexFile.loadCustomMiddleware()
    expect(result.length).toBe(1)
  })
  */

  it('Should pass setupServiceManager', async () => {
    const waitSpy = jest.spyOn(indexFile, 'waitForServiceConfig').mockReturnValue(Promise.resolve())
    const prcSpy = jest.spyOn(indexFile, 'processServiceConfigs').mockReturnValue(Promise.resolve(true))

    await indexFile.setupServiceManager(config)
    expect(waitSpy).toHaveBeenCalled()
    expect(prcSpy).toHaveBeenCalled()
  })

  it('should pass setupServiceManager', async () => {
    const waitSpy = jest.spyOn(indexFile, 'waitForServiceConfig').mockReturnValue(Promise.resolve())
    const prcSpy = jest.spyOn(indexFile, 'processServiceConfigs').mockReturnValue(Promise.resolve(true))

    await indexFile.setupServiceManager(config)
    expect(waitSpy).toHaveBeenCalled()
    expect(prcSpy).toHaveBeenCalled()
  })

  it('should pass processServiceConfigs empty Consul', async () => {
    consul.get = jest.fn(() => null)
    consul.seed = jest.fn(async () => await Promise.resolve(true))
    await indexFile.processServiceConfigs(consul, config)
    expect(consul.get).toHaveBeenCalled()
    expect(consul.seed).toHaveBeenCalled()
  })

  it('should pass processServiceConfigs empty Consul', async () => {
    consul.get = jest.fn(() => null)
    consul.seed = jest.fn(async () => await Promise.resolve(true))
    await indexFile.processServiceConfigs(consul, config)
    expect(consul.get).toHaveBeenCalledWith(config.consul_key_prefix)
    expect(consul.seed).toHaveBeenCalledWith(config.consul_key_prefix, config)
  })
  it('should pass processServiceConfigs seeded Consul', async () => {
    const consulValues: Array<{ Key: string, Value: string }> = [
      {
        Key: componentName + '/config',
        Value: '{"web_port": 8081, "delay_timer": 12}'
      }
    ]
    consul.get = jest.fn(async () => await Promise.resolve(consulValues))
    consul.process = jest.fn(() => JSON.stringify(consulValues, null, 2))
    await indexFile.processServiceConfigs(consul, config)
    expect(consul.get).toHaveBeenCalledWith(config.consul_key_prefix)
    expect(consul.process).toHaveBeenCalledWith(consulValues)
  })

  it('should wait for db', async () => {
    const backOffSpy = jest.spyOn(exponentialBackoff, 'backOff')
    let shouldBeOk = false
    const dbMock: IDB = {
      query: jest.fn(() => {
        if (shouldBeOk) return null
        shouldBeOk = true
        throw new Error('error')
      })
    } as any
    await indexFile.waitForDB(dbMock)
    expect(backOffSpy).toHaveBeenCalled()
  })

  it('should wait for secret provider', async () => {
    const backOffSpy = jest.spyOn(exponentialBackoff, 'backOff')
    let shouldBeOk = false
    const secretMock: ISecretManagerService = {
      health: jest.fn(() => {
        if (shouldBeOk) return null
        shouldBeOk = true
        throw new Error('error')
      })
    } as any
    await indexFile.waitForSecretsManager(secretMock)
    expect(backOffSpy).toHaveBeenCalled()
  })
})
