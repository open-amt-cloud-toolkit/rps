/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { TlsConfigs } from '../../../models/RCS.Config'
import Logger from '../../../Logger'
import {
  API_UNEXPECTED_EXCEPTION,
  API_RESPONSE
} from '../../../utils/constants'
import { RPSError } from '../../../utils/RPSError'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'
import { CertManager } from '../../../CertManager'
import { NodeForge } from '../../../NodeForge'
import { EnvReader } from '../../../utils/EnvReader'
import { AMTKeyUsage, CertAttributes } from '../../../models/Rcs'

export async function createTlsConfig (req: Request, res: Response): Promise<void> {
  const log = new Logger('createTlsConfig')
  const config: TlsConfigs = req.body
  config.tenantId = req.tenantId

  try {
    // generate root certificate
    const cm = new CertManager(new Logger('CertManager'), new NodeForge())
    const certAttr: CertAttributes = {
      CN: config.commonName,
      C: config.country,
      ST: config.stateOrProvince,
      O: config.organization
    }
    const rootCert = cm.createCertificate(certAttr)

    const issueAttr: CertAttributes = {
      CN: config.issuedCommonName,
      C: config.country,
      ST: config.stateOrProvince,
      O: config.organization
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

    const issuedCert = cm.createCertificate(issueAttr, rootCert.key, null, certAttr, keyUsages)

    const certs = {
      data: {
        ROOT_CERTIFICATE: rootCert,
        ISSUED_CERTIFICATE: issuedCert
      }
    }

    const result = await req.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}TLS/${config.configName}`, certs)

    config.certVersion = Number(result?.data?.version)

    const results: TlsConfigs = await req.db.tlsConfigs.insert(config)
    if (results != null) {
      log.verbose(`Created TLS config : ${config.configName}`)
      MqttProvider.publishEvent('success', ['createTlsConfig'], `Created ${config.configName}`)
      res.status(201).json(results).end()
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['createTlsConfig'], `Failed to create TLS config profile ${config.configName}`)
    log.error(`Failed to create TLS config profile: ${config.configName} `, error)
    if (error instanceof RPSError) {
      res.status(400).json(API_RESPONSE(null, error.name, error.message)).end()
    } else {
      res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(`CREATE ${config.configName}`))).end()
    }
  }
}
