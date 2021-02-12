/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDomainsDb } from '../../../repositories/interfaces/IDomainsDb'
import { DomainsDbFactory } from '../../../repositories/DomainsDbFactory'
import { API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'
import Logger from '../../../Logger'
import { AMTDomain } from '../../../models/Rcs'

export async function getAllDomains (req, res): Promise<void> {
  const log = new Logger('getAllDomains')
  let domainsDb: IDomainsDb
  try {
    domainsDb = DomainsDbFactory.getDomainsDb()
    let results: AMTDomain[] = await domainsDb.getAllDomains()
    if (results.length >= 0) {
      results = results.map((result: AMTDomain) => {
        result.ProvisioningCert = null
        result.ProvisioningCertPassword = null
        return result
      })
      res.status(200).json(results).end()
    }
  } catch (error) {
    log.error('Failed to get all the AMT Domains :', error)
    res.status(500).end(API_UNEXPECTED_EXCEPTION('GET all Domains'))
  }
}
