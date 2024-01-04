/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { createSpyObj } from '../../../test/helper/jest.js'
import { allCiraConfigs } from './all.js'

describe('CIRA Config - All', () => {
  let resSpy
  let req
  let getSpy: jest.SpyInstance
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { ciraConfigs: { get: jest.fn() } },
      query: { }
    }
    getSpy = jest.spyOn(req.db.ciraConfigs, 'get').mockResolvedValue([])
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })

  it('should get all', async () => {
    await allCiraConfigs(req, resSpy)
    expect(getSpy).toHaveBeenCalled()
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })

  it('should get all with req.query.$count as true', async () => {
    req.db.ciraConfigs.getCount = jest.fn().mockImplementation().mockResolvedValue(123)
    req.query.$count = true
    await allCiraConfigs(req, resSpy)
    expect(getSpy).toHaveBeenCalled()
    expect(req.db.ciraConfigs.getCount).toHaveBeenCalled()
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })

  it('should set status to 500 if error occurs', async () => {
    req.db.ciraConfigs.getCount = jest.fn().mockImplementation(() => {
      throw new TypeError('fake error')
    })
    req.query.$count = true
    await allCiraConfigs(req, resSpy)
    expect(getSpy).toHaveBeenCalled()
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
})
