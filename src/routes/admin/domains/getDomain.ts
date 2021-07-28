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
import { MqttProvider } from '../../../utils/MqttProvider'

export async function getDomain (req, res): Promise<void> {
  const log = new Logger('getDomain')
  let domainsDb: IDomainsDb = null
  const { domainName } = req.params
  try {
    domainsDb = DomainsDbFactory.getDomainsDb()
    const result: AMTDomain = await domainsDb.getDomainByName(domainName)
    if (result !== null) {
      // Return null. Check Security objectives around returning passwords.
      delete result.provisioningCertPassword
      delete result.provisioningCert
      MqttProvider.publishEvent('success', ['getDomain'], `Sent Domain : ${domainName}`)
      log.verbose(`Domain : ${JSON.stringify(result)}`)
      res.status(200).json(API_RESPONSE(result)).end()
    } else {
      MqttProvider.publishEvent('fail', ['getDomain'], `Domain Not Found : ${domainName}`)
      log.debug(`Not found : ${domainName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', DOMAIN_NOT_FOUND(domainName))).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['getDomain'], `Failed to get domain : ${domainName}`)
    log.error(`Failed to get AMT Domain : ${domainName}`, error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`GET ${domainName}`))).end()
  }
}
