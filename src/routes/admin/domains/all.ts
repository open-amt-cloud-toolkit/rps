/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { API_RESPONSE } from '../../../utils/constants'
import Logger from '../../../Logger'
import { type AMTDomain, type DataWithCount } from '../../../models'
import { MqttProvider } from '../../../utils/MqttProvider'
import { type Request, type Response } from 'express'
import handleError from '../../../utils/handleError'

export async function getAllDomains (req: Request, res: Response): Promise<void> {
  const log = new Logger('getAllDomains')
  const top = Number(req.query.$top)
  const skip = Number(req.query.$skip)
  const includeCount = req.query.$count
  try {
    let domains: AMTDomain[] = await req.db.domains.get(top, skip, req.tenantId)
    if (domains.length >= 0) {
      domains = domains.map((result: AMTDomain) => {
        delete result.provisioningCert
        delete result.provisioningCertPassword
        return result
      })
    }
    if (includeCount == null || includeCount === 'false') {
      res.status(200).json(API_RESPONSE(domains)).end()
    } else {
      const count: number = await req.db.domains.getCount(req.tenantId)
      const dataWithCount: DataWithCount = {
        data: domains,
        totalCount: count
      }
      res.status(200).json(API_RESPONSE(dataWithCount)).end()
    }
    MqttProvider.publishEvent('success', ['getAllDomains'], 'Sent domains')
  } catch (error) {
    handleError(log, '', req, res, error)
  }
}
