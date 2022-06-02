/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { IDomainsTable } from '../../../interfaces/database/IDomainsDb'
import { DUPLICATE_DOMAIN_FAILED, API_UNEXPECTED_EXCEPTION, DEFAULT_SKIP, DEFAULT_TOP, CONCURRENCY_EXCEPTION, CONCURRENCY_MESSAGE } from '../../../utils/constants'
import { AMTDomain } from '../../../models'
import { RPSError } from '../../../utils/RPSError'
import Logger from '../../../Logger'
import PostgresDb from '..'

export class DomainsTable implements IDomainsTable {
  db: PostgresDb
  log: Logger
  constructor (db: PostgresDb) {
    this.db = db
    this.log = new Logger('DomainsDb')
  }

  /**
   * @description Get count of all domains from DB
   * @returns {number}
   */
  async getCount (tenantId: string = ''): Promise<number> {
    const result = await this.db.query<{total_count: number}>(`
    SELECT count(*) OVER() AS total_count 
    FROM domains
    WHERE tenant_id = $1
    `, [tenantId])
    let count = 0
    if (result != null) {
      count = Number(result?.rows[0]?.total_count)
    }
    return count
  }

  /**
   * @description Get all Domains from DB
   * @param {number} top
   * @param {number} skip
   * @returns {AMTDomain[]} returns an array of AMT Domain objects from DB
   */
  async get (top: number = DEFAULT_TOP, skip: number = DEFAULT_SKIP, tenantId: string = ''): Promise<AMTDomain[]> {
    const results = await this.db.query<AMTDomain>(`
    SELECT 
      name as "profileName", 
      domain_suffix as "domainSuffix", 
      provisioning_cert as "provisioningCert", 
      provisioning_cert_storage_format as "provisioningCertStorageFormat",
      provisioning_cert_key as "provisioningCertPassword", 
      tenant_id as "tenantId",
      xmin as "version"
    FROM domains 
    WHERE tenant_id = $3
    ORDER BY name 
    LIMIT $1 OFFSET $2`, [top, skip, tenantId])

    return results.rows
  }

  /**
   * @description Get Domain from DB by Domain Suffix
   * @param {string} domainSuffix
   * @returns {AMTDomain} Domain object
   */
  async getDomainByDomainSuffix (domainSuffix: string, tenantId: string = ''): Promise<AMTDomain> {
    const results = await this.db.query<AMTDomain>(`
    SELECT 
      name as "profileName", 
      domain_suffix as "domainSuffix", 
      provisioning_cert as "provisioningCert", 
      provisioning_cert_storage_format as "provisioningCertStorageFormat", 
      provisioning_cert_key as "provisioningCertPassword", 
      tenant_id as "tenantId",
      xmin as "version"
    FROM domains 
    WHERE domain_suffix = $1 and tenant_id = $2`, [domainSuffix, tenantId])

    return results.rowCount > 0 ? results.rows[0] : null
  }

  /**
   * @description Get Domain from DB by name
   * @param {string} domainName
   * @returns {AMTDomain} Domain object
   */
  async getByName (domainName: string, tenantId: string = ''): Promise<AMTDomain> {
    const results = await this.db.query<AMTDomain>(`
    SELECT 
      name as "profileName", 
      domain_suffix as "domainSuffix", 
      provisioning_cert as "provisioningCert", 
      provisioning_cert_storage_format as "provisioningCertStorageFormat", 
      provisioning_cert_key as "provisioningCertPassword", 
      tenant_id as "tenantId",
      xmin as "version"
    FROM domains 
    WHERE Name = $1 and tenant_id = $2`, [domainName, tenantId])

    return results.rowCount > 0 ? results.rows[0] : null
  }

  /**
   * @description Delete Domain from DB by name
   * @param {string} domainName
   * @returns {boolean} Return true on successful deletion
   */
  async delete (domainName: string, tenantId: string = ''): Promise<boolean> {
    const results = await this.db.query(`
    DELETE 
    FROM domains 
    WHERE Name = $1 and tenant_id = $2`, [domainName, tenantId])

    return results.rowCount > 0
  }

  /**
   * @description Insert Domain into DB
   * @param {AMTDomain} amtDomain
   * @returns {AMTDomain} Returns amtDomain object
   */
  async insert (amtDomain: AMTDomain): Promise<AMTDomain> {
    try {
      const results = await this.db.query(`
      INSERT INTO domains(name, domain_suffix, provisioning_cert, provisioning_cert_storage_format, provisioning_cert_key, tenant_id)
      values($1, $2, $3, $4, $5, $6)`,
      [
        amtDomain.profileName,
        amtDomain.domainSuffix,
        amtDomain.provisioningCert,
        amtDomain.provisioningCertStorageFormat,
        amtDomain.provisioningCertPassword,
        amtDomain.tenantId
      ])
      if (results.rowCount > 0) {
        const domain = await this.getByName(amtDomain.profileName)
        return domain
      }
      return null
    } catch (error) {
      this.log.error(`Failed to insert Domain: ${amtDomain.profileName}`, error)
      if (error.code === '23505') { // Unique key violation
        throw new RPSError(DUPLICATE_DOMAIN_FAILED(amtDomain.profileName), 'Unique key violation')
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(amtDomain.profileName))
    }
  }

  /**
   * @description Update AMT Domain into DB
   * @param {AMTDomain} amtDomain object
   * @returns {AMTDomain} Returns amtDomain object
   */
  async update (amtDomain: AMTDomain): Promise <AMTDomain> {
    let latestItem: AMTDomain
    try {
      const results = await this.db.query(`
      UPDATE domains 
      SET domain_suffix=$2, provisioning_cert=$3, provisioning_cert_storage_format=$4, provisioning_cert_key=$5 
      WHERE name=$1 and tenant_id = $6 and xmin = $7`,
      [
        amtDomain.profileName,
        amtDomain.domainSuffix,
        amtDomain.provisioningCert,
        amtDomain.provisioningCertStorageFormat,
        amtDomain.provisioningCertPassword,
        amtDomain.tenantId,
        amtDomain.version
      ])
      latestItem = await this.getByName(amtDomain.profileName)
      if (results.rowCount > 0) {
        return latestItem
      }
    } catch (error) {
      this.log.error('Failed to update Domain :', error)
      if (error.code === '23505') { // Unique key violation
        throw new RPSError(DUPLICATE_DOMAIN_FAILED(amtDomain.profileName), 'Unique key violation')
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(amtDomain.profileName))
    }
    // making assumption that if no records are updated, that it is due to concurrency. We've already checked for if it doesn't exist before calling update.
    throw new RPSError(CONCURRENCY_MESSAGE, CONCURRENCY_EXCEPTION, latestItem)
  }
}
