/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import Logger from '../../../Logger'
import { NOT_FOUND_EXCEPTION, NOT_FOUND_MESSAGE } from '../../../utils/constants'
import { AMTConfiguration, CertAttributes, AMTKeyUsage, TLSCerts } from '../../../models'
import { ClientAction, ProfileWifiConfigs } from '../../../models/RCS.Config'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'
import { IProfilesWifiConfigsTable } from '../../../interfaces/database/IProfileWifiConfigsDb'
import handleError from '../../../utils/handleError'
import { RPSError } from '../../../utils/RPSError'
import { CertManager } from '../../../certManager'
import { NodeForge } from '../../../NodeForge'

export async function editProfile (req: Request, res: Response): Promise<void> {
  const log = new Logger('editProfile')
  const newConfig = req.body
  newConfig.tenantId = req.tenantId
  try {
    const oldConfig: AMTConfiguration = await req.db.profiles.getByName(newConfig.profileName)

    if (oldConfig == null) {
      throw new RPSError(NOT_FOUND_MESSAGE('AMT', newConfig.profileName), NOT_FOUND_EXCEPTION)
    } else {
      const amtConfig: AMTConfiguration = await getUpdatedData(newConfig, oldConfig)
      amtConfig.wifiConfigs = await handleWifiConfigs(newConfig, oldConfig, req.db.profileWirelessConfigs)
      // Assigning value key value for AMT Random Password and MEBx Random Password to store in database
      const amtPwdBefore = amtConfig.amtPassword
      const mebxPwdBefore = amtConfig.mebxPassword
      if (req.secretsManager) {
        // store the AMT password key into db
        if (!amtConfig.generateRandomPassword) {
          amtConfig.amtPassword = 'AMT_PASSWORD'
        }
        // store the MEBX password key into db
        if (!amtConfig.generateRandomMEBxPassword && amtConfig.activation === ClientAction.ADMINCTLMODE) {
          amtConfig.mebxPassword = 'MEBX_PASSWORD'
        }
      }
      // SQL Query > Insert Data
      const results = await req.db.profiles.update(amtConfig)
      if (results) {
        // check if non-tls to tls
        // then check if certificate exists in vault and generate self-signed if does not exist
        if (oldConfig.tlsMode == null && newConfig.tlsMode != null) {
          // generate self signed certificates for use with TLS config if applicable
          const existingTLSCert = await req.secretsManager.getSecretAtPath(`TLS/${oldConfig.profileName}`)
          if (existingTLSCert == null) {
            await generateSelfSignedCertificate(req, newConfig.profileName)
          }
        }

        // profile inserted  into db successfully. insert the secret into vault
        if (oldConfig.amtPassword !== null || oldConfig.mebxPassword !== null) {
          if (req.secretsManager) {
            log.debug('Delete in vault') // User might be flipping from false to true which we dont know. So try deleting either way.
            await req.secretsManager.deleteSecretWithPath(`profiles/${amtConfig.profileName}`)
            log.debug('Password deleted from vault')
          }
        }
        // store the password sent into Vault
        if (req.secretsManager && (!amtConfig.generateRandomPassword || !amtConfig.generateRandomMEBxPassword)) {
          const data = { data: { AMT_PASSWORD: null, MEBX_PASSWORD: null } }
          if (!amtConfig.generateRandomPassword) {
            data.data.AMT_PASSWORD = amtPwdBefore
            log.debug('AMT Password written to vault')
          }
          if (!amtConfig.generateRandomMEBxPassword) {
            data.data.MEBX_PASSWORD = mebxPwdBefore
            log.debug('MEBX Password written to vault')
          }

          if (data.data.AMT_PASSWORD != null || data.data.MEBX_PASSWORD != null) {
            await req.secretsManager.writeSecretWithObject(`profiles/${amtConfig.profileName}`, data)
          }
        }
        log.verbose(`Updated AMT profile: ${newConfig.profileName}`)
        delete results.amtPassword
        delete results.mebxPassword
        MqttProvider.publishEvent('success', ['editProfile'], `Updated Profile : ${newConfig.profileName}`)
        res.status(200).json(results).end()
      }
    }
  } catch (error) {
    handleError(log, newConfig.profileName, req, res, error)
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

  const certs: { data: TLSCerts } = {
    data: {
      ROOT_CERTIFICATE: rootCert,
      ISSUED_CERTIFICATE: issuedCert
    }
  }

  await req.secretsManager.writeSecretWithObject(`TLS/${profileName}`, certs)
}

export const handleAMTPassword = (amtConfig: AMTConfiguration, newConfig: AMTConfiguration, oldConfig: AMTConfiguration): AMTConfiguration => {
  if (newConfig.amtPassword == null) {
    amtConfig.amtPassword = oldConfig.amtPassword
    amtConfig.generateRandomPassword = false
  } else {
    amtConfig.amtPassword = newConfig.amtPassword
  }
  return amtConfig
}

export const handleMEBxPassword = (amtConfig: AMTConfiguration, newConfig: AMTConfiguration, oldConfig: AMTConfiguration): AMTConfiguration => {
  if (newConfig.mebxPassword == null) {
    amtConfig.mebxPassword = oldConfig.mebxPassword
    amtConfig.generateRandomMEBxPassword = false
  } else {
    amtConfig.mebxPassword = newConfig.mebxPassword
  }
  return amtConfig
}

export const handleGenerateRandomPassword = (amtConfig: AMTConfiguration, newConfig: AMTConfiguration, oldConfig: AMTConfiguration): AMTConfiguration => {
  if (newConfig.generateRandomPassword) {
    amtConfig.generateRandomPassword = newConfig.generateRandomPassword
    amtConfig.amtPassword = null
  } else {
    amtConfig.generateRandomPassword = newConfig.amtPassword == null ? oldConfig.generateRandomPassword : false
  }
  return amtConfig
}

export const handleGenerateRandomMEBxPassword = (amtConfig: AMTConfiguration, newConfig: AMTConfiguration, oldConfig: AMTConfiguration): AMTConfiguration => {
  if (newConfig.generateRandomMEBxPassword) {
    amtConfig.generateRandomMEBxPassword = newConfig.generateRandomMEBxPassword
    amtConfig.mebxPassword = null
  } else {
    amtConfig.generateRandomMEBxPassword = newConfig.mebxPassword == null ? oldConfig.generateRandomMEBxPassword : false
  }
  return amtConfig
}

export const handleWifiConfigs = async (newConfig: AMTConfiguration, oldConfig: AMTConfiguration, profileWifiConfigsDb: IProfilesWifiConfigsTable): Promise<ProfileWifiConfigs[]> => {
  let wifiConfigs: ProfileWifiConfigs[] = null
  if (oldConfig.dhcpEnabled && !newConfig.dhcpEnabled) {
    await profileWifiConfigsDb.deleteProfileWifiConfigs(newConfig.profileName)
  } else if ((oldConfig.dhcpEnabled && newConfig.dhcpEnabled) || (!oldConfig.dhcpEnabled && newConfig.dhcpEnabled)) {
    await profileWifiConfigsDb.deleteProfileWifiConfigs(newConfig.profileName)
    wifiConfigs = newConfig.wifiConfigs
  }
  return wifiConfigs
}

export const getUpdatedData = async (newConfig: any, oldConfig: AMTConfiguration): Promise<AMTConfiguration> => {
  let amtConfig: AMTConfiguration = { profileName: newConfig.profileName } as AMTConfiguration
  amtConfig = handleAMTPassword(amtConfig, newConfig, oldConfig)
  amtConfig = handleMEBxPassword(amtConfig, newConfig, oldConfig)
  amtConfig = handleGenerateRandomPassword(amtConfig, newConfig, oldConfig)
  amtConfig = handleGenerateRandomMEBxPassword(amtConfig, newConfig, oldConfig)
  amtConfig.activation = newConfig.activation ?? oldConfig.activation
  if (amtConfig.activation === ClientAction.CLIENTCTLMODE) {
    amtConfig.mebxPassword = null
    amtConfig.generateRandomMEBxPassword = false
  }
  amtConfig.ciraConfigName = newConfig.ciraConfigName
  amtConfig.tags = newConfig.tags ?? oldConfig.tags
  amtConfig.dhcpEnabled = newConfig.dhcpEnabled ?? oldConfig.dhcpEnabled
  amtConfig.tenantId = newConfig.tenantId ?? oldConfig.tenantId
  amtConfig.tlsMode = newConfig.tlsMode
  amtConfig.userConsent = newConfig.userConsent ?? oldConfig.userConsent
  amtConfig.iderEnabled = newConfig.iderEnabled ?? oldConfig.iderEnabled
  amtConfig.kvmEnabled = newConfig.kvmEnabled ?? oldConfig.kvmEnabled
  amtConfig.solEnabled = newConfig.solEnabled ?? oldConfig.solEnabled
  amtConfig.version = newConfig.version
  return amtConfig
}
