/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: stores domain certificates
 * Author: Brian Osburn
 **********************************************************************/

import { IDomainCredentialManager } from './interfaces/IDomainCredentialManager'
import { ILogger } from './interfaces/ILogger'
import { IConfigurator } from './interfaces/IConfigurator'
import { IDomainsDb } from './repositories/interfaces/IDomainsDb'
import { EnvReader } from './utils/EnvReader'
import { AMTDomain } from './models/Rcs'

export class DomainCredentialManager implements IDomainCredentialManager {
  private readonly amtDomains: IDomainsDb
  private readonly logger: ILogger
  private readonly configurator: IConfigurator = null

  constructor (logger: ILogger, amtDomains: IDomainsDb, configurator?: IConfigurator) {
    this.amtDomains = amtDomains
    this.logger = logger
    this.configurator = configurator
  }

  /**
     * @description get the provisioning cert storage format for a given domain
     * @param {string} domainSuffix
     * @returns {string} returns path to provisioning cert storage format if domain is found otherwise null
     */
  async getProvisioningCertStorageType (domainSuffix: string): Promise<string> {
    const domain = await this.getAMTDomain(domainSuffix)
    let format: string = null
    if (domain?.ProvisioningCertStorageFormat) {
      format = domain.ProvisioningCertStorageFormat
    } else {
      this.logger.warn(`unable to find provisioning cert storage format for profile ${domainSuffix}`)
    }

    return format
  }

  /**
     * @description get the provisioning cert for a given domain
     * @param {string} domainSuffix
     * @returns {string} returns path to provisioning cert if domain is found otherwise null
     */
  async getProvisioningCert (domainSuffix: string): Promise<string> {
    const domain = await this.getAMTDomain(domainSuffix)
    let cert: string = null
    if (domain?.ProvisioningCert) {
      this.logger.debug(`found provisioning cert for domain ${domainSuffix}`)
      cert = domain.ProvisioningCert
    } else {
      this.logger.warn(`unable to find provisioning cert for profile ${domainSuffix}`)
    }

    return cert
  }

  /**
     * @description get the provisioning cert password for a given domain
     * @param {string} domainSuffix
     * @returns {string} returns provisioning cert password if domain is found otherwise null
     */
  async getProvisioningCertPassword (domainSuffix: string): Promise<string> {
    const domain = await this.getAMTDomain(domainSuffix)
    let cert: string = null

    if (domain?.ProvisioningCertPassword) {
      let provisionCertPwd = null
      if (this.configurator?.secretsManager) {
        this.logger.info('Calling secret manager')
        provisionCertPwd = await this.configurator.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}certs/${domain.Name}/PROVISIONING_CERT`, domain.ProvisioningCertPassword)
      } else {
        provisionCertPwd = domain.ProvisioningCertPassword
      }
      this.logger.debug(`found provisioning cert pwd for domain ${domainSuffix}`)
      cert = provisionCertPwd
    } else {
      this.logger.error(`unable to find provisioning cert password for profile ${domainSuffix}`)
    }

    return cert
  }

  /**
    * @description retrieve AMT domain
    * @param {string} domainSuffix
    * @returns {AMTDomain} returns amtdomain object if domain exists otherwise null.
    */
  private async getAMTDomain (domainSuffix: string): Promise<AMTDomain> {
    const amtDomainList = await this.amtDomains.getAllDomains()
    for (let index = 0; index < amtDomainList.length; ++index) {
      if (amtDomainList[index].DomainSuffix === domainSuffix) {
        this.logger.debug(`found amt domain: ${domainSuffix}`)
        this.logger.silly(`Domain Info ${domainSuffix}: ${JSON.stringify(amtDomainList[index])}`)
        return amtDomainList[index]
      }
    }

    this.logger.error(`Failed to find amt domain for ${domainSuffix}`)
    return null
  }

  /**
    * @description Checks if the AMT domain exists or not
    * @param {string} domain
    * @returns {boolean} returns true if domain exists otherwise false.
    */
  public async doesDomainExist (domain: string): Promise<boolean> {
    if (await this.getAMTDomain(domain)) {
      return true
    } else {
      return false
    }
  }
}
