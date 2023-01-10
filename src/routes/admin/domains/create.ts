/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMTDomain } from '../../../models'
import Logger from '../../../Logger'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'
import handleError from '../../../utils/handleError'
import { CertCredentials } from '../../../interfaces/ISecretManagerService'

export async function createDomain (req: Request, res: Response): Promise<void> {
  let vaultStatus: any
  const amtDomain: AMTDomain = req.body
  amtDomain.tenantId = req.tenantId
  const log = new Logger('createDomain')
  let cert: string
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
    if (results == null) {
      throw new Error('AMT domain not inserted')
    }
    // don't return secrets to the client
    delete results.provisioningCert
    delete results.provisioningCertPassword

    if (req.secretsManager) {
      const data: CertCredentials = {
        CERT: cert,
        CERT_PASSWORD: domainPwd
      }
      // save to secret provider
      vaultStatus = await req.secretsManager.writeSecretWithObject(`certs/${amtDomain.profileName}`, data)
      if (vaultStatus == null) {
        const dbResults: any = await req.db.domains.delete(amtDomain.profileName)
        if (dbResults == null) {
          throw new Error('Error saving password to secret provider. AMT domain inserted but unable to undo')
        }
        throw new Error('Error saving password to secret provider. AMT domain not inserted')
      }
    }

    log.verbose(`Created Domain : ${amtDomain.profileName}`)
    MqttProvider.publishEvent('success', ['createDomain'], `Created Domain : ${amtDomain.profileName}`)
    res.status(201).json(results).end()
  } catch (error) {
    handleError(log, amtDomain.profileName, req, res, error)
  }
}
