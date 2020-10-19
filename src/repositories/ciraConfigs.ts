/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDbCreator } from "./interfaces/IDbCreator";
import { ICiraConfigDb } from "./interfaces/ICiraConfigDb";
import { CIRAConfig } from "../RCS.Config";
import { mapToCiraConfig } from "./mapToCiraConfig";
import { CIRA_CONFIG_DELETION_FAILED_CONSTRAINT, CIRA_CONFIG_ERROR, CIRA_CONFIG_SUCCESSFULLY_DELETED, CIRA_CONFIG_NOT_FOUND, CIRA_CONFIG_INSERTION_SUCCESS, CIRA_CONFIG_INSERTION_FAILED_DUPLICATE, CIRA_CONFIG_UPDATE_SUCCESS } from "../utils/constants";

export class CiraConfigDb implements ICiraConfigDb {
  db:any;
  constructor(dbCreator: IDbCreator) {
    this.db = dbCreator.getDb();
  }

  async getAllCiraConfigs(mapperFn?: (configName, data) => Promise<any>): Promise<CIRAConfig[]> {
    let results = await this.db.query('SELECT cira_config_name, mps_server_address, mps_port, user_name, password, common_name, server_address_format, auth_method, mps_root_certificate, proxydetails from ciraconfigs');
    
    return Promise.all(results.rows.map(async (p) => 
      { 
        let result = mapToCiraConfig(p); 
        if (mapperFn)
          result.Password = await mapperFn(result.ConfigName, result.Password); 
        return result;
      }
    ));
  }

  async getCiraConfigByName(configName): Promise<CIRAConfig> {
    let results = await this.db.query('SELECT cira_config_name, mps_server_address, mps_port, user_name, password, common_name, server_address_format, auth_method, mps_root_certificate, proxydetails FROM ciraconfigs WHERE cira_config_name = $1', [configName])
    return (results.rowCount > 0 ? mapToCiraConfig(results.rows[0]) : null);
  }

  async deleteCiraConfigByName(ciraConfigName): Promise<any> {
    try {
      let results = await this.db.query('DELETE FROM ciraconfigs WHERE cira_config_name = $1', [ciraConfigName])
      return (results.rowCount > 0 ? CIRA_CONFIG_SUCCESSFULLY_DELETED(ciraConfigName) : CIRA_CONFIG_NOT_FOUND(ciraConfigName));
    } catch (error) {
      console.log(error)
      if(error.code == '23503') // foreign key violation
        throw (CIRA_CONFIG_DELETION_FAILED_CONSTRAINT(ciraConfigName))
        
      throw (CIRA_CONFIG_ERROR(ciraConfigName))
    }
  }

  async insertCiraConfig(ciraConfig: CIRAConfig): Promise<any> {
    try {
      let results = await this.db.query('INSERT INTO ciraconfigs(cira_config_name, mps_server_address, mps_port, user_name, password, common_name, server_address_format, auth_method, mps_root_certificate, proxydetails) ' +
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
        ]);

      if (results.rowCount > 0)
        return CIRA_CONFIG_INSERTION_SUCCESS(ciraConfig.ConfigName);

      return null;
    } catch (error) {
        console.log(error)
        if(error.code == '23505') // Unique key violation
          throw (CIRA_CONFIG_INSERTION_FAILED_DUPLICATE(ciraConfig.ConfigName))
        
        throw (CIRA_CONFIG_ERROR(ciraConfig.ConfigName))
    }

  }

  async updateCiraConfig(ciraConfig: CIRAConfig): Promise<any> {
    try {
      let results = await this.db.query('UPDATE ciraconfigs SET mps_server_address=$2, mps_port=$3, user_name=$4, password=$5, common_name=$6, server_address_format=$7, auth_method=$8, mps_root_certificate=$9, proxydetails=$10 where cira_config_name=$1',
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
        ]);

      return results.rowCount;

    } catch (error) {
        console.log(error)
        
        throw (CIRA_CONFIG_ERROR(ciraConfig.ConfigName))
    }

  }
}