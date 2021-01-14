/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDomainsDb } from '../../../repositories/interfaces/IDomainsDb'
import { DomainsDbFactory } from '../../../repositories/DomainsDbFactory'
import { DOMAIN_NOT_FOUND, DOMAIN_ERROR } from '../../../utils/constants'

export async function getDomain (req, res): Promise<void> {
  let domainsDb: IDomainsDb = null
  const { domainName } = req.params
  try {
    domainsDb = DomainsDbFactory.getDomainsDb()

    const results = await domainsDb.getDomainByName(domainName)
    if (typeof results === 'undefined' || results === null) {
      res.status(404).end(DOMAIN_NOT_FOUND(domainName))
    } else {
      // if (req.secretsManager && results.ProvisioningCertPassword)
      //   results.ProvisioningCertPassword = await req.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}certs/PROVISIONING_CERT`, results.ProvisioningCertPassword);

      // Return null. Check Security objectives around returning passwords.
      results.ProvisioningCertPassword = null
      results.ProvisioningCert = null
      res.json(results).end()
    }
  } catch (error) {
    console.log(error)
    res.end(DOMAIN_ERROR(domainName))
  }
}
