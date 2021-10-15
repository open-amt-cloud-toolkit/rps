/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { ITlsConfigsTable } from '../../../interfaces/database/ITlsConfigsDb'
import { TlsConfigs } from '../../../models/RCS.Config'
import { API_UNEXPECTED_EXCEPTION, DEFAULT_SKIP, DEFAULT_TOP, TLS_CONFIG_INSERTION_FAILED, TLS_CONFIG_INSERTION_FAILED_DUPLICATE } from '../../../utils/constants'
import Logger from '../../../Logger'
import { RPSError } from '../../../utils/RPSError'
import PostgresDb from '..'

export class TlsConfigsTable implements ITlsConfigsTable {
  db: PostgresDb
  log: Logger
  constructor (db: PostgresDb) {
    this.db = db
    this.log = new Logger('TlsConfigsDb')
  }

  /**
    * @description Get tls Profile
    * @param {string} name of profile
    * @returns {TlsConfigs} returns the tls profile associated with the given name
    */
  async getByName (name: string, tenantId: string = ''): Promise<TlsConfigs> {
    const results = await this.db.query<TlsConfigs>(`
     SELECT 
       tls_config_name as "configName",
       common_name as "commonName",
       organization as "organization",
       state_province as "stateOrProvince",
       country as "country",
       is_trusted_cert as "isTrustedCert", 
       tls_mode as "tlsMode", 
       tenant_id as "tenantId",
       cert_version as "certVersion",
       issued_common_name as "issuedCommonName"
     FROM tls 
     WHERE tls_config_name = $1 and tenant_id = $2
     ORDER BY tls_config_name`, [name, tenantId])
    return results.rowCount > 0 ? results.rows[0] : null
  }

  /**
   * @description Get all tls profiles from DB
   * @param {number} top
   * @param {number} skip
   * @returns {TlsConfigs[]} returns an array of tls profiles from DB
   */
  async get (top: number = DEFAULT_TOP, skip: number = DEFAULT_SKIP, tenantId: string = ''): Promise<TlsConfigs[]> {
    const results = await this.db.query<TlsConfigs>(`
    SELECT 
       tls_config_name as "configName",
       common_name as "commonName",
        organization as "organization",
         state_province as "stateOrProvince",
          country as "country",
          is_trusted_cert as "isTrustedCert", 
          tls_mode as "tlsMode", 
          tenant_id as "tenantId",
          cert_version as "certVersion",
          issued_common_name as "issuedCommonName"
     FROM tls 
        WHERE tenant_id = $3
        ORDER BY  tls_config_name 
        LIMIT $1 OFFSET $2`, [top, skip, tenantId])

    return results.rows
  }

  /**
   * @description count of all TLS configs from DB
   * @returns {number}
   */
  async getCount (tenantId: string = ''): Promise<number> {
    const result = await this.db.query<{total_count: number}>(`
        SELECT count(*) OVER() AS total_count 
        FROM tls
        WHERE tenant_id = $1`, [tenantId])
    let count = 0
    if (result != null) {
      count = Number(result?.rows[0]?.total_count)
    }
    return count
  }

  /**
   * @description Insert AMT tls profile into DB
   * @param {TlsConfigs} tlsConfig
   * @returns {boolean} Returns TlsConfigs object
   */
  async insert (tlsConfig: TlsConfigs): Promise<TlsConfigs> {
    try {
      const results = await this.db.query(`INSERT INTO tls(tls_config_name, common_name, organization, state_province, country, is_trusted_cert, tls_mode, tenant_id, cert_version, issued_common_name)
        values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        tlsConfig.configName,
        tlsConfig.commonName,
        tlsConfig.organization,
        tlsConfig.stateOrProvince,
        tlsConfig.country,
        tlsConfig.isTrustedCert,
        tlsConfig.tlsMode,
        tlsConfig.tenantId,
        tlsConfig.certVersion,
        tlsConfig.issuedCommonName
      ])

      if (results.rowCount === 0) {
        return null
      } else {
        const result = await this.getByName(tlsConfig.configName)
        return result
      }
    } catch (error) {
      this.log.error(`Failed to insert TLS profile: ${tlsConfig.configName}`, error)
      if (error instanceof RPSError) {
        throw error
      }
      if (error.code === '23505') { // Unique key violation
        throw new RPSError(TLS_CONFIG_INSERTION_FAILED_DUPLICATE(tlsConfig.configName), 'Unique key violation')
      }
      if (error.code === '23503') { // Unique key violation
        throw new RPSError(TLS_CONFIG_INSERTION_FAILED(tlsConfig.configName), `Foreign key constraint violation: ${error.message}`)
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(tlsConfig.configName))
    }
  }

  /**
   * @description Update TLS config into DB
   * @param {TlsConfigs} tlsConfig object
   * @returns {TlsConfigs} Returns TLS config object
   */
  async update (tlsConfig: TlsConfigs): Promise<TlsConfigs> {
    try {
      const results = await this.db.query(`
          UPDATE tls 
          SET common_name=$2, organization=$3, state_province=$4, country=$5, is_trusted_cert=$6, tls_mode=$7, cert_version=$9, issued_common_name=$10
          WHERE tls_config_name=$1 and tenant_id = $8`,
      [
        tlsConfig.configName,
        tlsConfig.commonName,
        tlsConfig.organization,
        tlsConfig.stateOrProvince,
        tlsConfig.country,
        tlsConfig.isTrustedCert,
        tlsConfig.tlsMode,
        tlsConfig.tenantId,
        tlsConfig.certVersion,
        tlsConfig.issuedCommonName
      ])
      if (results.rowCount > 0) {
        return await this.getByName(tlsConfig.configName)
      }
      return null
    } catch (error) {
      this.log.error('Failed to update TLS config :', error)
      throw new RPSError(API_UNEXPECTED_EXCEPTION(tlsConfig.configName))
    }
  }

  /**
   * @description Delete tls configs of an AMT Profile from DB by profile name
   * @param {string} name
   * @returns {boolean} Return true on successful deletion
   */
  async delete (name: string, tenantId: string = ''): Promise<boolean> {
    const deleteResults = await this.db.query(`
     DELETE 
     FROM tls 
     WHERE tls_config_name = $1 and tenant_id = $2`, [name, tenantId])

    return deleteResults.rowCount > 0
  }
}
