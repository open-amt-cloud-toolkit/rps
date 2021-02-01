import { AMTConfiguration } from './models/Rcs'
import { IProfilesDb } from './repositories/interfaces/IProfilesDb'
import { FileHelper } from './utils/FileHelper'
import { EnvReader } from './utils/EnvReader'
import { ILogger } from './interfaces/ILogger'
import { CIRAConfig, NetworkConfig } from './RCS.Config'
import { PROFILE_SUCCESSFULLY_DELETED, PROFILE_NOT_FOUND, PROFILE_INSERTION_FAILED_DUPLICATE } from './utils/constants'

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

  async getAllProfiles (): Promise<any> {
    this.logger.debug('getAllProfiles called')
    return this.amtProfiles
  }

  async getProfileByName (profileName: any): Promise<any> {
    this.logger.debug(`getProfileByName: ${profileName}`)
    return this.amtProfiles.find(item => item.ProfileName === profileName)
  }

  async getNetworkConfigForProfile (networkConfigName): Promise<any> {
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    this.networkConfigs = data ? data.NETConfigurations : this.networkConfigs
    const networkConfig = this.networkConfigs.find((networkConfig: NetworkConfig) => {
      if (networkConfig.ProfileName === networkConfigName) {
        this.logger.debug(`found matching Network configuration: ${JSON.stringify(networkConfig, null, '\t')}`)
        return networkConfig
      }
      return null //not found
    })
    return networkConfig
  }

  async getCiraConfigForProfile (ciraConfigName): Promise<any> {
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    this.ciraConfigs = data ? data.CIRAConfigurations : this.ciraConfigs
    const config = this.ciraConfigs.find((ciraConfig: CIRAConfig) => {
      if (ciraConfig.ConfigName === ciraConfigName) {
        this.logger.debug(`found matching element CIRA: ${JSON.stringify(ciraConfig, null, '\t')}`)
        return ciraConfig
      }
      return null //not found
    })
    return config
  }

  async deleteProfileByName (profileName: any): Promise<any> {
    this.logger.debug(`deleteProfileByName ${profileName}`)

    let found: boolean = false
    for (let i = 0; i < this.amtProfiles.length; i++) {
      if (this.amtProfiles[i].ProfileName === profileName) {
        this.amtProfiles.splice(i, 1)
        found = true
        break
      }
    }

    if (found) {
      this.updateConfigFile()
      this.logger.info(`profile deleted: ${profileName}`)
      return PROFILE_SUCCESSFULLY_DELETED(profileName)
    } else {
      this.logger.error(PROFILE_NOT_FOUND(profileName))
    }
  }

  async insertProfile (amtConfig: any): Promise<any> {
    this.logger.debug(`insertProfile: ${amtConfig.ProfileName}`)

    if (this.amtProfiles.some(item => item.ProfileName === amtConfig.ProfileName)) {
      this.logger.error(`profile already exists: ${amtConfig.ProfileName}`)
      throw (PROFILE_INSERTION_FAILED_DUPLICATE(amtConfig.ProfileName))
    } else {
      this.amtProfiles.push(amtConfig)
      this.updateConfigFile()
      this.logger.info(`profile created: ${amtConfig.ProfileName}`)
      return true
    }
  }

  async updateProfile (amtConfig: any): Promise<any> {
    this.logger.debug(`update Profile: ${amtConfig.ProfileName}`)
    const isMatch = (item): boolean => item.ProfileName === amtConfig.ProfileName
    const index = this.amtProfiles.findIndex(isMatch)
    if (index >= 0) {
      this.amtProfiles.splice(index, 1)
      this.amtProfiles.push(amtConfig)
      this.updateConfigFile()
      this.logger.info(`profile updated: ${amtConfig.ProfileName}`)
      return 1
    } else {
      this.logger.info(`profile doesnt exist: ${amtConfig.ProfileName}`)
      return 0
    }
  }

  private updateConfigFile (): void {
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    data.AMTConfigurations = this.amtProfiles
    if (EnvReader.configPath) FileHelper.writeObjToJsonFile(data, EnvReader.configPath)
  }
}
