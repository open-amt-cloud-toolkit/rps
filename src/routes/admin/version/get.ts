/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { AppVersion, ProtocolVersion } from '../../../utils/constants'
import { Request, Response } from 'express'

export function getVersion (req: Request, res: Response): void {
  const response = {
    serviceVersion: AppVersion,
    protocolVersion: ProtocolVersion
  }
  res.status(200).json(response).end()
}
