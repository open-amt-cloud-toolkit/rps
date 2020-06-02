/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDomainsDb } from "../../../repositories/interfaces/IDomainsDb";
import { DomainsDbFactory } from "../../../repositories/DomainsDbFactory";

export async function getDomain(req, res) {
  let domainsDb: IDomainsDb = null;

  try {
    domainsDb = DomainsDbFactory.getDomainsDb();
    const { domainName } = req.params
    const results = await domainsDb.getDomainByName(domainName);
    if(typeof results === 'undefined' || results === null)
      res.status(404).end("Domain not found")
    else
      res.json(results).end();
  } catch (error) {
    console.log(error)
    res.end("Error retrieving domain. Check server logs.")
  }
}