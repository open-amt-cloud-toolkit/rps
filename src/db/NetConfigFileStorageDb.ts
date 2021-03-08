/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT, NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE, NETWORK_UPDATE_ERROR } from '../utils/constants'
import { AMTConfiguration } from '../models/Rcs'
import { ILogger } from '../interfaces/ILogger'
import { NetConfigDbFactory } from '../repositories/factories/NetConfigDbFactory'
import { EnvReader } from '../utils/EnvReader'
import { FileHelper } from '../utils/FileHelper'
import { INetProfilesDb } from '../repositories/interfaces/INetProfilesDb'
import { NetworkConfig } from '../RCS.Config'
import { RPSError } from '../utils/RPSError'

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
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    return data.NETConfigurations
  }

  /**
   * @description Get Network Config from DB by name
   * @param {string} netConfigName
   * @returns {NetworkConfig} NetworkConfig object
   */
  async getProfileByName (netConfigName: string): Promise<NetworkConfig> {
    const networkConfig: NetworkConfig = this.networkConfigs.find(item => item.profileName === netConfigName) || null
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
      this.logger.silly(`Checking ${this.networkConfigs[i].profileName}`)
      if (this.networkConfigs[i].profileName === netConfigName) {
        const profileUsingThisConfig = this.amtProfiles.find(profile => profile.networkConfigName === netConfigName)
        if (typeof profileUsingThisConfig !== 'undefined') {
          this.logger.error('Cannot delete the network config. An AMT Profile is already using it.')
          throw new RPSError(NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT(netConfigName), 'Foreign key violation')
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
   * @returns {NetworkConfig} Returns netConfig object
   */
  async insertProfile (netConfig: NetworkConfig): Promise<NetworkConfig> {
    if (this.networkConfigs.some(item => item.profileName === netConfig.profileName)) {
      this.logger.error(`Net Config already exists: ${netConfig.profileName}`)
      throw new RPSError(NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE(netConfig.profileName), 'Unique key violation')
    } else {
      this.networkConfigs.push(netConfig)
      this.updateConfigFile()
      this.logger.info(`Net Config created: ${netConfig.profileName}`)
      const networkConfig: NetworkConfig = await this.getProfileByName(netConfig.profileName)
      return networkConfig
    }
  }

  /**
   * @description Update Network Config into DB
   * @param {NetworkConfig} netConfig
   * @returns {NetworkConfig} Returns netConfig object
   */
  async updateProfile (netConfig: NetworkConfig): Promise<NetworkConfig> {
    this.logger.debug(`update NetConfig: ${netConfig.profileName}`)
    const isMatch = (item): boolean => item.profileName === netConfig.profileName
    if (this.amtProfiles.some(profile => profile.networkConfigName === netConfig.profileName)) {
      throw new RPSError(NETWORK_UPDATE_ERROR(netConfig.profileName))
    }
    const index = this.networkConfigs.findIndex(isMatch)
    if (index >= 0) {
      this.networkConfigs.splice(index, 1)
      this.networkConfigs.push(netConfig)
      this.updateConfigFile()
      this.logger.info(`Net Config updated: ${netConfig.profileName}`)
      const networkConfig: NetworkConfig = await this.getProfileByName(netConfig.profileName)
      return networkConfig
    }
    return null
  }

  private updateConfigFile (): void {
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    data.NETConfigurations = this.networkConfigs
    if (EnvReader.configPath) FileHelper.writeObjToJsonFile(data, EnvReader.configPath)
  }
}
