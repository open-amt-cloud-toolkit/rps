/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: stores amt profiles
 * Author: Brian Osburn
 **********************************************************************/

import { AMTConfiguration } from './models/Rcs'
import { ILogger } from './interfaces/ILogger'
import { IProfileManager } from './interfaces/IProfileManager'
import { PasswordHelper } from './utils/PasswordHelper'
import { CIRAConfig } from './RCS.Config'
import { IConfigurator } from './interfaces/IConfigurator'
import { IProfilesDb } from './repositories/interfaces/IProfilesDb'
import { EnvReader } from './utils/EnvReader'

export class ProfileManager implements IProfileManager {
  private readonly amtConfigurations: IProfilesDb
  private readonly logger: ILogger
  private readonly configurator: IConfigurator
  private readonly envConfig: any

  constructor (logger: ILogger, configurator: IConfigurator, amtConfigurations: IProfilesDb, config?: any) {
    this.logger = logger
    this.configurator = configurator
    // this.amtConfigurations = this.validateAMTPasswords(amtConfigurations, allowGenerateRandomAmtPassowrds);
    this.amtConfigurations = amtConfigurations
    this.envConfig = config // This is all Env config stuff
  }

  /**
   * @description Checks the AMT passwords in the rcsConfig and rejects any configurations that don't meet AMT password standard
   * @param {AMTConfiguration[]} list
   * @returns {AMTConfiguration[]} returns amtconfig object if profile exists otherwise null.
   */
  public validateAMTPasswords (list: AMTConfiguration[]): AMTConfiguration[] {
    const profiles: AMTConfiguration[] = []

    for (let x = 0; x < list.length; x++) {
      const config = list[x]

      // TODO: took password validation out for now. with Vault can only validate at insertion time which is done prior by an admin.

      // if (config.GenerateRandomPassword === true) {
      //     if (allowGenerateRandomAmtPassowrds === true) {
      //         this.logger.debug(`using random passwords for profile ${config.ProfileName}`);
      //         profiles.push(config);
      //     }
      //     else {
      //         this.logger.warn(`dropping profile ${config.ProfileName}, random passwords are not allowed`);
      //     }
      // } else {
      //     if (PasswordHelper.passwordCheck(config.AMTPassword)) {
      //         this.logger.debug("amt password check passed for profile: " + config.ProfileName + ".");
      //         profiles.push(config);
      //     }
      //     else {
      //         this.logger.warn("Detected bad AMT password for profile: " + config.ProfileName + ".");
      //         this.logger.warn("Removing " + config.ProfileName + " profile from list of available AMT profiles.");
      //     }
      // }

      profiles.push(config)
    }

    if (profiles.length === 0) {
      this.logger.error('Warning: No AMT configurations detected.')
    }

    return profiles
  }

  /**
   * @description Retrieves activation for a given profile
   * @param {string} profileName profile to look up
   * @returns {string} returns the activation to be performed
   */
  public async getActivationMode (profileName: string): Promise<string> {
    const profile = await this.getAmtProfile(profileName)
    let activation: string

    if (profile?.activation) {
      this.logger.debug(`found activation for profile ${profileName}`)
      activation = profile.activation
    } else {
      this.logger.warn(`unable to find activation for profile ${profileName}`)
    }

    return activation
  }

