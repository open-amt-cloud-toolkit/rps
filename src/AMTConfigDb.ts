import { AMTConfiguration } from './models/Rcs'
import { IProfilesDb } from './repositories/interfaces/IProfilesDb'
import { FileHelper } from './utils/FileHelper'
import { EnvReader } from './utils/EnvReader'
import { ILogger } from './interfaces/ILogger'
import { CIRAConfig, NetworkConfig } from './RCS.Config'
import { PROFILE_INSERTION_FAILED_DUPLICATE, PROFILE_NOT_FOUND } from './utils/constants'
import { RPSError } from './utils/RPSError'

export class AMTConfigDb implements IProfilesDb {
  amtProfiles: AMTConfiguration[]
  ciraConfigs: CIRAConfig[]
  networkConfigs: NetworkConfig[]
  private readonly logger: ILogger

  constructor (profiles: AMTConfiguration[], ciraConfigs: CIRAConfig[], networkConfigs: NetworkConfig[], logger: ILogger) {
    this.logger = logger
    this.logger.debug('using local IProfilesDb')
    this.amtProfiles = profiles || []
    this.ciraConfigs = ciraConfigs || []
    this.networkConfigs = networkConfigs || []
  }

  /**
   * @description Get all AMT Profiles from DB
   * @returns {any} returns an array of AMT profile objects
   */
  async getAllProfiles (): Promise<AMTConfiguration[]> {
    this.logger.debug('getAllProfiles called')
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    return data.AMTConfigurations
  }

  /**
   * @description Get AMT Profile from DB by name
   * @param {string} profileName
   * @returns {AMTConfiguration} AMT Profile object
   */
  async getProfileByName (profileName: string): Promise<AMTConfiguration> {
    this.logger.debug(`getProfileByName: ${profileName}`)
    const profile: AMTConfiguration = this.amtProfiles.find(item => item.profileName === profileName) || null
    return profile
  }

  async getNetworkConfigForProfile (networkConfigName): Promise<any> {
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    this.networkConfigs = data ? data.NETConfigurations : this.networkConfigs
    const networkConfig = this.networkConfigs.find((networkConfig: NetworkConfig) => {
      if (networkConfig.profileName === networkConfigName) {
        this.logger.debug(`found matching Network configuration: ${JSON.stringify(networkConfig, null, '\t')}`)
        return networkConfig
      }
      return null // not found
    })
    return networkConfig
  }

  async getCiraConfigForProfile (ciraConfigName): Promise<any> {
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    this.ciraConfigs = data ? data.CIRAConfigurations : this.ciraConfigs
    const config = this.ciraConfigs.find((ciraConfig: CIRAConfig) => {
      if (ciraConfig.configName === ciraConfigName) {
        this.logger.debug(`found matching element CIRA: ${JSON.stringify(ciraConfig, null, '\t')}`)
        return ciraConfig
      }
      return null // not found
    })
    return config
  }

  /**
   * @description Delete AMT Profile from DB by name
   * @param {string} profileName
   * @returns {boolean} Return true on successful deletion
   */
  async deleteProfileByName (profileName: string): Promise<boolean> {
    let found: boolean = false
    for (let i = 0; i < this.amtProfiles.length; i++) {
      if (this.amtProfiles[i].profileName === profileName) {
        this.amtProfiles.splice(i, 1)
        found = true
        break
      }
    }
    if (found) {
      this.updateConfigFile()
      this.logger.info(`profile deleted: ${profileName}`)
      return true
    } else {
      this.logger.error(PROFILE_NOT_FOUND(profileName))
      return false
    }
  }

  /**
   * @description Insert AMT profile into DB
   * @param {AMTConfiguration} amtConfig
   * @returns {AMTConfiguration} Returns amtConfig object
   */
  async insertProfile (amtConfig: AMTConfiguration): Promise<AMTConfiguration> {
    if (this.amtProfiles.some(item => item.profileName === amtConfig.profileName)) {
      this.logger.error(`profile already exists: ${amtConfig.profileName}`)
      throw new RPSError(PROFILE_INSERTION_FAILED_DUPLICATE(amtConfig.profileName), 'Unique key violation')
      // return false
    } else {
      this.amtProfiles.push(amtConfig)
      this.updateConfigFile()
      this.logger.info(`profile created: ${amtConfig.profileName}`)
      const profile: AMTConfiguration = await this.getProfileByName(amtConfig.profileName)
      return profile
    }
  }

  /**
   * @description Update AMT profile into DB
   * @param {AMTConfiguration} amtConfig
   * @returns {AMTConfiguration} Returns amtConfig object
   */
  async updateProfile (amtConfig: AMTConfiguration): Promise<AMTConfiguration> {
    this.logger.debug(`update Profile: ${amtConfig.profileName}`)
    const isMatch = (item): boolean => item.profileName === amtConfig.profileName
    const index = this.amtProfiles.findIndex(isMatch)
    if (index >= 0) {
      this.amtProfiles.splice(index, 1)
      this.amtProfiles.push(amtConfig)
      this.updateConfigFile()
      this.logger.info(`profile updated: ${amtConfig.profileName}`)
      const profile: AMTConfiguration = await this.getProfileByName(amtConfig.profileName)
      return profile
    }
    return null
  }

  private updateConfigFile (): void {
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    data.AMTConfigurations = this.amtProfiles
    if (EnvReader.configPath) FileHelper.writeObjToJsonFile(data, EnvReader.configPath)
  }
}
