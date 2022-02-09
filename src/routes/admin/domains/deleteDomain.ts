/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { DOMAIN_NOT_FOUND, API_UNEXPECTED_EXCEPTION, API_RESPONSE } from '../../../utils/constants'
import { EnvReader } from '../../../utils/EnvReader'
import { AMTDomain } from '../../../models'
import Logger from '../../../Logger'
import { MqttProvider } from '../../../utils/MqttProvider'
import { Request, Response } from 'express'

export async function deleteDomain (req: Request, res: Response): Promise<void> {
  const log = new Logger('deleteDomain')
  const { domainName } = req.params
  try {
    const domain: AMTDomain = await req.db.domains.getByName(domainName)
    if (domain == null) {
      MqttProvider.publishEvent('fail', ['deleteDomain'], `Domain Not Found : ${domainName}`)
      res.status(404).json(API_RESPONSE(null, 'Not Found', DOMAIN_NOT_FOUND(domainName))).end()
    } else {
      const results = await req.db.domains.delete(domainName)
      if (results) {
        if (req.secretsManager) {
          await req.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}certs/${domain.profileName}`)
        }
        MqttProvider.publishEvent('success', ['deleteDomain'], `Domain Deleted : ${domainName}`)
        res.status(204).end()
      }
    }
  } catch (error) {
    MqttProvider.publishEvent('fail', ['deleteDomain'], `Failed to delete domain : ${domainName}`)
    log.error(`Failed to delete AMT Domain : ${domainName}`, error)
    res.status(500).json(API_RESPONSE(null, null, API_UNEXPECTED_EXCEPTION(domainName))).end()
  }
}
