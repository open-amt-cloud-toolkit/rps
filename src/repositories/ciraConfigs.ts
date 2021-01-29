/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDbCreator } from './interfaces/IDbCreator'
import { ICiraConfigDb } from './interfaces/ICiraConfigDb'
import { CIRAConfig } from '../RCS.Config'
import { mapToCiraConfig } from './mapToCiraConfig'
import { CIRA_CONFIG_DELETION_FAILED_CONSTRAINT, API_UNEXPECTED_EXCEPTION, CIRA_CONFIG_INSERTION_FAILED_DUPLICATE } from '../utils/constants'
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
   * @description Get all CIRA config from DB
   * @returns {CIRAConfig[]} returns an array of CIRA config objects
   */
  async getAllCiraConfigs (): Promise<CIRAConfig[]> {
    const results = await this.db.query('SELECT cira_config_name, mps_server_address, mps_port, user_name, password, common_name, server_address_format, auth_method, mps_root_certificate, proxydetails from ciraconfigs')
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
  async getCiraConfigByName (configName: string): Promise<CIRAConfig> {
    const results = await this.db.query('SELECT cira_config_name, mps_server_address, mps_port, user_name, password, common_name, server_address_format, auth_method, mps_root_certificate, proxydetails FROM ciraconfigs WHERE cira_config_name = $1', [configName])
    let ciraConfig: CIRAConfig = {} as CIRAConfig
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
  async deleteCiraConfigByName (ciraConfigName: string): Promise<boolean> {
    try {
      const results = await this.db.query('DELETE FROM ciraconfigs WHERE cira_config_name = $1', [ciraConfigName])
      if (results.rowCount > 0) {
        return true
      } else {
        return false
      }
    } catch (error) {
      this.log.error(`Failed to delete CIRA config : ${ciraConfigName}`, error)
      if (error.code === '23503') { // foreign key violation
        throw new RPSError(CIRA_CONFIG_DELETION_FAILED_CONSTRAINT(ciraConfigName))
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(`Delete CIRA config : ${ciraConfigName}`))
    }
  }

  /**
   * @description Insert CIRA config into DB
   * @param {CIRAConfig} ciraConfig
   * @returns {boolean} Return true on successful insertion
   */
  async insertCiraConfig (ciraConfig: CIRAConfig): Promise<boolean> {
    try {
      const results = await this.db.query('INSERT INTO ciraconfigs(cira_config_name, mps_server_address, mps_port, user_name, password, common_name, server_address_format, auth_method, mps_root_certificate, proxydetails) ' +
        'values($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [
        ciraConfig.ConfigName,
        ciraConfig.MPSServerAddress,
        ciraConfig.MPSPort,
        ciraConfig.Username,
        ciraConfig.Password,
        ciraConfig.CommonName,
        ciraConfig.ServerAddressFormat,
        ciraConfig.AuthMethod,
        ciraConfig.MPSRootCertificate,
        ciraConfig.ProxyDetails
      ])
      if (results.rowCount > 0) {
        return true
      }
      return false
    } catch (error) {
      this.log.error('Failed to insert CIRA config :', error)
      if (error.code === '23505') { // Unique key violation
        throw new RPSError(CIRA_CONFIG_INSERTION_FAILED_DUPLICATE(ciraConfig.ConfigName))
      }
      throw new RPSError(API_UNEXPECTED_EXCEPTION(ciraConfig.ConfigName))
    }
  }

  /**
   * @description Update CIRA config into DB
   * @param {CIRAConfig} ciraConfig object
   * @returns {boolean} Return true on successful updation
   */
  async updateCiraConfig (ciraConfig: CIRAConfig): Promise<boolean> {
    try {
      const results = await this.db.query('UPDATE ciraconfigs SET mps_server_address=$2, mps_port=$3, user_name=$4, password=$5, common_name=$6, server_address_format=$7, auth_method=$8, mps_root_certificate=$9, proxydetails=$10 where cira_config_name=$1',
        [
          ciraConfig.ConfigName,
          ciraConfig.MPSServerAddress,
          ciraConfig.MPSPort,
          ciraConfig.Username,
          ciraConfig.Password,
          ciraConfig.CommonName,
          ciraConfig.ServerAddressFormat,
          ciraConfig.AuthMethod,
          ciraConfig.MPSRootCertificate,
          ciraConfig.ProxyDetails
        ])
      if (results.rowCount > 0) {
        return true
      }
      return false
    } catch (error) {
      this.log.error('Failed to update CIRA config :', error)
      throw new RPSError(API_UNEXPECTED_EXCEPTION(ciraConfig.ConfigName))
    }
  }
}
