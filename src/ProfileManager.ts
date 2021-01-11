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
import { AMTConfig, CIRAConfig } from './RCS.Config'
import { IConfigurator } from './interfaces/IConfigurator'
import { IProfilesDb } from './repositories/interfaces/IProfilesDb'
import { EnvReader } from './utils/EnvReader'

export class ProfileManager implements IProfileManager {
  private amtConfigurations: IProfilesDb;
  private logger: ILogger;
  private configurator: IConfigurator
  private envConfig: any;

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

    if (profiles.length == 0) {
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

    if (profile && profile.Activation) {
      this.logger.debug(`found activation for profile ${profileName}`)
      activation = profile.Activation
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

    if (profile && profile.CIRAConfigName && profile.CIRAConfigObject) {
      this.logger.debug(`found CIRAConfigObject for profile ${JSON.stringify(profile)}`)
      ciraConfig = profile.CIRAConfigObject

      this.logger.debug(`retrieve CIRA MPS Password for cira config ${ciraConfig.ConfigName}`)
      if (this.configurator && this.configurator.secretsManager) {
        ciraConfig.Password = await this.configurator.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfig.ConfigName}`, `${ciraConfig.ConfigName}_CIRA_PROFILE_PASSWORD`)
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

    if (profile && profile.ConfigurationScript) {
      this.logger.debug(`found configScript for profile ${profileName}`)
      configScript = profile.ConfigurationScript
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
      if (profile.GenerateRandomPassword === true) {
        amtPassword = PasswordHelper.generateRandomPassword(profile.RandomPasswordLength)

        if (amtPassword) {
          this.logger.debug('Created random password for ' + profile.ProfileName + '.')
        } else {
          this.logger.error('unable to create a random password for ' + profile.ProfileName + '.')
        }
      } else {
        this.logger.debug(`found amtPassword for profile ${profileName}`)
        if (this.configurator && this.configurator.secretsManager) {
          amtPassword = await this.configurator.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${profileName}`, `${profileName}_DEVICE_AMT_PASSWORD`)
        } else {
          amtPassword = profile.AMTPassword
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
      if (profile.GenerateRandomMEBxPassword === true) {
        mebxPassword = PasswordHelper.generateRandomPassword(profile.RandomMEBxPasswordLength)

        if (mebxPassword) {
          this.logger.debug('Created random MEBx password for ' + profile.ProfileName + '.')
        } else {
          this.logger.error('unable to create MEBx random password for ' + profile.ProfileName + '.')
        }
      } else {
        this.logger.debug(`found amtPassword for profile ${profileName}`)
        if (this.configurator && this.configurator.secretsManager) {
          mebxPassword = await this.configurator.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}profiles/${profileName}`, `${profileName}_DEVICE_MEBX_PASSWORD`)
        } else {
          mebxPassword = profile.MEBxPassword
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
    * @description Checks if the AMT profile exists or not
    * @param {string} profile
    * @returns {AMTConfig} returns AMTConfig object if profile exists otherwise null.
    */
  public async getAmtProfile (profile: string): Promise<AMTConfig> {
    try {
      if (this.envConfig && this.envConfig.DbConfig.useDbForConfig) {
        const amtProfile = await this.amtConfigurations.getProfileByName(profile)
        // If the Network Config associated with profile, retrieves from DB
        if (amtProfile.NetworkConfigName) {
          amtProfile.NetworkConfigObject = await this.amtConfigurations.getNetworkConfigForProfile(amtProfile.NetworkConfigName)
        }
        // If the CIRA Config associated with profile, retrieves from DB
        if (amtProfile.CIRAConfigName) {
          amtProfile.CIRAConfigObject = await this.amtConfigurations.getCiraConfigForProfile(amtProfile.CIRAConfigName)
          if (this.configurator && this.configurator.secretsManager) {
            if (amtProfile.CIRAConfigObject && amtProfile.CIRAConfigObject.Password) { amtProfile.CIRAConfigObject.Password = await this.configurator.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${amtProfile.CIRAConfigName}`, amtProfile.CIRAConfigObject.Password) } else { this.logger.error('The amtProfile CIRAConfigObject doesnt have a password. Check CIRA profile creation.') }
          }
        }
        this.logger.debug('AMT Profile returned from db', JSON.stringify(amtProfile))
        return amtProfile
      } else {
        const amtProfiles = await this.amtConfigurations.getAllProfiles()
        for (let index = 0; index < amtProfiles.length; ++index) {
          if (amtProfiles[index].ProfileName === profile) {
            const amtProfile = amtProfiles[index]
            this.logger.debug(`found amt profile: ${JSON.stringify(amtProfile, null, '\t')}`)
            if (amtProfile.NetworkConfigName) {
              amtProfile.NetworkConfigObject = await this.amtConfigurations.getNetworkConfigForProfile(amtProfile.NetworkConfigName)
              this.logger.debug(`found AMT Network Config: ${JSON.stringify(amtProfile, null, '\t')}`)
            }
            if (amtProfile.CIRAConfigName) {
              amtProfile.CIRAConfigObject = await this.amtConfigurations.getCiraConfigForProfile(amtProfile.CIRAConfigName)
              this.logger.debug(`found AMT CIRA Config: ${JSON.stringify(amtProfile, null, '\t')}`)
            }
            return amtProfile
          }
        }
      }
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
