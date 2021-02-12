/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT, NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE, NETWORK_UPDATE_ERROR } from './utils/constants'
import { AMTConfiguration } from './models/Rcs'
import { ILogger } from './interfaces/ILogger'
import { NetConfigDbFactory } from './repositories/NetConfigDbFactory'
import { EnvReader } from './utils/EnvReader'
import { FileHelper } from './utils/FileHelper'
import { INetProfilesDb } from './repositories/interfaces/INetProfilesDb'
import { NetworkConfig } from './RCS.Config'
import { RPSError } from './utils/RPSError'

export class NetConfigFileStorageDb implements INetProfilesDb {
  networkConfigs: NetworkConfig[]
  amtProfiles: AMTConfiguration[]
  private readonly logger: ILogger

  constructor (amtProfiles: AMTConfiguration[], networkConfigs: NetworkConfig[], logger: ILogger) {
    this.logger = logger
    this.logger.debug('using local NetConfigFileStorageDb')
    this.networkConfigs = networkConfigs || []
    this.amtProfiles = amtProfiles
  }

  /**
   * @description Get all Network configurations from DB
   * @returns {NetworkConfig[]} returns an array of NetworkConfig objects
   */
  async getAllProfiles (): Promise<NetworkConfig[]> {
    return this.networkConfigs
  }

  /**
   * @description Get Network Config from DB by name
   * @param {string} netConfigName
   * @returns {NetworkConfig} NetworkConfig object
   */
  async getProfileByName (netConfigName: string): Promise<NetworkConfig> {
    const networkConfig: NetworkConfig = this.networkConfigs.find(item => item.ProfileName === netConfigName) || {} as NetworkConfig
    return networkConfig
  }

  /**
   * @description Delete Network Config from DB by name
   * @param {string} netConfigName
   * @returns {boolean} Return true on successful deletion
   */
  async deleteProfileByName (netConfigName: any): Promise<boolean> {
    if (NetConfigDbFactory.dbCreator?.getDb()) {
      this.amtProfiles = NetConfigDbFactory.dbCreator.getDb().AMTConfigurations // get latest profiles every time
    }
    let found: boolean = false
    for (let i = 0; i < this.networkConfigs.length; i++) {
      this.logger.silly(`Checking ${this.networkConfigs[i].ProfileName}`)
      if (this.networkConfigs[i].ProfileName === netConfigName) {
        const profileUsingThisConfig = this.amtProfiles.find(profile => profile.NetworkConfigName === netConfigName)
        if (typeof profileUsingThisConfig !== 'undefined') {
          this.logger.error('Cannot delete the network config. An AMT Profile is already using it.')
          throw new RPSError(NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT(netConfigName))
        }
        this.networkConfigs.splice(i, 1)
        found = true
        break
      }
    }
    if (found) {
      this.updateConfigFile()
      this.logger.info(`Network Config deleted: ${netConfigName}`)
      return true
    } else {
      this.logger.error(`Network Config not found: ${netConfigName}`)
      return false
    }
  }

  /**
   * @description Insert Network Config into DB
   * @param {NetworkConfig} netConfig
   * @returns {boolean} Return true on successful insertion
   */
  async insertProfile (netConfig: NetworkConfig): Promise<boolean> {
    if (this.networkConfigs.some(item => item.ProfileName === netConfig.ProfileName)) {
      this.logger.error(`Net Config already exists: ${netConfig.ProfileName}`)
      throw new RPSError(NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE(netConfig.ProfileName))
    } else {
      this.networkConfigs.push(netConfig)
      this.updateConfigFile()
      this.logger.info(`Net Config created: ${netConfig.ProfileName}`)
      return true
    }
  }

  /**
   * @description Update Network Config into DB
   * @param {NetworkConfig} netConfig
   * @returns {boolean} Return true on successful updation
   */
  async updateProfile (netConfig: NetworkConfig): Promise<boolean> {
    this.logger.debug(`update NetConfig: ${netConfig.ProfileName}`)
    const isMatch = (item): boolean => item.ProfileName === netConfig.ProfileName
    if (this.amtProfiles.some(profile => profile.NetworkConfigName === netConfig.ProfileName)) {
      throw new RPSError(NETWORK_UPDATE_ERROR(netConfig.ProfileName))
    }
    const index = this.networkConfigs.findIndex(isMatch)
    if (index >= 0) {
      this.networkConfigs.splice(index, 1)
      this.networkConfigs.push(netConfig)
      this.updateConfigFile()
      this.logger.info(`Net Config updated: ${netConfig.ProfileName}`)
      return true
    } else {
      this.logger.info(`Net Config doesnt exist: ${netConfig.ProfileName}`)
      return false
    }
  }

  private updateConfigFile (): void {
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    data.NETConfigurations = this.networkConfigs
    if (EnvReader.configPath) FileHelper.writeObjToJsonFile(data, EnvReader.configPath)
  }
}
