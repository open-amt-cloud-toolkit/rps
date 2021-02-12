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
  const amtDomain: AMTDomain = {} as AMTDomain
  const log = new Logger('createDomain')
  let cert: any
  let domainPwd: string
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }
    amtDomain.Name = req.body.payload.profileName
    amtDomain.DomainSuffix = req.body.payload.domainSuffix
    amtDomain.ProvisioningCert = req.body.payload.provisioningCert
    amtDomain.ProvisioningCertStorageFormat = req.body.payload.provisioningCertStorageFormat
    amtDomain.ProvisioningCertPassword = req.body.payload.provisioningCertPassword
    domainsDb = DomainsDbFactory.getDomainsDb()

    // store the cert and password key in database
    if (req.secretsManager) {
      cert = amtDomain.ProvisioningCert
      domainPwd = amtDomain.ProvisioningCertPassword
      amtDomain.ProvisioningCert = `${amtDomain.Name}_CERT_KEY`
      amtDomain.ProvisioningCertPassword = `${amtDomain.Name}_CERT_PASSWORD_KEY`
    }
    // SQL Query > Insert Data
    const results = await domainsDb.insertDomain(amtDomain)
    // store the actual cert and password into Vault
    if (results) {
      if (req.secretsManager) {
        const data = { data: { CERT_KEY: '', CERT_PASSWORD_KEY: '' } }
        data.data.CERT_KEY = cert
        data.data.CERT_PASSWORD_KEY = domainPwd
        await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}certs/${amtDomain.Name}`, data)
        log.info(`${amtDomain.Name} provisioing cert & password stored in Vault`)
      }
      log.info(`Created Domain : ${amtDomain.Name}`)
      res.status(201).json(API_RESPONSE(null, null, DOMAIN_INSERTION_SUCCESS(amtDomain.Name))).end()
    }
  } catch (error) {
    log.error(`Failed to create a AMT Domain : ${amtDomain.Name}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Insert Domain ${amtDomain.Name}`))).end()
    }
  }
}
