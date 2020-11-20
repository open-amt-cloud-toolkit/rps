/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { AMTDomain } from "../../../models/Rcs";
import { IDomainsDb } from "../../../repositories/interfaces/IDomainsDb";
import { DomainsDbFactory } from "../../../repositories/DomainsDbFactory";
import { EnvReader } from "../../../utils/EnvReader";
import Logger from "../../../Logger";
import { DOMAIN_INSERTION_SUCCESS, DOMAIN_ERROR } from "../../../utils/constants";

export async function createDomain(req, res) {
  let domainsDb: IDomainsDb = null;
  let log = Logger("createDomain")

  const amtDomain: AMTDomain = req.body.payload;

  try {
    domainsDb = DomainsDbFactory.getDomainsDb();

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
        log.debug("Store in vault");
        await req.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}certs/${amtDomain.Name}/PROVISIONING_CERT`, "PROVISIONING_CERT_PASSWORD_KEY", pwdBefore);
        log.debug("Password written to vault")
        amtDomain.ProvisioningCertPassword = "PROVISIONING_CERT_PASSWORD_KEY";
      }
      else {
        log.debug('No secrets manager configured. Storing in DB.');
        log.debug('Password will be visible in plain text.')
      }
    }

    if(typeof results === 'undefined' || results === null || errorReason)
      res.status(500).end(`${errorReason}`)
    else
      res.status(200).end(DOMAIN_INSERTION_SUCCESS(amtDomain.Name))
  } catch (error) {
    log.error(error)
    res.end(DOMAIN_ERROR(amtDomain.Name))
  }
}