/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { ICiraConfigDb } from "../../../repositories/interfaces/ICiraConfigDb";
import { CiraConfigDbFactory } from "../../../repositories/CiraConfigDbFactory";
import { EnvReader } from "../../../utils/EnvReader";
import { CIRAConfig } from "../../../RCS.Config";
import Logger from "../../../Logger";
import { CIRA_CONFIG_NOT_FOUND, CIRA_CONFIG_ERROR } from "../../../utils/constants";

export async function getCiraConfig (req, res) {
  let ciraConfigDb: ICiraConfigDb = null;
  let log = Logger("getCiraConfig")
  const { ciraConfigName } = req.params
  try {
    ciraConfigDb = CiraConfigDbFactory.getCiraConfigDb();
    const results:CIRAConfig = await ciraConfigDb.getCiraConfigByName(ciraConfigName);
    if(typeof results === 'undefined' || results === null)
      res.status(404).end(CIRA_CONFIG_NOT_FOUND(ciraConfigName))
    else {
      if (req.secretsManager) {
        log.debug("Retrieve secret from vault")
        results.Password = await req.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${results.ConfigName}`,`${results.ConfigName}_CIRA_PROFILE_PASSWORD`);
      }
      res.status(200).json(results).end()
    }
  } catch (error) {
    log.error(error)
    res.status(500).end(CIRA_CONFIG_ERROR(ciraConfigName))
  }

}