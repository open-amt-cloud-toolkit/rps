/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type IDomainCredentialManager } from './interfaces/IDomainCredentialManager'
import { type ILogger } from './interfaces/ILogger'
import { type IDomainsTable } from './interfaces/database/IDomainsDb'
import { type AMTDomain } from './models'
import { type Configurator } from './Configurator'
import { type CertCredentials } from './interfaces/ISecretManagerService'

export class DomainCredentialManager implements IDomainCredentialManager {
  private readonly amtDomains: IDomainsTable
  private readonly logger: ILogger
  private readonly configurator: Configurator = null

  constructor (logger: ILogger, amtDomains: IDomainsTable, configurator?: Configurator) {
    this.amtDomains = amtDomains
    this.logger = logger
    this.configurator = configurator
  }

  /**
     * @description get the provisioning cert for a given domain
     * @param {string} domainSuffix
     * @param {string} tenantId
     * @returns {AMTDomain} returns domain object
     */
  async getProvisioningCert (domainSuffix: string, tenantId: string): Promise<AMTDomain> {
    const domain = await this.amtDomains.getDomainByDomainSuffix(domainSuffix, tenantId)
    this.logger.debug(`domain : ${JSON.stringify(domain)}`)

    if (domain?.provisioningCert) {
      if (this.configurator?.secretsManager) {
        const certPwd = await this.configurator.secretsManager.getSecretAtPath(`certs/${domain.profileName}`) as CertCredentials
        this.logger.debug('Received CertPwd from vault')
        domain.provisioningCert = certPwd.CERT
        domain.provisioningCertPassword = certPwd.CERT_PASSWORD
      }
    } else {
      this.logger.error(`unable to find provisioning cert for profile ${domainSuffix}`)
    }
    return domain
  }

  /**
    * @description Checks if the AMT domain exists or not
    * @param {string} domainSuffix
    * @param {string} tenantId
    * @returns {boolean} returns true if domain exists otherwise false.
    */
  public async doesDomainExist (domainSuffix: string, tenantId: string): Promise<boolean> {
    if (await this.amtDomains.getDomainByDomainSuffix(domainSuffix, tenantId)) {
      return true
    } else {
      return false
    }
  }
}
