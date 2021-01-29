/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDomainsDb } from '../../../repositories/interfaces/IDomainsDb'
import { DomainsDbFactory } from '../../../repositories/DomainsDbFactory'
import { DOMAIN_NOT_FOUND, API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'
import { EnvReader } from '../../../utils/EnvReader'
import { AMTDomain } from '../../../models/Rcs'
import Logger from '../../../Logger'

export async function deleteDomain (req, res): Promise<void> {
  const log = new Logger('deleteDomain')
  let domainsDb: IDomainsDb = null
  const { domainName } = req.params
  try {
    domainsDb = DomainsDbFactory.getDomainsDb()
    const domain: AMTDomain = await domainsDb.getDomainByName(domainName)
    if (Object.keys(domain).length === 0) {
      res.status(404).end(DOMAIN_NOT_FOUND(domainName))
    } else {
      const results = await domainsDb.deleteDomainByName(domainName)
      if (results) {
        if (req.secretsManager) {
          await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}certs/${domain.Name}`)
        }
        res.status(204).end()
      }
    }
  } catch (error) {
    log.error(`Failed to delete AMT Domain : ${domainName}`, error)
    res.status(500).end(API_UNEXPECTED_EXCEPTION(domainName))
  }
}
