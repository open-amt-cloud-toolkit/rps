/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { createSpyObj } from '../../../test/helper/jest.js'
import { editDomain } from './edit.js'
import { jest } from '@jest/globals'
import { type SpyInstance, spyOn } from 'jest-mock'

describe('CIRA Config - Edit', () => {
  let resSpy
  let req
  let getByNameSpy: SpyInstance<any>

  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { domains: { getByName: jest.fn(), update: jest.fn() } },
      body: { profileName: 'profileName' },
      query: { },
      tenantId: ''
    }
    getByNameSpy = spyOn(req.db.domains, 'getByName').mockResolvedValue({})
    spyOn(req.db.domains, 'update').mockResolvedValue({})

    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should edit', async () => {
    await editDomain(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('profileName', req.tenantId)
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })
  it('should handle not found', async () => {
    spyOn(req.db.domains, 'getByName').mockResolvedValue(null)
    await editDomain(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('profileName', req.tenantId)
    expect(resSpy.status).toHaveBeenCalledWith(404)
  })
  it('should handle error', async () => {
    spyOn(req.db.domains, 'getByName').mockRejectedValue(null)
    await editDomain(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('profileName', req.tenantId)
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
})
