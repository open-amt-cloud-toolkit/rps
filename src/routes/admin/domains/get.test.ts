/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { createSpyObj } from '../../../test/helper/jest'
import { getDomain } from './get'

describe('CIRA Config - Get', () => {
  let resSpy
  let req
  let getByNameSpy: jest.SpyInstance
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { domains: { getByName: jest.fn() } },
      query: { },
      params: { domainName: 'domainName' }
    }
    getByNameSpy = jest.spyOn(req.db.domains, 'getByName').mockResolvedValue({})

    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should get', async () => {
    await getDomain(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('domainName')
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })
  it('should handle error', async () => {
    jest.spyOn(req.db.domains, 'getByName').mockRejectedValue(null)
    await getDomain(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('domainName')
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
})
