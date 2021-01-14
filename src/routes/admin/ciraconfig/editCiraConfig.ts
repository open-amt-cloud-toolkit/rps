/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { ICiraConfigDb } from '../../../repositories/interfaces/ICiraConfigDb'
import { CiraConfigDbFactory } from '../../../repositories/CiraConfigDbFactory'
import { CIRAConfig } from '../../../RCS.Config'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { CIRA_CONFIG_ERROR, PROFILE_INVALID_INPUT, CIRA_CONFIG_UPDATE_SUCCESS, CIRA_CONFIG_NOT_FOUND } from '../../../utils/constants'

export async function editCiraConfig (req, res): Promise<void> {
  const log = new Logger('editCiraConfig')

  let ciraConfigDb: ICiraConfigDb = null
  const ciraConfig: CIRAConfig = readBody(req, res)

  try {
    // console.log("SecretsManagement", req.secretsManager);
    // if generateRandomPassword is false, insert the amtPassword into vault using a
    // key and insert the modified profile into db.

    ciraConfigDb = CiraConfigDbFactory.getCiraConfigDb()

    const pwdBefore = ciraConfig.Password

    if (req.secretsManager) {
      console.log('Generate password key')
      ciraConfig.Password = `${ciraConfig.ConfigName}_CIRA_PROFILE_PASSWORD`
    }

    let errorReason
    // SQL Query > Insert Data
    const results = await ciraConfigDb.updateCiraConfig(ciraConfig).catch((reason) => {
      errorReason = reason
    })

    // profile inserted  into db successfully. insert the secret into vault

    if (!errorReason) {
      // store the password sent into Vault
      if (req.secretsManager) {
        log.debug('Store in vault')
        await req.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfig.ConfigName}`, ciraConfig.Password, pwdBefore)
        log.debug('Password written to vault')
      } else {
        log.debug('No secrets manager configured. Storing in DB.')
        log.debug('Password will be visible in plain text.')
      }
    }

    if (!errorReason && results > 0) {
      res.status(200).end(CIRA_CONFIG_UPDATE_SUCCESS(ciraConfig.ConfigName))
    } else {
      if (results == null) {
        res.status(500).end(`${errorReason}`)
      } else {
        res.status(404).end(CIRA_CONFIG_NOT_FOUND(ciraConfig.ConfigName))
      }
    }
  } catch (error) {
    if (res.status) return
    log.error(error)
    res.status(500).end(CIRA_CONFIG_ERROR(ciraConfig.ConfigName))
  }
}

function readBody (req, res): CIRAConfig {
  const config: CIRAConfig = <CIRAConfig>{}
  const body = req.body

  config.ConfigName = body.payload.configName
  config.MPSServerAddress = body.payload.mpsServerAddress
  config.MPSPort = body.payload.mpsPort
  config.Username = body.payload.username
  config.Password = body.payload.password
  config.CommonName = body.payload.commonName
  config.ServerAddressFormat = body.payload.serverAddressFormat
  config.MPSRootCertificate = body.payload.mpsRootCertificate
  config.ProxyDetails = body.payload.proxyDetails
  config.AuthMethod = body.payload.authMethod

  if (config.ConfigName == null ||
    config.MPSServerAddress == null ||
    config.MPSPort == null ||
    config.Username == null ||
    config.Password == null ||
    config.CommonName == null ||
    config.ServerAddressFormat == null ||
    config.MPSRootCertificate == null ||
    // config.ProxyDetails == null ||
    config.AuthMethod == null) {
    res.status(400).end(PROFILE_INVALID_INPUT)
    return
  }
  return config
}
