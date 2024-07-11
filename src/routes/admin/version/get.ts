/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { ProtocolVersion } from '../../../utils/constants.js'
import { type Request, type Response } from 'express'
import { version } from '../../../utils/version.js'

export function getVersion(req: Request, res: Response): void {
  const response = {
    serviceVersion: version,
    protocolVersion: ProtocolVersion
  }
  res.status(200).json(response).end()
}
