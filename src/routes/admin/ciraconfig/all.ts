/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { ICiraConfigDb } from "../../../repositories/interfaces/ICiraConfigDb";
import { CiraConfigDbFactory } from "../../../repositories/CiraConfigDbFactory";
import { EnvReader } from "../../../utils/EnvReader";
import Logger from "../../../Logger";
import { CIRA_CONFIG_EMPTY, CIRA_CONFIG_ERROR } from "../../../utils/constants";

export async function allCiraConfigs(req, res) {
  let ciraConfigDb:ICiraConfigDb = null;
  let log = Logger("allCiraConfigs")
  try {
    ciraConfigDb = CiraConfigDbFactory.getCiraConfigDb();
    let mapperFn = async (configName, ciraMpsPassword) => {
      // if (req.secretsManager && ciraMpsPassword) {
      //   log.debug("retrieve secret from vault")
      //   return await req.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${configName}`,`${configName}_CIRA_PROFILE_PASSWORD`);
      // }
      // return ciraMpsPassword;
      
      // Return null. Check Security objectives around returning passwords.
      return null;
    }
    const results = await ciraConfigDb.getAllCiraConfigs(mapperFn);
    if(typeof results === 'undefined' || results.length === 0)
      res.status(404).end(CIRA_CONFIG_EMPTY())
    else
      res.status(200).json(results).end()

  } catch (error) {
    log.error(error)
    res.status(500).end(CIRA_CONFIG_ERROR(""))
  }
}
