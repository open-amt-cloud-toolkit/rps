/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDbCreator } from './interfaces/IDbCreator'
import { IDomainsDb } from './interfaces/IDomainsDb'
import { mapToDomain } from './mapToDomain'
import { DUPLICATE_DOMAIN_FAILED, API_UNEXPECTED_EXCEPTION } from '../utils/constants'
import { AMTDomain } from '../models/Rcs'
import { RPSError } from '../utils/RPSError'
import Logger from '../Logger'

export class DomainsDb implements IDomainsDb {
  db: any
  log: Logger
  constructor (dbCreator: IDbCreator) {
    this.db = dbCreator.getDb()
    this.log = new Logger('DomainsDb')
  }

  /**
   * @description Get all Domains from DB
   * @returns {AMTDomain[]} returns an array of AMT Domain objects
   */
  async getAllDomains (): Promise<AMTDomain[]> {
    const results = await this.db.query('SELECT name as Name, domain_suffix as DomainSuffix, provisioning_cert as ProvisioningCert, provisioning_cert_storage_format as ProvisioningCertStorageFormat, provisioning_cert_key as ProvisioningCertPassword FROM domains')
    return await Promise.all(results.rows.map(async p => {
      const result = mapToDomain(p)
      return result
    }))
  }

  /**
   * @description Get Domain from DB by name
   * @param {string} domainName
   * @returns {AMTDomain} Domain object
   */
  async getDomainByName (domainName: string): Promise<AMTDomain> {
    const results = await this.db.query('SELECT name as Name, domain_suffix as DomainSuffix, provisioning_cert as ProvisioningCert, provisioning_cert_storage_format as ProvisioningCertStorageFormat, provisioning_cert_key as ProvisioningCertPassword FROM domains WHERE Name = $1', [domainName])
    let domain: AMTDomain = null
    if (results.rowCount > 0) {
      domain = mapToDomain(results.rows[0])
    }
    return domain
  }

  /**
   * @description Delete Domain from DB by name
   * @param {string} domainName
   * @returns {boolean} Return true on successful deletion
   */
  async deleteDomainByName (domainName: string): Promise<boolean> {
    const results = await this.db.query('DELETE FROM domains WHERE Name = $1', [domainName])
    if (results.rowCount > 0) {
      return true
    }
    return false
  }

  /**
   * @description Insert Domain into DB
   * @param {AMTDomain} amtDomain
   * @returns {AMTDomain} Returns amtDomain object
   */
  async insertDomain (amtDomain: AMTDomain): Promise<AMTDomain> {
    try {
      const results = await this.db.query('INSERT INTO domains(name, domain_suffix, provisioning_cert, provisioning_cert_storage_format, provisioning_cert_key) ' +
        'values($1, $2, $3, $4, $5)',
      [
        amtDomain.profileName,
        amtDomain.domainSuffix,
        amtDomain.provisioningCert,
        amtDomain.provisioningCertStorageFormat,
        amtDomain.provisioningCertPassword
      ])
      if (results.rowCount > 0) {
        const domain = await this.getDomainByName(amtDomain.profileName)
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
  async updateDomain (amtDomain: AMTDomain): Promise <AMTDomain> {
    try {
      const results = await this.db.query('UPDATE domains SET domain_suffix=$2, provisioning_cert=$3, provisioning_cert_storage_format=$4, provisioning_cert_key=$5 WHERE name=$1',
        [
          amtDomain.profileName,
          amtDomain.domainSuffix,
          amtDomain.provisioningCert,
          amtDomain.provisioningCertStorageFormat,
          amtDomain.provisioningCertPassword
        ])
      if (results.rowCount > 0) {
        const domain = await this.getDomainByName(amtDomain.profileName)
        return domain
      }
      return null
    } catch (error) {
      this.log.error('Failed to update Domain :', error)
      if (error.code === '23505') { // Unique key violation
        throw new RPSError(DUPLICATE_DOMAIN_FAILED(amtDomain.profileName), 'Unique key violation')
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(amtDomain.profileName))
    }
  }
}
