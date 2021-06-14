/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: stores domain certificates
 * Author: Brian Osburn
 **********************************************************************/

import { IDomainCredentialManager } from './interfaces/IDomainCredentialManager'
import { IConfigurator } from './interfaces/IConfigurator'
import { IDomainsDb } from './repositories/interfaces/IDomainsDb'
import { EnvReader } from './utils/EnvReader'
import { AMTDomain } from './models/Rcs'
import Logger from './Logger'

export class DomainCredentialManager implements IDomainCredentialManager {
  private readonly amtDomains: IDomainsDb
  private readonly log: Logger = new Logger('DomainCredentialManager')
  private readonly configurator: IConfigurator = null

  constructor (amtDomains: IDomainsDb, configurator?: IConfigurator) {
    this.amtDomains = amtDomains
    this.configurator = configurator
  }

  /**
     * @description get the provisioning cert storage format for a given domain
     * @param {string} domainSuffix
     * @returns {string} returns path to provisioning cert storage format if domain is found otherwise null
     */
  async getProvisioningCertStorageType (domainSuffix: string): Promise<string> {
    const domain = await this.amtDomains.getDomainByDomainSuffix(domainSuffix)
    let format: string = null
    if (domain?.provisioningCertStorageFormat) {
      format = domain.provisioningCertStorageFormat
    } else {
      this.log.warn(`unable to find provisioning cert storage format for profile ${domainSuffix}`)
    }

    return format
  }

  /**
     * @description get the provisioning cert for a given domain
     * @param {string} domainSuffix
     * @returns {AMTDomain} returns domain object
     */
  async getProvisioningCert (domainSuffix: string): Promise<AMTDomain> {
    const domain = await this.amtDomains.getDomainByDomainSuffix(domainSuffix)
    this.log.info(`domain : ${JSON.stringify(domain)}`)
    let certPwd = null
    if (domain?.provisioningCert) {
      if (this.configurator?.secretsManager) {
        certPwd = await this.configurator.secretsManager.getSecretAtPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}certs/${domain.profileName}`)
        this.log.info('Received CertPwd from vault')
        domain.provisioningCert = certPwd.data.CERT
        domain.provisioningCertPassword = certPwd.data.CERT_PASSWORD
      }
    } else {
      this.log.warn(`unable to find provisioning cert for profile ${domainSuffix}`)
    }
    return domain
  }

  /**
    * @description Checks if the AMT domain exists or not
    * @param {string} domainSuffix
    * @returns {boolean} returns true if domain exists otherwise false.
    */
  public async doesDomainExist (domainSuffix: string): Promise<boolean> {
    if (await this.amtDomains.getDomainByDomainSuffix(domainSuffix)) {
      return true
    } else {
      return false
    }
  }
}
