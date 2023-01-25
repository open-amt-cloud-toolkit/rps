/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { API_RESPONSE, NOT_FOUND_MESSAGE, NOT_FOUND_EXCEPTION } from '../../../utils/constants'
import { type AMTDomain } from '../../../models'
import Logger from '../../../Logger'
import { MqttProvider } from '../../../utils/MqttProvider'
import { type Request, type Response } from 'express'
import handleError from '../../../utils/handleError'
import { RPSError } from '../../../utils/RPSError'

export async function getDomain (req: Request, res: Response): Promise<void> {
  const log = new Logger('getDomain')
  const { domainName } = req.params
  try {
    const result: AMTDomain = await req.db.domains.getByName(domainName)
    if (result != null) {
      // Return null. Check Security objectives around returning passwords.
      delete result.provisioningCertPassword
      delete result.provisioningCert
      MqttProvider.publishEvent('success', ['getDomain'], `Sent Domain : ${domainName}`)
      log.verbose(`Domain : ${JSON.stringify(result)}`)
      res.status(200).json(API_RESPONSE(result)).end()
    } else {
      throw new RPSError(NOT_FOUND_MESSAGE('Domain', domainName), NOT_FOUND_EXCEPTION)
    }
  } catch (error) {
    handleError(log, domainName, req, res, error)
  }
}
