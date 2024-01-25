/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type ISecretManagerService } from './interfaces/ISecretManagerService.js'
import { type IDB } from './interfaces/database/IDb.js'
import { config } from './test/helper/Config.js'
import { jest } from '@jest/globals'

const backOffSpy = jest.fn()
const processServiceConfigsSpy = jest.fn().mockReturnValue(Promise.resolve())
const waitForServiceManagerSpy = jest.fn().mockReturnValue(Promise.resolve(true))
jest.unstable_mockModule('exponential-backoff', () => ({
  backOff: backOffSpy
}))
jest.unstable_mockModule('./serviceManager.js', () => ({
  processServiceConfigs: processServiceConfigsSpy,
  waitForServiceManager: waitForServiceManagerSpy
}))
jest.unstable_mockModule('./Configurator.js', () => ({
  Configurator: jest.fn().mockImplementation(() => ({
    ready: Promise.resolve()
  }))
}))
const indexFile = await import('./Index.js')

describe('Index', () => {
  // const env = process.env
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
    await indexFile.setupServiceManager(config)
    expect(processServiceConfigsSpy).toHaveBeenCalled()
    expect(waitForServiceManagerSpy).toHaveBeenCalled()
  })

  it('should wait for db', async () => {
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
