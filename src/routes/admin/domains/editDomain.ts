/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { AMTDomain } from '../../../models'
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION, DOMAIN_NOT_FOUND } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function editDomain (req: Request, res: Response): Promise<void> {
  let amtDomain: AMTDomain = {} as AMTDomain
  const log = new Logger('editDomain')
  let cert: any
  let domainPwd: string
  const newDomain = req.body
  newDomain.tenantId = req.tenantId
  try {
    const oldDomain: AMTDomain = await req.db.domains.getByName(newDomain.profileName)
    if (oldDomain == null) {
      MqttProvider.publishEvent('fail', ['editDomain'], `Domain Not Found : ${newDomain.profileName}`)
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
      const results: AMTDomain = await req.db.domains.update(amtDomain)
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
        MqttProvider.publishEvent('success', ['editDomain'], `Domain Updated : ${amtDomain.profileName}`)
        res.status(200).json(results).end()
      }
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['editDomain'], `Failed to update domain : ${amtDomain.profileName}`)
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
  amtDomain.tenantId = newDomain.tenantId ?? oldDomain.tenantId
  return amtDomain
}
