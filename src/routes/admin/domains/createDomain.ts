/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { validationResult } from 'express-validator'
import { AMTDomain } from '../../../models/Rcs'
import { IDomainsDb } from '../../../repositories/interfaces/IDomainsDb'
import { DomainsDbFactory } from '../../../repositories/DomainsDbFactory'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, DOMAIN_INSERTION_SUCCESS } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'

export async function createDomain (req, res): Promise<void> {
  let domainsDb: IDomainsDb = null
  let amtDomain: AMTDomain = null
  const log = new Logger('createDomain')
  let cert: any
  let domainPwd: string
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }
    amtDomain = req.body.payload
    domainsDb = DomainsDbFactory.getDomainsDb()

    // store the cert and password key in database
    if (req.secretsManager) {
      cert = amtDomain.provisioningCert
      domainPwd = amtDomain.provisioningCertPassword
      amtDomain.provisioningCert = `${amtDomain.profileName}_CERT_KEY`
      amtDomain.provisioningCertPassword = `${amtDomain.profileName}_CERT_PASSWORD_KEY`
    }
    // SQL Query > Insert Data
    const results = await domainsDb.insertDomain(amtDomain)
    // store the actual cert and password into Vault
    if (results) {
      if (req.secretsManager) {
        const data = { data: { CERT_KEY: '', CERT_PASSWORD_KEY: '' } }
        data.data.CERT_KEY = cert
        data.data.CERT_PASSWORD_KEY = domainPwd
        await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}certs/${amtDomain.profileName}`, data)
        log.info(`${amtDomain.profileName} provisioing cert & password stored in Vault`)
      }
      log.info(`Created Domain : ${amtDomain.profileName}`)
      res.status(201).json(API_RESPONSE(null, null, DOMAIN_INSERTION_SUCCESS(amtDomain.profileName))).end()
    }
  } catch (error) {
    log.error(`Failed to create a AMT Domain : ${amtDomain.profileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Insert Domain ${amtDomain.profileName}`))).end()
    }
  }
}
