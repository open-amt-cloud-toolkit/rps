/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { createSpyObj } from '../../../test/helper/jest.js'
import { getAllIEEE8021xConfigs } from './all.js'

describe('IEEE8021xConfigs - All', () => {
  let resSpy
  let req
  let getSpy: jest.SpyInstance
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { ieee8021xProfiles: { get: jest.fn() } },
      query: { }
    }
    getSpy = jest.spyOn(req.db.ieee8021xProfiles, 'get').mockResolvedValue([])
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })

  it('should get all', async () => {
    await getAllIEEE8021xConfigs(req, resSpy)
    expect(getSpy).toHaveBeenCalled()
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })

  it('should get all IEEE8021x Profiles length > 0', async () => {
    req.db.ieee8021xProfiles.getCount = jest.fn().mockImplementation().mockResolvedValue(123)
    req.query.$count = true
    jest.spyOn(req.db.ieee8021xProfiles, 'get').mockResolvedValue(['abc'])
    await getAllIEEE8021xConfigs(req, resSpy)
    expect(getSpy).toHaveBeenCalled()
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })

  it('should get all req.query.$count as true', async () => {
    req.db.ieee8021xProfiles.getCount = jest.fn().mockImplementation().mockResolvedValue(123)
    req.query.$count = true
    await getAllIEEE8021xConfigs(req, resSpy)
    expect(getSpy).toHaveBeenCalled()
    expect(req.db.ieee8021xProfiles.getCount).toHaveBeenCalled()
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })

  it('should set status to 500 if error occurs', async () => {
    req.db.ieee8021xProfiles.getCount = jest.fn().mockImplementation(() => {
      throw new TypeError('fake error')
    })
    req.query.$count = true
    await getAllIEEE8021xConfigs(req, resSpy)
    expect(getSpy).toHaveBeenCalled()
    expect(req.db.ieee8021xProfiles.getCount).toHaveBeenCalled()
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
})