  /**
   * @description Retrieves CIRA Configuration for a given profile name
   * @param {string} profile of cira config
   * @returns {string} returns the config for CIRA for a given profile
   */
  public async getCiraConfiguration (profileName: string): Promise<CIRAConfig> {
    const profile = await this.getAmtProfile(profileName)
    let ciraConfig: CIRAConfig

    if (profile?.ciraConfigName && profile.ciraConfigObject) {
      this.logger.debug(`found CIRAConfigObject for profile ${JSON.stringify(profile)}`)
      ciraConfig = profile.ciraConfigObject

      this.logger.debug(`retrieve CIRA MPS Password for cira config ${ciraConfig.configName}`)
      if (this.configurator?.secretsManager) {
        ciraConfig.password = await this.configurator.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfig.configName}`, 'MPS_PASSWORD')
      }
    } else {
      this.logger.debug(`unable to find CIRAConfig for profile ${JSON.stringify(profile)}`)
    }

    return ciraConfig
  }

  /**
   * @description Retrieves configuration script for a given profile
   * @param {string} profile of config script
   * @returns {string} returns the config script for a given profile
   */
  public async getConfigurationScript (profileName: string): Promise<string> {
    const profile = await this.getAmtProfile(profileName)
    let configScript: string

    if (profile?.configurationScript) {
      this.logger.debug(`found configScript for profile ${profileName}`)
      configScript = profile.configurationScript
    } else {
      this.logger.debug(`unable to find configScript for profile ${profileName}`)
    }

    return configScript
  }

  /**
   * @description Retrieves the amt password set in the configuration or generates a password based on the flag GenerateRandomPassword
   * @param {string} profileName profile name of amt password
   * @returns {string} returns the amt password for a given profile
   */
  public async getAmtPassword (profileName: string): Promise<string> {
    const profile = await this.getAmtProfile(profileName)
    let amtPassword: string

    if (profile) {
      if (profile.generateRandomPassword) {
        amtPassword = PasswordHelper.generateRandomPassword(profile.passwordLength)

        if (amtPassword) {
          this.logger.debug(`Created random password for ${profile.profileName}`)
        } else {
          this.logger.error(`unable to create a random password for ${profile.profileName}`)
        }
      } else {
        this.logger.debug(`found amtPassword for profile ${profileName}`)
        if (this.configurator?.secretsManager) {
          amtPassword = await this.configurator.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${profileName}`, 'AMT_PASSWORD')
        } else {
          amtPassword = profile.amtPassword
        }
      }
    } else {
      this.logger.warn(`unable to find amtPassword for profile ${profileName}`)
    }

    if (amtPassword) {
      return amtPassword
    }

    this.logger.error('password cannot be blank')
    throw new Error('password cannot be blank')
  }

  /**
     * @description Retrieves the amt password set in the configuration or generates a password based on the flag GenerateRandomPassword
     * @param {string} profileName profile name of amt password
     * @returns {string} returns the amt password for a given profile
     */
  public async getMEBxPassword (profileName: string): Promise<string> {
    const profile: AMTConfiguration = await this.getAmtProfile(profileName)
    let mebxPassword: string

    if (profile) {
      if (profile.generateRandomMEBxPassword) {
        mebxPassword = PasswordHelper.generateRandomPassword(profile.mebxPasswordLength)

        if (mebxPassword) {
          this.logger.debug(`Created random MEBx password for ${profile.profileName}`)
        } else {
          this.logger.error(`unable to create MEBx random password for ${profile.profileName}`)
        }
      } else {
        this.logger.debug(`found amtPassword for profile ${profileName}`)
        if (this.configurator?.secretsManager) {
          mebxPassword = await this.configurator.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${profileName}`, 'MEBX_PASSWORD')
        } else {
          mebxPassword = profile.mebxPassword
        }
      }
    } else {
      this.logger.warn(`unable to find mebxPassword for profile ${profileName}`)
    }

    if (mebxPassword) {
      return mebxPassword
    }

    this.logger.error('password cannot be blank')
    throw new Error('password cannot be blank')
  }

  /**
     * @description Retrieves the MPS password set in the configuration or generates a password based on the flag generateRandomMpsPassword
     * @param {string} profileName profile name of MPS password
     * @returns {string} returns the MPS password for a given profile
     */
  public async getMPSPassword (profileName: string): Promise<string> {
    const profile: AMTConfiguration = await this.getAmtProfile(profileName)
    let mpsPassword: string

    if (profile?.ciraConfigObject) {
      if (profile.ciraConfigObject.generateRandomMpsPassword) {
        mpsPassword = PasswordHelper.generateRandomPassword(profile.ciraConfigObject.mpsPasswordLength)

        if (mpsPassword) {
          this.logger.debug(`Created random MPS password for ${profile.profileName}`)
        } else {
          this.logger.error(`unable to create MPS random password for ${profile.profileName}`)
        }
      } else {
        this.logger.debug('using mps password from cira config')
        mpsPassword = profile.ciraConfigObject.password
      }
    } else {
      this.logger.warn(`unable to find mpsPassword for profile ${profileName}`)
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
  public async getAmtProfile (profile: string): Promise<AMTConfiguration> {
    try {
      const amtProfile: AMTConfiguration = await this.amtConfigurations.getProfileByName(profile)
      // If the Network Config associated with profile, retrieves from DB
      if (amtProfile.networkConfigName != null) {
        amtProfile.networkConfigObject = await this.amtConfigurations.getNetworkConfigForProfile(amtProfile.networkConfigName)
      }
      // If the CIRA Config associated with profile, retrieves from DB
      if (amtProfile.ciraConfigName != null) {
        amtProfile.ciraConfigObject = await this.amtConfigurations.getCiraConfigForProfile(amtProfile.ciraConfigName)
        if (this.configurator?.secretsManager) {
          if (amtProfile.ciraConfigObject?.password) { amtProfile.ciraConfigObject.password = await this.configurator.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${amtProfile.ciraConfigObject.configName}`, amtProfile.ciraConfigObject.password) } else { this.logger.error("The amtProfile CIRAConfigObject doesn't have a password. Check CIRA profile creation.") }
        }
      }
      this.logger.debug('AMT Profile returned from db', JSON.stringify(amtProfile))
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
  public async doesProfileExist (profileName: string): Promise<boolean> {
    const profile = await this.getAmtProfile(profileName)
    if (profile) {
      // this.logger.debug(`found profile ${profileName}`);
      return true
    } else {
      this.logger.warn(`unable to find profile ${profileName}`)
      return false
    }
  }
}
