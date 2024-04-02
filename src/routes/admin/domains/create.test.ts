/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { createSpyObj } from '../../../test/helper/jest.js'
import { DomainCreate } from './create.js'
import { jest } from '@jest/globals'
import { type SpyInstance, spyOn } from 'jest-mock'

describe('Domain - Create', () => {
  let resSpy
  let req
  let insertSpy: SpyInstance<any>
  let secretManagerSpy: SpyInstance<any>
  let dc: DomainCreate
  let dcReal: DomainCreate

  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { domains: { insert: jest.fn(), delete: jest.fn() } },
      secretsManager: {
        writeSecretWithObject: jest.fn()
      },
      body: { },
      query: { }
    }
    insertSpy = spyOn(req.db.domains, 'insert').mockResolvedValue({ })
    secretManagerSpy = spyOn(req.secretsManager, 'writeSecretWithObject').mockResolvedValue({ })
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
    dc = new DomainCreate()
  })
  it('should create', async () => {
    await dc.createDomain(req, resSpy)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    expect(secretManagerSpy).toHaveBeenCalledTimes(1)
    expect(resSpy.status).toHaveBeenCalledWith(201)
  })
  it('should handle error with create with write in vault fails', async () => {
    spyOn(req.db.domains, 'delete').mockResolvedValue(true)
    secretManagerSpy = spyOn(req.secretsManager, 'writeSecretWithObject').mockResolvedValue(null)
    await dc.createDomain(req, resSpy)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    expect(secretManagerSpy).toHaveBeenCalledTimes(1)
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
  it('should handle error with create with write in vault fails and undo db.delete fail', async () => {
    spyOn(req.db.domains, 'delete').mockResolvedValue(null)
    secretManagerSpy = spyOn(req.secretsManager, 'writeSecretWithObject').mockResolvedValue(null)
    await dc.createDomain(req, resSpy)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    expect(secretManagerSpy).toHaveBeenCalledTimes(1)
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
  it('should handle error', async () => {
    spyOn(req.db.domains, 'insert').mockResolvedValue(null)
    await dc.createDomain(req, resSpy)
    expect(insertSpy).toHaveBeenCalledTimes(1)
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
  it('should create even when no secretsManager', async () => {
    req.secretsManager = null
    await dc.createDomain(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(201)
  })
})
