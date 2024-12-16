/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type Request, type Response } from 'express'

const ifMatchMiddleware = (req: Request, res: Response, next): void => {
  const item = req.body
  if (item != null && typeof item === 'object') {
    // set version property from if-match header, if specified
    const version = req.get('if-match')
    if (version != null) {
      item.version = version // strings.getVersionFromEtag(etag)
    }
  }
  next()
}
export default ifMatchMiddleware
