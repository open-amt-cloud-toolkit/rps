/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDbCreator } from "./interfaces/IDbCreator";
import { IDomainsDb } from "./interfaces/IDomainsDb";
import { mapToDomain } from "./mapToDomain";

export class DomainsDb implements IDomainsDb {
  db: any;
  constructor(dbCreator: IDbCreator) {
    this.db = dbCreator.getDb();
  }

  async getAllDomains(): Promise<any> {
    let results = await this.db.query('SELECT name as Name, domain_suffix as DomainSuffix, provisioning_cert as ProvisioningCert, provisioning_cert_storage_format as ProvisioningCertStorageFormat, provisioning_cert_key as ProvisioningCertPassword FROM domains');

    return results.rows.map(element => mapToDomain(element))
  }

  async getDomainByName(domainName): Promise<any> {
    let results = await this.db.query('SELECT name as Name, domain_suffix as DomainSuffix, provisioning_cert as ProvisioningCert, provisioning_cert_storage_format as ProvisioningCertStorageFormat, provisioning_cert_key as ProvisioningCertPassword FROM domains WHERE Name = $1', [domainName])
    return (results.rowCount > 0 ? mapToDomain(results.rows[0]) : null);
  }

  async deleteDomainByName(domainName): Promise<any> {
    let results = await this.db.query('DELETE FROM domains WHERE Name = $1', [domainName])
    return (results.rowCount > 0 ? results.rowCount : null);
  }

  async insertDomain(amtDomain): Promise<any> {
    try {
      let results = await this.db.query('INSERT INTO domains(name, domain_suffix, provisioning_cert, provisioning_cert_storage_format, provisioning_cert_key) ' +
        'values($1, $2, $3, $4, $5)',
        [
          amtDomain.Name,
          amtDomain.DomainSuffix,
          amtDomain.ProvisioningCert,
          amtDomain.ProvisioningCertStorageFormat,
          amtDomain.ProvisioningCertPassword
        ]);
      return results;
    } catch (error) {
      console.log(error)
      if(error.code == '23505') // Unique key violation
        throw ("Duplicate Domain. Domain already exists.")
        
      throw ("Unknown Error. Check Server Logs.")
    }

  }
}