/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { createSpyObj } from '../../../test/helper/jest'
import { deleteCiraConfig } from './delete'

describe('CIRA Config - delete', () => {
  let resSpy
  let req
  let deleteSpy: jest.SpyInstance
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { ciraConfigs: { delete: jest.fn() } },

      query: { },
      params: { ciraConfigName: 'ciraConfig' }
    }
    deleteSpy = jest.spyOn(req.db.ciraConfigs, 'delete').mockResolvedValue({})
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should delete', async () => {
    await deleteCiraConfig(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(204)
  })
  it('should handle not found', async () => {
    deleteSpy = jest.spyOn(req.db.ciraConfigs, 'delete').mockResolvedValue(null)
    await deleteCiraConfig(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(404)
  })
  it('should handle error', async () => {
    jest.spyOn(req.db.ciraConfigs, 'delete').mockRejectedValue(null)
    await deleteCiraConfig(req, resSpy)
    expect(deleteSpy).toHaveBeenCalledWith('ciraConfig')
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
})
