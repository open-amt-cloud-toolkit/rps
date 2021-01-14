/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Brian Osburn
 **********************************************************************/
import { ProtocolVersion } from '../../../utils/constants'

export function getVersion (req, res): void {
  res.status(200).json(`protocol version: ${ProtocolVersion}`).end()
}
