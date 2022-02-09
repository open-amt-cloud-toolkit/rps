/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { EnvReader } from '../../../utils/EnvReader'
import Logger from '../../../Logger'
import { API_RESPONSE, API_UNEXPECTED_EXCEPTION } from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'
import { AMTConfiguration, AMTKeyUsage, CertAttributes, TLSCerts } from '../../../models'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'
import { CertManager } from '../../../CertManager'
import { NodeForge } from '../../../NodeForge'

export async function createProfile (req: Request, res: Response): Promise<void> {
  const log = new Logger('createProfile')
  const amtConfig: AMTConfiguration = req.body
  amtConfig.tenantId = req.tenantId
  try {
    const pwdBefore = amtConfig.amtPassword
    const mebxPwdBefore = amtConfig.mebxPassword
    if (req.secretsManager) {
      if (!amtConfig.generateRandomPassword) {
        amtConfig.amtPassword = 'AMT_PASSWORD'
      }
      if (!amtConfig.generateRandomMEBxPassword && amtConfig.activation === 'acmactivate') {
        amtConfig.mebxPassword = 'MEBX_PASSWORD'
      }
    }

    const results: AMTConfiguration = await req.db.profiles.insert(amtConfig)
    if (results == null) {
      throw new Error('AMT Profile not inserted')
    }
    // profile inserted  into db successfully.
    if (req.secretsManager) {
      if (!amtConfig.generateRandomPassword || !amtConfig.generateRandomMEBxPassword) {
      // store the passwords in Vault if not randomly generated per device
        const data = { data: { AMT_PASSWORD: '', MEBX_PASSWORD: '' } }
        if (!amtConfig.generateRandomPassword) {
          data.data.AMT_PASSWORD = pwdBefore
          log.debug('AMT Password written to vault')
        }
        if (!amtConfig.generateRandomMEBxPassword) {
          data.data.MEBX_PASSWORD = mebxPwdBefore
          log.debug('MEBX Password written to vault')
        }
        await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${amtConfig.profileName}`, data)
      }
      // generate self signed certificates for use with TLS config if applicable
      if (amtConfig.tlsMode != null) {
        await generateSelfSignedCertificate(req, amtConfig.profileName)
      }
    }
    delete results.amtPassword
    delete results.mebxPassword
    MqttProvider.publishEvent('success', ['createProfile'], `Created Profile : ${amtConfig.profileName}`)
    res.status(201).json(results).end()
  } catch (error) {
    MqttProvider.publishEvent('fail', ['createProfile'], `Failed to create profile : ${amtConfig.profileName}`)
    log.error(`Failed to create a AMT profile: ${amtConfig.profileName}`, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`Insert AMT profile ${amtConfig.profileName}`))).end()
    }
  }
}

async function generateSelfSignedCertificate (req: Request, profileName: string): Promise<void> {
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

  const certs: {data: TLSCerts} = {
    data: {
      ROOT_CERTIFICATE: rootCert,
      ISSUED_CERTIFICATE: issuedCert
    }
  }

  await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}TLS/${profileName}`, certs)
}
