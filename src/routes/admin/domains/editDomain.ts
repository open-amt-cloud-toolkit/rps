/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { validationResult } from 'express-validator'
import { AMTDomain } from '../../../models/Rcs'
import { IDomainsDb } from '../../../repositories/interfaces/IDomainsDb'
import { DomainsDbFactory } from '../../../repositories/factories/DomainsDbFactory'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, DOMAIN_NOT_FOUND } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'

export async function editDomain (req, res): Promise<void> {
  let domainsDb: IDomainsDb = null
  let amtDomain: AMTDomain = {} as AMTDomain
  let cert: any
  const log = Logger
  let domainPwd: string
  const newDomain = req.body
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }
    domainsDb = DomainsDbFactory.getDomainsDb()
    const oldDomain: AMTDomain = await domainsDb.getDomainByName(newDomain.profileName)
    if (oldDomain == null) {
      res.status(404).json(API_RESPONSE(null, 'Not Found', DOMAIN_NOT_FOUND(newDomain.profileName))).end()
    } else {
      amtDomain = getUpdatedData(newDomain, oldDomain)
      // store the cert and password key in database
      if (req.secretsManager) {
        cert = amtDomain.provisioningCert
        domainPwd = amtDomain.provisioningCertPassword
        amtDomain.provisioningCert = 'CERT'
        amtDomain.provisioningCertPassword = 'CERT_PASSWORD'
      }
      // SQL Query > Insert Data
      const results: AMTDomain = await domainsDb.updateDomain(amtDomain)
      if (results) {
        // Delete the previous values of cert and password in vault and store the updated values
        if (req.secretsManager && (newDomain.provisioningCert != null || newDomain.provisioningCertPassword != null)) {
          const data = {
            data: {
              CERT: cert,
              CERT_PASSWORD: domainPwd
            }
          }
          await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}certs/${amtDomain.profileName}`, data)
          log.debug(`Updated AMT Domain : ${amtDomain.profileName} in vault`)
        }
        delete results.provisioningCert
        delete results.provisioningCertPassword
        res.status(200).json(results).end()
      }
    }
  } catch (error) {
    log.error(`Failed to update AMT Domain : ${amtDomain.profileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`UPDATE ${amtDomain.profileName}`))).end()
    }
  }
}

function getUpdatedData (newDomain: any, oldDomain: AMTDomain): AMTDomain {
  const amtDomain: AMTDomain = { profileName: newDomain.profileName } as AMTDomain
  amtDomain.domainSuffix = newDomain.domainSuffix ?? oldDomain.domainSuffix
  amtDomain.provisioningCert = newDomain.provisioningCert ?? oldDomain.provisioningCert
  amtDomain.provisioningCertStorageFormat = newDomain.provisioningCertStorageFormat ?? oldDomain.provisioningCertStorageFormat
  amtDomain.provisioningCertPassword = newDomain.provisioningCertPassword ?? oldDomain.provisioningCertPassword

  return amtDomain
}
