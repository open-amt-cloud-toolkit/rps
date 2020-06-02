/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTDomain } from "../../../models/Rcs";
import { IDomainsDb } from "../../../repositories/interfaces/IDomainsDb";
import { DomainsDbFactory } from "../../../repositories/DomainsDbFactory";
import { EnvReader } from "../../../utils/EnvReader";

export async function createDomain(req, res) {
  let domainsDb: IDomainsDb = null;

  try {
    domainsDb = DomainsDbFactory.getDomainsDb();

    const amtDomain: AMTDomain = req.body.payload;

    let pwdBefore = amtDomain.ProvisioningCertPassword;

    if(amtDomain.ProvisioningCertPassword) {
      // store the password sent into Vault
      if(req.secretsManager) {
        amtDomain.ProvisioningCertPassword = "PROVISIONING_CERT_PASSWORD_KEY";
      }
    }

    let errorReason
    // SQL Query > Insert Data
    const results = await domainsDb.insertDomain(amtDomain).catch((reason) => { errorReason = reason })

    if(!errorReason && amtDomain.ProvisioningCertPassword) {
      // store the password sent into Vault
      if(req.secretsManager) {
        console.log("Store in vault");
        await req.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}certs/PROVISIONING_CERT`, "PROVISIONING_CERT_PASSWORD_KEY", pwdBefore);
        console.log("Password written to vault")
        amtDomain.ProvisioningCertPassword = "PROVISIONING_CERT_PASSWORD_KEY";
      }
      else {
        console.log('No secrets manager configured. Storing in DB.');
        console.log('Password will be visible in plain text.')
      }
    }

    if(typeof results === 'undefined' || results === null || errorReason)
      res.status(500).end(`Error inserting domain. ${errorReason}`)
    else
      res.status(200).end("Domain inserted.")
  } catch (error) {
    console.log(error)
    res.end("Error inserting domain into db. Check server logs.")
  }
}