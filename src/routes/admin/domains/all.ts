/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDomainsDb } from "../../../repositories/interfaces/IDomainsDb";
import { DomainsDbFactory } from "../../../repositories/DomainsDbFactory";
import { DOMAIN_ERROR, DOMAIN_CONFIG_EMPTY } from "../../../utils/constants";
import { EnvReader } from "../../../utils/EnvReader";

export async function getAllDomains(req, res) {
  let domainsDb: IDomainsDb = null;

  try {
    domainsDb = DomainsDbFactory.getDomainsDb();
    let mapperFn = async (provisioningCertPassword) => {
      // if (req.secretsManager)
      //   return await req.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}certs/${amtDomain.Name}/PROVISIONING_CERT`, provisioningCertPassword);
      // return provisioningCertPassword;
      
      // Return null. Check Security objectives around returning passwords.
      return null;
    }
    var results = await domainsDb.getAllDomains(mapperFn);
    results = results.map((result) => { result.ProvisioningCert = null; return result; } )

    if(typeof results === 'undefined' || results.length === 0)
      res.status(404).end(DOMAIN_CONFIG_EMPTY())
    else
      res.status(200).json(results).end()
  } catch (error) {
    console.log(error)
    res.end(DOMAIN_ERROR(""))
  }
}