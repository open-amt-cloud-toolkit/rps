/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { createSpyObj } from '../../../test/helper/jest'
import { deleteDomain } from './delete'

describe('CIRA Config - Delete', () => {
  let resSpy
  let req
  let deleteSpy: jest.SpyInstance

  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { domains: { delete: jest.fn(), getByName: jest.fn() } },
      query: { },
      params: { domainName: 'domainName' }
    }
    deleteSpy = jest.spyOn(req.db.domains, 'delete').mockResolvedValue({})
    jest.spyOn(req.db.domains, 'getByName').mockResolvedValue({})

    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should delete', async () => {
    await deleteDomain(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(204)
  })
  it('should handle not found', async () => {
    deleteSpy = jest.spyOn(req.db.domains, 'getByName').mockResolvedValue(null)
    await deleteDomain(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(404)
  })
  it('should handle error', async () => {
    jest.spyOn(req.db.domains, 'delete').mockRejectedValue(null)
    await deleteDomain(req, resSpy)
    expect(deleteSpy).toHaveBeenCalledWith('domainName')
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
})
