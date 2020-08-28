/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDomainsDb } from "../../../repositories/interfaces/IDomainsDb";
import { DomainsDbFactory } from "../../../repositories/DomainsDbFactory";
import { DOMAIN_NOT_FOUND, DOMAIN_SUCCESSFULLY_DELETED, DOMAIN_ERROR } from "../../../utils/constants";

export async function deleteDomain(req, res) {
  let domainsDb: IDomainsDb = null;
  const { domainName } = req.params
  try {
    domainsDb = DomainsDbFactory.getDomainsDb();

    const results = await domainsDb.deleteDomainByName(domainName);
    if(typeof results === 'undefined' || results === null)
      res.status(404).end(DOMAIN_NOT_FOUND(domainName))
    else
      res.status(200).end(DOMAIN_SUCCESSFULLY_DELETED(domainName))
  } catch (error) {
    console.log(error)
    res.end(DOMAIN_ERROR(domainName))
  }
}