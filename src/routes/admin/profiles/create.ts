/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import Logger from '../../../Logger'
import { type AMTConfiguration, type AMTKeyUsage, AMTUserConsent, type CertAttributes, type TLSCerts } from '../../../models'
import { MqttProvider } from '../../../utils/MqttProvider'
import { type Request, type Response } from 'express'
import { CertManager } from '../../../certManager'
import { NodeForge } from '../../../NodeForge'
import { ClientAction } from '../../../models/RCS.Config'
import handleError from '../../../utils/handleError'
import { type DeviceCredentials } from '../../../interfaces/ISecretManagerService'

export async function createProfile (req: Request, res: Response): Promise<void> {
  let vaultStatus: any
  const log = new Logger('createProfile')
  let amtConfig: AMTConfiguration = req.body
  amtConfig.tenantId = req.tenantId
  try {
    const pwdBefore = amtConfig.amtPassword
    const mebxPwdBefore = amtConfig.mebxPassword
    if (req.secretsManager) {
      if (!amtConfig.generateRandomPassword) {
        amtConfig.amtPassword = 'AMT_PASSWORD'
      }
      if (!amtConfig.generateRandomMEBxPassword && amtConfig.activation === ClientAction.ADMINCTLMODE) {
        amtConfig.mebxPassword = 'MEBX_PASSWORD'
      }
    }

    // Check ReDirection settings
    amtConfig = setRedirectionConfiguration(amtConfig)

    const results: AMTConfiguration = await req.db.profiles.insert(amtConfig)
    if (results == null) {
      throw new Error('AMT Profile not inserted')
    }
    // don't return secrets to the client
    delete results.amtPassword
    delete results.mebxPassword

    // profile inserted  into db successfully.
    if (req.secretsManager) {
      if (!amtConfig.generateRandomPassword || !amtConfig.generateRandomMEBxPassword) {
      // store the passwords in Vault if not randomly generated per device
        const data: DeviceCredentials = { AMT_PASSWORD: '', MEBX_PASSWORD: '' }
        if (!amtConfig.generateRandomPassword) {
          data.AMT_PASSWORD = pwdBefore
          log.debug('AMT Password written to vault')
        }
        if (!amtConfig.generateRandomMEBxPassword) {
          data.MEBX_PASSWORD = mebxPwdBefore
          log.debug('MEBX Password written to vault')
        }
        vaultStatus = await req.secretsManager.writeSecretWithObject(`profiles/${amtConfig.profileName}`, data)
        if (vaultStatus == null) {
          const dbResults: any = await req.db.profiles.delete(amtConfig.profileName)
          if (dbResults == null) {
            throw new Error('Error saving password to secret provider. AMT Profile inserted but unable to undo')
          }
          throw new Error('Error saving password to secret provider. AMT Profile not inserted')
        }
      }
      // generate self signed certificates for use with TLS config if applicable
      if (amtConfig.tlsMode != null) {
        await generateSelfSignedCertificate(req, amtConfig.profileName)
      }
    }

    MqttProvider.publishEvent('success', ['createProfile'], `Created Profile : ${amtConfig.profileName}`)
    res.status(201).json(results).end()
  } catch (error) {
    handleError(log, amtConfig.profileName, req, res, error)
  }
}

export async function generateSelfSignedCertificate (req: Request, profileName: string): Promise<void> {
  // generate root certificate
  const cm = new CertManager(new Logger('CertManager'), new NodeForge())
  const certAttr: CertAttributes = {
    CN: `oact-${profileName}`,
    C: 'country',
    ST: 'state',
    O: 'Intel'
  }
  const rootCert = cm.createCertificate(certAttr)

  const issueAttr: CertAttributes = {
    CN: `oact-issued-${profileName}`,
    C: 'country',
    ST: 'state',
    O: 'Intel'
  }

  const keyUsages: AMTKeyUsage = {
    name: 'extKeyUsage',
    '2.16.840.1.113741.1.2.1': true,
    '2.16.840.1.113741.1.2.2': false,
    '2.16.840.1.113741.1.2.3': false,
    serverAuth: false,
    clientAuth: true,
    emailProtection: false,
    codeSigning: false,
    timeStamping: false
  }
  // gene
  const issuedCert = cm.createCertificate(issueAttr, rootCert.key, null, certAttr, keyUsages)

  const certs: TLSCerts = {
    ROOT_CERTIFICATE: rootCert,
    ISSUED_CERTIFICATE: issuedCert
  }

  await req.secretsManager.writeSecretWithObject(`TLS/${profileName}`, certs)
}

export function setRedirectionConfiguration (amtConfig: AMTConfiguration): AMTConfiguration {
  // sets to default AMT redirection configuration settings, inc ase the information is not given.
  if (amtConfig.userConsent == null) {
    if (amtConfig.activation === ClientAction.CLIENTCTLMODE) {
      amtConfig.userConsent = AMTUserConsent.ALL
    } else {
      amtConfig.userConsent = AMTUserConsent.KVM
    }
  }
  amtConfig.kvmEnabled = amtConfig.kvmEnabled ?? true
  amtConfig.solEnabled = amtConfig.solEnabled ?? false
  amtConfig.iderEnabled = amtConfig.iderEnabled ?? false
  return amtConfig
}
