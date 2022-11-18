/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { createSpyObj } from '../../../test/helper/jest'
import { allProfiles } from './all'

describe('Wireless - All', () => {
  let resSpy
  let req
  let getSpy: jest.SpyInstance
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { wirelessProfiles: { get: jest.fn() } },
      query: { }
    }
    getSpy = jest.spyOn(req.db.wirelessProfiles, 'get').mockResolvedValue([])
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })

  it('should get all', async () => {
    await allProfiles(req, resSpy)
    expect(getSpy).toHaveBeenCalled()
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })

  it('should get all with wirelessConfigs length > 0', async () => {
    req.db.wirelessProfiles.getCount = jest.fn().mockImplementation().mockResolvedValue(123)
    req.query.$count = true
    jest.spyOn(req.db.wirelessProfiles, 'get').mockResolvedValue(['abc'])
    await allProfiles(req, resSpy)
    expect(getSpy).toHaveBeenCalled()
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })

  it('should get all with req.query.$count as true', async () => {
    req.db.wirelessProfiles.getCount = jest.fn().mockImplementation().mockResolvedValue(123)
    req.query.$count = true
    await allProfiles(req, resSpy)
    expect(getSpy).toHaveBeenCalled()
    expect(req.db.wirelessProfiles.getCount).toHaveBeenCalled()
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })

  it('should set status to 500 if error occurs', async () => {
    req.db.wirelessProfiles.getCount = jest.fn().mockImplementation(() => {
      throw new TypeError('fake error')
    })
    req.query.$count = true
    await allProfiles(req, resSpy)
    expect(getSpy).toHaveBeenCalled()
    expect(req.db.wirelessProfiles.getCount).toHaveBeenCalled()
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
})
