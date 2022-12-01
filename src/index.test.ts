/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import * as indexFile from './Index'
import * as exponentialBackoff from 'exponential-backoff'
import { ISecretManagerService } from './interfaces/ISecretManagerService'
import { IDB } from './interfaces/database/IDb'

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
    // process.env = { ...env }
    process.env.NODE_ENV = 'test'
    // indexFile = require('./Index')
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
    // const indexFile = require('./Index')
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
