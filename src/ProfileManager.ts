/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type AMTConfiguration } from './models'
import { type ILogger } from './interfaces/ILogger'
import { type IProfileManager } from './interfaces/IProfileManager'
import { PasswordHelper } from './utils/PasswordHelper'
import { type CIRAConfig } from './models/RCS.Config'
import { type IProfilesTable } from './interfaces/database/IProfilesDb'
import { type Configurator } from './Configurator'
import { type TLSCredentials } from './interfaces/ISecretManagerService'

export class ProfileManager implements IProfileManager {
  private readonly amtConfigurations: IProfilesTable
  private readonly logger: ILogger
  private readonly configurator: Configurator
  private readonly envConfig: any

  constructor (logger: ILogger, configurator: Configurator, amtConfigurations: IProfilesTable, config?: any) {
    this.logger = logger
    this.configurator = configurator
    this.amtConfigurations = amtConfigurations
    this.envConfig = config // This is all Env config stuff
  }

  /**
   * @description Retrieves activation for a given profile
   * @param {string} profileName profile to look up
   * @returns {string} returns the activation to be performed
   */
  public async getActivationMode (profileName: string, tenantId: string): Promise<string> {
    const profile = await this.getAmtProfile(profileName, tenantId)
    let activation: string

    if (profile?.activation) {
      this.logger.debug(`found activation for profile ${profileName}`)
      activation = profile.activation
    } else {
      this.logger.error(`unable to find activation for profile ${profileName}`)
    }

    return activation
  }

  /**
   * @description Retrieves CIRA Configuration for a given profile name
   * @param {string} profile of cira config
   * @returns {string} returns the config for CIRA for a given profile
   */
  public async getCiraConfiguration (profileName: string, tenantId: string): Promise<CIRAConfig> {
    const profile = await this.getAmtProfile(profileName, tenantId)
    let ciraConfig: CIRAConfig

    if (profile?.ciraConfigName && profile.ciraConfigObject) {
      this.logger.debug(`found CIRAConfigObject for profile: ${profile.profileName}`)
      ciraConfig = profile.ciraConfigObject
    } else {
      this.logger.debug(`unable to find CIRAConfig for profile ${profile.profileName}`)
    }

    return ciraConfig
  }

  /**
   * @description Retrieves the amt password set in the configuration or generates non-static password
   * @param {string} profileName profile name of amt password
   * @returns {string} returns the amt password for a given profile
   */
  public async getAmtPassword (profileName: string, tenantId: string): Promise<string> {
    const profile: AMTConfiguration = await this.getAmtProfile(profileName, tenantId)
    let amtPassword: string
    if (profile) {
      if (profile.generateRandomPassword) {
        amtPassword = PasswordHelper.generateRandomPassword()

        if (amtPassword) {
          this.logger.debug(`Created random password for ${profile.profileName}`)
        } else {
          this.logger.error(`unable to create a random password for ${profile.profileName}`)
        }
      } else if (this.configurator?.secretsManager) {
        amtPassword = await this.configurator.secretsManager.getSecretFromKey(`profiles/${profileName}`, 'AMT_PASSWORD')
      } else {
        amtPassword = profile.amtPassword
      }
      this.logger.debug(`found amtPassword for profile ${profileName}`)
      if (!amtPassword) {
        this.logger.error('password cannot be blank')
        throw new Error('password cannot be blank')
      }
      return amtPassword
    } else {
      this.logger.error(`unable to find amtPassword for profile ${profileName}`)
    }
  }

  /**
    * @description Retrieves the amt password set in the configuration or generates a nonstatic password
    * @param {string} profileName profile name of amt password
    * @returns {string} returns the amt password for a given profile
   */
  public async getMEBxPassword (profileName: string, tenantId: string): Promise<string> {
    const profile: AMTConfiguration = await this.getAmtProfile(profileName, tenantId)
    let mebxPassword: string
    if (profile) {
      if (profile.generateRandomMEBxPassword) {
        mebxPassword = PasswordHelper.generateRandomPassword()

        if (mebxPassword) {
          this.logger.debug(`Created random MEBx password for ${profile.profileName}`)
        } else {
          this.logger.error(`unable to create MEBx random password for ${profile.profileName}`)
        }
      } else if (this.configurator?.secretsManager) {
        mebxPassword = await this.configurator.secretsManager.getSecretFromKey(`profiles/${profileName}`, 'MEBX_PASSWORD')
      } else {
        mebxPassword = profile.mebxPassword
      }

      this.logger.debug(`found amtPassword for profile ${profileName}`)
      if (!mebxPassword) {
        this.logger.error('mebx password cannot be blank')
        throw new Error('mebx password cannot be blank')
      }
      return mebxPassword
    } else {
      this.logger.error(`unable to find mebxPassword for profile ${profileName}`)
    }
  }

  /**
     * @description generates a random password unless custom-ui is used which
     * includes an MPS password
     * @param {string} profileName profile name of MPS password
     * @returns {string} returns the MPS password for a given profile
     */
  public async getMPSPassword (profileName: string, tenantId: string): Promise<string> {
    const profile: AMTConfiguration = await this.getAmtProfile(profileName, tenantId)
    let mpsPassword: string

    if (profile?.ciraConfigObject) {
      mpsPassword = PasswordHelper.generateRandomPassword()

      if (mpsPassword) {
        this.logger.debug(`Created random MPS password for ${profile.profileName}`)
      } else {
        this.logger.error(`unable to create MPS random password for ${profile.profileName}`)
      }
    } else {
      this.logger.error(`unable to find mpsPassword for profile ${profileName}`)
    }

    if (mpsPassword) {
      return mpsPassword
    }

    this.logger.error('password cannot be blank')
    throw new Error('password cannot be blank')
  }

  /**
    * @description Checks if the AMT profile exists or not
    * @param {string} profile
    * @returns {AMTConfiguration} returns AMTConfig object if profile exists otherwise null.
    */
  public async getAmtProfile (profile: string, tenantId: string): Promise<AMTConfiguration> {
    try {
      if (!profile) {
        return null
      }
      const amtProfile: AMTConfiguration = await this.amtConfigurations.getByName(profile, tenantId)
      // If the CIRA Config associated with profile, retrieves from DB
      if (amtProfile?.ciraConfigName != null) {
        amtProfile.ciraConfigObject = await this.amtConfigurations.getCiraConfigForProfile(amtProfile.ciraConfigName, tenantId)
      }
      // If the TLS Config associated with profile, retrieves from DB
      if (amtProfile.tlsMode != null && amtProfile.tlsSigningAuthority) {
        if (this.configurator?.secretsManager) {
          const results = await this.configurator.secretsManager.getSecretAtPath(`TLS/${amtProfile.profileName}`)
          amtProfile.tlsCerts = results as TLSCredentials
        }
      }
      this.logger.debug(`AMT Profile returned from db: ${amtProfile?.profileName}`)
      return amtProfile
    } catch (error) {
      this.logger.error(`Failed to get AMT profile: ${error}`)
    }
    return null
  }

  /**
  * @description Checks if the AMT profile exists or not
  * @param {string} profile
  * @returns {boolean} returns true if profile exists otherwise false.
  */
  public async doesProfileExist (profileName: string, tenantId: string): Promise<boolean> {
    const profile = await this.getAmtProfile(profileName, tenantId)
    if (profile) {
      // this.logger.debug(`found profile ${profileName}`);
      return true
    } else {
      this.logger.error(`unable to find profile ${profileName}`)
      return false
    }
  }
}
