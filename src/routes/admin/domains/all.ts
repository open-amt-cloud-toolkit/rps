/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDomainsDb } from "../../../repositories/interfaces/IDomainsDb";
import { DomainsDbFactory } from "../../../repositories/DomainsDbFactory";

export async function getAllDomains(req, res) {
  let domainsDb: IDomainsDb = null;

  try {
    domainsDb = DomainsDbFactory.getDomainsDb();

    const results = await domainsDb.getAllDomains();
    if (typeof results === 'undefined')
      res.status(404).end()
    else
      res.status(200).json(results).end()
  } catch (error) {
    console.log(error)
    res.end("Error retrieving domain. Check server logs.")
  }
}