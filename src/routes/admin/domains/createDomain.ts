/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { AMTDomain } from '../../../models/Rcs'
import { IDomainsDb } from '../../../interfaces/database/IDomainsDb'
import { DomainsDbFactory } from '../../../repositories/factories/DomainsDbFactory'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function createDomain (req: Request, res: Response): Promise<void> {
  let domainsDb: IDomainsDb = null
  const amtDomain: AMTDomain = req.body
  amtDomain.tenantId = req.tenantId
  const log = new Logger('createDomain')
  let cert: any
  let domainPwd: string
  try {
    domainsDb = DomainsDbFactory.getDomainsDb()

    // store the cert and password key in database
    if (req.secretsManager) {
      cert = amtDomain.provisioningCert
      domainPwd = amtDomain.provisioningCertPassword
      amtDomain.provisioningCert = 'CERT'
      amtDomain.provisioningCertPassword = 'CERT_PASSWORD'
    }
    // SQL Query > Insert Data
    const results: AMTDomain = await domainsDb.insert(amtDomain)
    // store the actual cert and password into Vault
    if (results != null) {
      if (req.secretsManager) {
        const data = {
          data: {
            CERT: cert,
            CERT_PASSWORD: domainPwd
          }
        }
        await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}certs/${amtDomain.profileName}`, data)
        log.debug(`${amtDomain.profileName} provisioning cert & password stored in Vault`)
      }
      log.verbose(`Created Domain : ${amtDomain.profileName}`)
      delete results.provisioningCert
      delete results.provisioningCertPassword
      MqttProvider.publishEvent('success', ['createDomain'], `Created Domain : ${amtDomain.profileName}`)
      res.status(201).json(results).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['createDomain'], `Failed to create a AMT Domain : ${amtDomain.profileName}`)
    log.error(`Failed to create a AMT Domain : ${amtDomain.profileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Insert Domain ${amtDomain.profileName}`))).end()
    }
  }
}
