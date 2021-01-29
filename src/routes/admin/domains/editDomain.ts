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
import { API_UNEXPECTED_EXCEPTION, DOMAIN_NOT_FOUND } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'

export async function editDomain (req, res): Promise<void> {
  let domainsDb: IDomainsDb = null
  let amtDomain: AMTDomain = {} as AMTDomain
  const log = new Logger('editDomain')
  let cert: any
  let domainPwd: string
  const newDomain = req.body.payload
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() })
      return
    }
    domainsDb = DomainsDbFactory.getDomainsDb()
    const oldDomain: AMTDomain = await domainsDb.getDomainByName(newDomain.profileName)
    if (Object.keys(oldDomain).length === 0) {
      res.status(404).end(DOMAIN_NOT_FOUND(newDomain.profileName))
    } else {
      amtDomain = getUpdatedData(newDomain, oldDomain)
      // store the cert and password key in database
      if (req.secretsManager) {
        cert = amtDomain.ProvisioningCert
        domainPwd = amtDomain.ProvisioningCertPassword
        amtDomain.ProvisioningCert = `${amtDomain.Name}_CERT_KEY`
        amtDomain.ProvisioningCertPassword = `${amtDomain.Name}_CERT_PASSWORD_KEY`
      }
      // SQL Query > Insert Data
      const results = await domainsDb.updateDomain(amtDomain)
      if (results) {
        // Delete the previous values of cert and password in vault and store the updated values
        if (req.secretsManager && (newDomain.provisioningCert != null || newDomain.provisioningCertPassword != null)) {
          const data = { data: {} }
          await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}certs/${amtDomain.Name}`)
          data.data[`${amtDomain.Name}_CERT_KEY`] = cert
          data.data[`${amtDomain.Name}_CERT_PASSWORD_KEY`] = domainPwd
          await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}certs/${amtDomain.Name}`, data)
          log.debug(`Updated AMT Domain : ${amtDomain.Name} in vault`)
        }
        res.status(204).end()
      }
    }
  } catch (error) {
    log.error(`Failed to update AMT Domain : ${amtDomain.Name}`, error)
    if (error instanceof RPSError) {
      res.status(400).end(error.message)
    } else {
      res.status(500).end(API_UNEXPECTED_EXCEPTION(`UPDATE ${amtDomain.Name}`))
    }
  }
}

function getUpdatedData (newDomain: any, oldDomain: AMTDomain): AMTDomain {
  const amtDomain: AMTDomain = {} as AMTDomain
  amtDomain.Name = newDomain.profileName

  if (newDomain.domainSuffix == null) {
    amtDomain.DomainSuffix = oldDomain.DomainSuffix
  } else {
    amtDomain.DomainSuffix = newDomain.domainSuffix
  }

  if (newDomain.provisioningCert == null) {
    amtDomain.ProvisioningCert = oldDomain.ProvisioningCert
  } else {
    amtDomain.ProvisioningCert = newDomain.provisioningCert
  }

  if (newDomain.provisioningCertStorageFormat == null) {
    amtDomain.ProvisioningCertStorageFormat = oldDomain.ProvisioningCertStorageFormat
  } else {
    amtDomain.ProvisioningCertStorageFormat = newDomain.provisioningCertStorageFormat
  }

  if (newDomain.provisioningCertPassword == null) {
    amtDomain.ProvisioningCertPassword = oldDomain.ProvisioningCertPassword
  } else {
    amtDomain.ProvisioningCertPassword = newDomain.provisioningCertPassword
  }

  return amtDomain
}
