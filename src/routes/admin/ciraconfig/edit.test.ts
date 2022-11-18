/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { createSpyObj } from '../../../test/helper/jest'
import { editCiraConfig } from './edit'

describe('CIRA Config - Edit', () => {
  let resSpy
  let req
  let getByNameSpy: jest.SpyInstance

  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      db: { ciraConfigs: { getByName: jest.fn(), update: jest.fn() } },
      body: { configName: 'configName' },
      query: { }
    }
    getByNameSpy = jest.spyOn(req.db.ciraConfigs, 'getByName').mockResolvedValue({})
    jest.spyOn(req.db.ciraConfigs, 'update').mockResolvedValue({})

    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should edit', async () => {
    await editCiraConfig(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('configName')
    expect(resSpy.status).toHaveBeenCalledWith(200)
  })
  it('should handle not found', async () => {
    jest.spyOn(req.db.ciraConfigs, 'getByName').mockResolvedValue(null)
    await editCiraConfig(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('configName')
    expect(resSpy.status).toHaveBeenCalledWith(404)
  })
  it('should handle error', async () => {
    jest.spyOn(req.db.ciraConfigs, 'getByName').mockRejectedValue(null)
    await editCiraConfig(req, resSpy)
    expect(getByNameSpy).toHaveBeenCalledWith('configName')
    expect(resSpy.status).toHaveBeenCalledWith(500)
  })
})
