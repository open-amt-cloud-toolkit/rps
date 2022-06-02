/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { AMTDomain } from '../../../models'
import Logger from '../../../Logger'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'
import handleError from '../../../utils/handleError'

export async function createDomain (req: Request, res: Response): Promise<void> {
  const amtDomain: AMTDomain = req.body
  amtDomain.tenantId = req.tenantId
  const log = new Logger('createDomain')
  let cert: any
  let domainPwd: string
  try {
    // store the cert and password key in database
    if (req.secretsManager) {
      cert = amtDomain.provisioningCert
      domainPwd = amtDomain.provisioningCertPassword
      amtDomain.provisioningCert = 'CERT'
      amtDomain.provisioningCertPassword = 'CERT_PASSWORD'
    }
    // SQL Query > Insert Data
    const results: AMTDomain = await req.db.domains.insert(amtDomain)
    // store the actual cert and password into Vault
    if (results != null) {
      if (req.secretsManager) {
        const data = {
          data: {
            CERT: cert,
            CERT_PASSWORD: domainPwd
          }
        }
        await req.secretsManager.writeSecretWithObject(`certs/${amtDomain.profileName}`, data)
        log.debug(`${amtDomain.profileName} provisioning cert & password stored in Vault`)
      }
      log.verbose(`Created Domain : ${amtDomain.profileName}`)
      delete results.provisioningCert
      delete results.provisioningCertPassword
      MqttProvider.publishEvent('success', ['createDomain'], `Created Domain : ${amtDomain.profileName}`)
      res.status(201).json(results).end()
    }
  } catch (error) {
    handleError(log, amtDomain.profileName, req, res, error)
  }
}
