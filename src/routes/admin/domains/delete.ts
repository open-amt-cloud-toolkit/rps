/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { NOT_FOUND_EXCEPTION, NOT_FOUND_MESSAGE } from '../../../utils/constants'
import { type AMTDomain } from '../../../models'
import Logger from '../../../Logger'
import { MqttProvider } from '../../../utils/MqttProvider'
import { type Request, type Response } from 'express'
import { RPSError } from '../../../utils/RPSError'
import handleError from '../../../utils/handleError'

export async function deleteDomain (req: Request, res: Response): Promise<void> {
  const log = new Logger('deleteDomain')
  const { domainName } = req.params
  try {
    const domain: AMTDomain = await req.db.domains.getByName(domainName, req.tenantId)
    if (domain == null) {
      throw new RPSError(NOT_FOUND_MESSAGE('Domain', domainName), NOT_FOUND_EXCEPTION)
    } else {
      const results = await req.db.domains.delete(domainName, req.tenantId)
      if (results) {
        if (req.secretsManager) {
          await req.secretsManager.deleteSecretAtPath(`certs/${domain.profileName}`)
        }
        MqttProvider.publishEvent('success', ['deleteDomain'], `Domain Deleted : ${domainName}`)
        res.status(204).end()
      }
    }
  } catch (error) {
    handleError(log, domainName, req, res, error)
  }
}
