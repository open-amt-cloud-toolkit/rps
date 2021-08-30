/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { IDbCreator } from '../interfaces/database/IDbCreator'
import { ICiraConfigDb } from '../interfaces/database/ICiraConfigDb'
import { CIRAConfig } from '../RCS.Config'
import { mapToCiraConfig } from './mapToCiraConfig'
import { CIRA_CONFIG_DELETION_FAILED_CONSTRAINT, API_UNEXPECTED_EXCEPTION, CIRA_CONFIG_INSERTION_FAILED_DUPLICATE, DEFAULT_TOP, DEFAULT_SKIP } from '../utils/constants'
import { RPSError } from '../utils/RPSError'
import Logger from '../Logger'
export class CiraConfigDb implements ICiraConfigDb {
  db: any
  log: Logger
  constructor (dbCreator: IDbCreator) {
    this.db = dbCreator.getDb()
    this.log = new Logger('CiraConfigDb')
  }

  /**
   * @description Get count of all CIRA configs from DB
   * @returns {number}
   */
  async getCount (tenantId: string = ''): Promise<number> {
    const result = await this.db.query(`
    SELECT count(*) OVER() AS total_count 
    FROM ciraconfigs
    WHERE tenant_id = $1`, [tenantId])
    let count = 0
    if (result != null) {
      count = Number(result?.rows[0]?.total_count)
    }
    return count
  }

  /**
   * @description Get all CIRA config from DB
   * @param {number} top
   * @param {number} skip
   * @returns {Pagination} returns an array of CIRA config objects from DB
   */
  async get (top: number = DEFAULT_TOP, skip: number = DEFAULT_SKIP, tenantId: string = ''): Promise<CIRAConfig[]> {
    const results = await this.db.query(`SELECT cira_config_name, mps_server_address, mps_port, user_name, password, common_name, server_address_format, auth_method, mps_root_certificate, proxydetails, tenant_id 
    FROM ciraconfigs 
    WHERE tenant_id = $3
    ORDER BY cira_config_name 
    LIMIT $1 OFFSET $2`, [top, skip, tenantId])
    return await Promise.all(results.rows.map(async (p) => {
      const result = mapToCiraConfig(p)
      return result
    }
    ))
  }

  /**
   * @description Get CIRA config from DB by name
   * @param {string} configName
   * @returns {CIRAConfig} CIRA config object
   */
  async getByName (configName: string, tenantId: string = ''): Promise<CIRAConfig> {
    const results = await this.db.query(`
    SELECT cira_config_name, mps_server_address, mps_port, user_name, password, common_name, server_address_format, auth_method, mps_root_certificate, proxydetails, tenant_id 
    FROM ciraconfigs 
    WHERE cira_config_name = $1 and tenant_id = $2`, [configName, tenantId])
    let ciraConfig: CIRAConfig = null
    if (results.rowCount > 0) {
      ciraConfig = mapToCiraConfig(results.rows[0])
    }
    return ciraConfig
  }

  /**
   * @description Delete CIRA config from DB by name
   * @param {string} ciraConfigName
   * @returns {boolean} Return true on successful deletion
   */
  async delete (ciraConfigName: string, tenantId: string = ''): Promise<boolean> {
    try {
      const results = await this.db.query(`
      DELETE FROM ciraconfigs 
      WHERE cira_config_name = $1 and tenant_id = $2`, [ciraConfigName, tenantId])
      if (results.rowCount > 0) {
        return true
      } else {
        return false
      }
    } catch (error) {
      this.log.error(`Failed to delete CIRA config : ${ciraConfigName}`, error)
      if (error.code === '23503') { // foreign key violation
        throw new RPSError(CIRA_CONFIG_DELETION_FAILED_CONSTRAINT(ciraConfigName), 'Foreign key violation')
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(`Delete CIRA config : ${ciraConfigName}`))
    }
  }

  /**
   * @description Insert CIRA config into DB
   * @param {CIRAConfig} ciraConfig
   * @returns {CIRAConfig} Returns cira config object
   */
  async insert (ciraConfig: CIRAConfig): Promise<CIRAConfig> {
    try {
      const results = await this.db.query(`INSERT INTO ciraconfigs(cira_config_name, mps_server_address, mps_port, user_name, password, common_name, server_address_format, auth_method, mps_root_certificate, proxydetails, tenant_id)
        values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        ciraConfig.configName,
        ciraConfig.mpsServerAddress,
        ciraConfig.mpsPort,
        ciraConfig.username,
        ciraConfig.password,
        ciraConfig.commonName,
        ciraConfig.serverAddressFormat,
        ciraConfig.authMethod,
        ciraConfig.mpsRootCertificate,
        ciraConfig.proxyDetails,
        ciraConfig.tenantId
      ])
      if (results.rowCount > 0) {
        const config = await this.getByName(ciraConfig.configName)
        return config
      }
      return null
    } catch (error) {
      this.log.error('Failed to insert CIRA config :', error)
      if (error.code === '23505') { // Unique key violation
        throw new RPSError(CIRA_CONFIG_INSERTION_FAILED_DUPLICATE(ciraConfig.configName), 'Unique key violation')
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(ciraConfig.configName))
    }
  }

  /**
   * @description Update CIRA config into DB
   * @param {CIRAConfig} ciraConfig object
   * @returns {CIRAConfig} Returns cira config object
   */
  async update (ciraConfig: CIRAConfig): Promise<CIRAConfig> {
    try {
      const results = await this.db.query(`
      UPDATE ciraconfigs 
      SET mps_server_address=$2, mps_port=$3, user_name=$4, password=$5, common_name=$6, server_address_format=$7, auth_method=$8, mps_root_certificate=$9, proxydetails=$10 
      WHERE cira_config_name=$1 and tenant_id = $11`,
      [
        ciraConfig.configName,
        ciraConfig.mpsServerAddress,
        ciraConfig.mpsPort,
        ciraConfig.username,
        ciraConfig.password,
        ciraConfig.commonName,
        ciraConfig.serverAddressFormat,
        ciraConfig.authMethod,
        ciraConfig.mpsRootCertificate,
        ciraConfig.proxyDetails,
        ciraConfig.tenantId
      ])
      if (results.rowCount > 0) {
        const config = await this.getByName(ciraConfig.configName)
        return config
      }
      return null
    } catch (error) {
      this.log.error('Failed to update CIRA config :', error)
      throw new RPSError(API_UNEXPECTED_EXCEPTION(ciraConfig.configName))
    }
  }
}
