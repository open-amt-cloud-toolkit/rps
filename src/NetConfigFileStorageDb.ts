/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT, NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE, NETWORK_CONFIG_NOT_FOUND, NETWORK_CONFIG_SUCCESSFULLY_DELETED, NETWORK_UPDATE_ERROR } from './utils/constants'
import { AMTConfiguration } from './models/Rcs'
import { ILogger } from './interfaces/ILogger'
import { NetConfigDbFactory } from './repositories/NetConfigDbFactory'
import { EnvReader } from './utils/EnvReader'
import { FileHelper } from './utils/FileHelper'
import { INetProfilesDb } from './repositories/interfaces/INetProfilesDb'
import { NetworkConfig } from './RCS.Config'

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

  async getAllProfiles (): Promise<any> {
    this.logger.debug('getAllNetworkConfigs called')
    return this.networkConfigs
  }

  async getProfileByName (netConfigName: any): Promise<any> {
    this.logger.debug(`getNetConfigByName: ${netConfigName}`)
    return this.networkConfigs.find(item => item.ProfileName === netConfigName)
  }

  async deleteProfileByName (netConfigName: any): Promise<any> {
    this.logger.debug(`deleteNetConfigByName ${netConfigName}`)

    if (NetConfigDbFactory.dbCreator && NetConfigDbFactory.dbCreator.getDb()) {
      this.amtProfiles = NetConfigDbFactory.dbCreator.getDb().AMTConfigurations // get latest profiles every time
    }
    let found: boolean = false
    for (let i = 0; i < this.networkConfigs.length; i++) {
      this.logger.silly(`Checking ${this.networkConfigs[i].ProfileName}`)
      if (this.networkConfigs[i].ProfileName === netConfigName) {
        const profileUsingThisConfig = this.amtProfiles.find(profile => profile.NetworkConfigName === netConfigName)
        if (typeof profileUsingThisConfig !== 'undefined') {
          this.logger.error('Cannot delete the network config. An AMT Profile is already using it.')
          throw (NETWORK_CONFIG_DELETION_FAILED_CONSTRAINT(netConfigName))
        }
        this.networkConfigs.splice(i, 1)
        found = true
        break
      }
    }

    if (found) {
      this.logger.silly(`Found ${netConfigName}. Lets delete it.`)
      this.updateConfigFile()
      this.logger.info(`Network Config deleted: ${netConfigName}`)
      return NETWORK_CONFIG_SUCCESSFULLY_DELETED(netConfigName)
    } else {
      this.logger.error(`Network Config not found: ${netConfigName}`)
      throw (NETWORK_CONFIG_NOT_FOUND(netConfigName))
    }
  }

  async insertProfile (netConfig: NetworkConfig): Promise<any> {
    this.logger.debug(`insertNetConfig: ${netConfig.ProfileName}`)

    if (this.networkConfigs.some(item => item.ProfileName === netConfig.ProfileName)) {
      this.logger.error(`Net Config already exists: ${netConfig.ProfileName}`)
      throw (NETWORK_CONFIG_INSERTION_FAILED_DUPLICATE(netConfig.ProfileName))
    } else {
      this.networkConfigs.push(netConfig)
      this.updateConfigFile()
      this.logger.info(`Net Config created: ${netConfig.ProfileName}`)
      return true
    }
  }

  async updateProfile (netConfig: NetworkConfig): Promise<any> {
    this.logger.debug(`update NetConfig: ${netConfig.ProfileName}`)
    const isMatch = item => item.ProfileName === netConfig.ProfileName

    if (this.amtProfiles.some(profile => profile.NetworkConfigName == netConfig.ProfileName)) {
      throw NETWORK_UPDATE_ERROR(netConfig.ProfileName)
    }

    const index = this.networkConfigs.findIndex(isMatch)

    if (index >= 0) {
      this.networkConfigs.splice(index, 1)
      this.networkConfigs.push(netConfig)
      this.updateConfigFile()
      this.logger.info(`Net Config updated: ${netConfig.ProfileName}`)
      return 1
      // return 1;
    } else {
      this.logger.info(`Net Config doesnt exist: ${netConfig.ProfileName}`)
      return 0
    }
  }

  private updateConfigFile () {
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    data.NETConfigurations = this.networkConfigs
    if (EnvReader.configPath) FileHelper.writeObjToJsonFile(data, EnvReader.configPath)
  }
}
