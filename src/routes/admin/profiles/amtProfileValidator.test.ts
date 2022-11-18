/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { validationResult } from 'express-validator'
import { ClientAction } from '../../../models/RCS.Config'
import { AMTUserConsent } from '../../../models'
import { amtProfileValidator, profileUpdateValidator } from './amtProfileValidator'
import { createSpyObj } from '../../../test/helper/jest'

describe('Profiles - Create', () => {
  const testExpressValidatorMiddleware = async (req: Request, res: Response, middlewares): Promise<void> => {
    await Promise.all(middlewares.map(async (middleware) => {
      await middleware(req, res, () => undefined)
    }))
  }

  let req
  let res
  beforeEach(() => {
    req = {
      body: {},
      query: {}
    }
    res = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    res.status.mockReturnThis()
    res.json.mockReturnThis()
    res.send.mockReturnThis()
  })

  it('should test amtProfileValidator', async () => {
    req.body = {
      profileName: 'acm',
      activation: ClientAction.ADMINCTLMODE,
      tags: ['acm'],
      tlsMode: 2,
      dhcpEnabled: false,
      generateRandomPassword: false,
      password: 'password',
      generateRandomMEBxPassword: false,
      mebxPassword: 'password',
      userConsent: AMTUserConsent.NONE,
      iderEnabled: true,
      kvmEnabled: true,
      solEnabled: true
    }

    await testExpressValidatorMiddleware(req, res, amtProfileValidator())
    const result = validationResult(req)
    expect(result.isEmpty()).toBeFalsy()
  })

  it('should test profileUpdateValidator', async () => {
    req.body = {
      profileName: 'acm',
      activation: ClientAction.ADMINCTLMODE,
      tags: ['acm'],
      tlsMode: 2,
      dhcpEnabled: false,
      generateRandomPassword: false,
      password: 'password',
      generateRandomMEBxPassword: false,
      mebxPassword: 'password',
      userConsent: AMTUserConsent.NONE,
      iderEnabled: true,
      kvmEnabled: true,
      solEnabled: true
    }

    await testExpressValidatorMiddleware(req, res, profileUpdateValidator())
    const result = validationResult(req)
    expect(result.isEmpty()).toBeFalsy()
  })
})
