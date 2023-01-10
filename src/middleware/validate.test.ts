/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import validateMiddleware from './validate'
import * as val from 'express-validator'
import { createSpyObj } from '../test/helper/jest'
jest.mock('express-validator')

describe('Check validate', () => {
  let req
  let resSpy
  let next: any

  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    req = {
      body: {
        username: 'admin',
        password: 'Passw0rd'
      }
    }
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
    jest.spyOn(val, 'validationResult').mockImplementation(() => {
      return {
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([{ test: 'error' }])
      } as any
    })
  })

  it('should fail with incorrect req', async () => {
    jest.spyOn(val, 'validationResult').mockImplementation(() => {
      return {
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue([{ test: 'error' }])
      } as any
    })
    await validateMiddleware(req, resSpy, next)
    expect(resSpy.status).toHaveBeenCalledWith(400)
  })
  it('should pass with proper req', async () => {
    jest.spyOn(val, 'validationResult').mockImplementation(() => {
      return {
        isEmpty: jest.fn().mockReturnValue(true),
        array: jest.fn().mockReturnValue([{ test: 'fake' }])
      } as any
    })
    next = jest.fn()
    await validateMiddleware(req, resSpy, next)
    expect(next).toHaveBeenCalled()
  })
})
