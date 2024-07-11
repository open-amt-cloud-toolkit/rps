/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { createSpyObj } from '../test/helper/jest.js'
import { jest } from '@jest/globals'

let mockReturnValue = true
jest.unstable_mockModule('express-validator', () => ({
  validationResult: () =>
    ({
      isEmpty: jest.fn().mockReturnValue(mockReturnValue),
      array: jest.fn().mockReturnValue([{ test: 'error' }])
    }) as any
}))

const v = await import('./validate.js')

describe('Check validate', () => {
  let req
  let resSpy
  let next: any

  beforeEach(() => {
    resSpy = createSpyObj('Response', [
      'status',
      'json',
      'end',
      'send'
    ])
    req = {
      body: {
        username: 'admin',
        password: 'Passw0rd'
      }
    }
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })

  it('should fail with incorrect req', async () => {
    mockReturnValue = false
    await v.default(req, resSpy, next)
    expect(resSpy.status).toHaveBeenCalledWith(400)
  })
  it('should pass with proper req', async () => {
    mockReturnValue = true
    next = jest.fn()
    await v.default(req, resSpy, next)
    expect(next).toHaveBeenCalled()
  })
})
