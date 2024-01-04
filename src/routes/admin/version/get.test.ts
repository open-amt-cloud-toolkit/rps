/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { createSpyObj } from '../../../test/helper/jest.js'
import * as version from './get.js'
import { ServiceVersion, ProtocolVersion } from '../../../utils/constants.js'

describe('Checks getVersion', () => {
  let resSpy
  let req
  beforeEach(() => {
    resSpy = createSpyObj('Response', ['status', 'json', 'end', 'send'])
    resSpy.status.mockReturnThis()
    resSpy.json.mockReturnThis()
    resSpy.send.mockReturnThis()
  })
  it('should return with protocolVersion and serviceVersion', () => {
    version.getVersion(req, resSpy)
    expect(resSpy.status).toHaveBeenCalledWith(200)
    expect(resSpy.json).toHaveBeenCalledWith({ serviceVersion: ServiceVersion, protocolVersion: ProtocolVersion })
  })
})
