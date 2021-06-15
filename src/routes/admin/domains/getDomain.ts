/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDomainsDb } from '../../../repositories/interfaces/IDomainsDb'
import { DomainsDbFactory } from '../../../repositories/factories/DomainsDbFactory'
import { DOMAIN_NOT_FOUND, API_UNEXPECTED_EXCEPTION, API_RESPONSE } from '../../../utils/constants'
import { AMTDomain } from '../../../models/Rcs'
import Logger from '../../../Logger'

export async function getDomain (req, res): Promise<void> {
  const log = Logger
  let domainsDb: IDomainsDb = null
  const { domainName } = req.params
  try {
    domainsDb = DomainsDbFactory.getDomainsDb()
    const result: AMTDomain = await domainsDb.getDomainByName(domainName)
    if (result !== null) {
      // Return null. Check Security objectives around returning passwords.
      delete result.provisioningCertPassword
      delete result.provisioningCert
      log.info(`Domain : ${JSON.stringify(result)}`)
      res.status(200).json(API_RESPONSE(result)).end()
    } else {
      log.info(`Not found : ${domainName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', DOMAIN_NOT_FOUND(domainName))).end()
    }
  } catch (error) {
    log.error(`Failed to get AMT Domain : ${domainName}`, error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`GET ${domainName}`))).end()
  }
}
