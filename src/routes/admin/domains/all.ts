/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDomainsDb } from '../../../repositories/interfaces/IDomainsDb'
import { DomainsDbFactory } from '../../../repositories/DomainsDbFactory'
import { DOMAIN_ERROR, DOMAIN_CONFIG_EMPTY } from '../../../utils/constants'

export async function getAllDomains (req, res) {
  let domainsDb: IDomainsDb = null

  try {
    domainsDb = DomainsDbFactory.getDomainsDb()
    // TODO: remove this?
    const mapperFn = async (provisioningCertPassword) => {
      return null
    }
    let results = await domainsDb.getAllDomains(mapperFn)
    results = results.map((result) => {
      result.ProvisioningCert = null
      return result
    })

    if (typeof results === 'undefined' || results.length === 0) {
      res.status(404).end(DOMAIN_CONFIG_EMPTY)
    } else {
      res.status(200).json(results).end()
    }
  } catch (error) {
    console.log(error)
    res.end(DOMAIN_ERROR(''))
  }
}
