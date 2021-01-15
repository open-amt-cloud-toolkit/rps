import { AMTConfiguration } from './models/Rcs'
import { FileHelper } from './utils/FileHelper'
import { EnvReader } from './utils/EnvReader'
import { ILogger } from './interfaces/ILogger'
import { ICiraConfigDb } from './repositories/interfaces/ICiraConfigDb'
import { CIRAConfig } from './RCS.Config'
import { CIRA_CONFIG_DELETION_FAILED_CONSTRAINT, CIRA_CONFIG_SUCCESSFULLY_DELETED, CIRA_CONFIG_NOT_FOUND, CIRA_CONFIG_INSERTION_FAILED_DUPLICATE } from './utils/constants'
import { CiraConfigDbFactory } from './repositories/CiraConfigDbFactory'

export class CiraConfigFileStorageDb implements ICiraConfigDb {
  ciraConfigs: CIRAConfig[]
  amtProfiles: AMTConfiguration[]
  private readonly logger: ILogger

  constructor (amtProfiles: AMTConfiguration[], ciraConfigs: CIRAConfig[], logger: ILogger) {
    this.logger = logger
    this.logger.debug('using local CiraConfigFileStorageDb')
    this.ciraConfigs = ciraConfigs || []
    this.amtProfiles = amtProfiles
  }

  async getAllCiraConfigs (): Promise<any> {
    this.logger.debug('getAllCiraConfigs called')
    return this.ciraConfigs
  }

  async getCiraConfigByName (ciraConfigName: any): Promise<any> {
    this.logger.debug(`getCiraConfigByName: ${ciraConfigName}`)
    return this.ciraConfigs.find(item => item.ConfigName === ciraConfigName)
  }

  async deleteCiraConfigByName (ciraConfigName: any): Promise<any> {
    this.logger.debug(`deleteCiraConfigByName ${ciraConfigName}`)

    if (CiraConfigDbFactory.dbCreator?.getDb()) {
      this.amtProfiles = CiraConfigDbFactory.dbCreator.getDb().AMTConfigurations // get latest profiles every time
    }
    let found: boolean = false
    for (let i = 0; i < this.ciraConfigs.length; i++) {
      this.logger.silly(`Checking ${this.ciraConfigs[i].ConfigName}`)
      if (this.ciraConfigs[i].ConfigName === ciraConfigName) {
        const profileUsingThisConfig = this.amtProfiles.find(profile => profile.CIRAConfigName === ciraConfigName)
        if (typeof profileUsingThisConfig !== 'undefined') {
          this.logger.error('Cannot delete the CIRA config. An AMT Profile is already using it.')
          throw (CIRA_CONFIG_DELETION_FAILED_CONSTRAINT(ciraConfigName))
        }
        this.ciraConfigs.splice(i, 1)
        found = true
        break
      }
    }

    if (found) {
      this.logger.silly(`Found ${ciraConfigName}. Lets delete it.`)
      this.updateConfigFile()
      this.logger.info(`Cira Config deleted: ${ciraConfigName}`)
      return CIRA_CONFIG_SUCCESSFULLY_DELETED(ciraConfigName)
    } else {
      this.logger.error(`Cira Config not found: ${ciraConfigName}`)
      throw (CIRA_CONFIG_NOT_FOUND(ciraConfigName))
    }
  }

  async insertCiraConfig (ciraConfig: CIRAConfig): Promise<any> {
    this.logger.debug(`insertCiraConfig: ${ciraConfig.ConfigName}`)

    if (this.ciraConfigs.some(item => item.ConfigName === ciraConfig.ConfigName)) {
      this.logger.error(`Cira Config already exists: ${ciraConfig.ConfigName}`)
      throw (CIRA_CONFIG_INSERTION_FAILED_DUPLICATE(ciraConfig.ConfigName))
    } else {
      this.ciraConfigs.push(ciraConfig)
      this.updateConfigFile()
      this.logger.info(`Cira Config created: ${ciraConfig.ConfigName}`)
      return true
    }
  }

  async updateCiraConfig (ciraConfig: CIRAConfig): Promise<number> {
    this.logger.debug(`update CiraConfig: ${ciraConfig.ConfigName}`)
    const isMatch = (item): boolean => item.ConfigName === ciraConfig.ConfigName
    const index = this.ciraConfigs.findIndex(isMatch)
    if (index >= 0) {
      this.ciraConfigs.splice(index, 1)
      this.ciraConfigs.push(ciraConfig)
      this.updateConfigFile()
      this.logger.info(`Cira Config updated: ${ciraConfig.ConfigName}`)
      return 1
    } else {
      this.logger.info(`Cira Config doesnt exist: ${ciraConfig.ConfigName}`)
      return 0
    }
  }

  private updateConfigFile (): void {
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    data.CIRAConfigurations = this.ciraConfigs
    if (EnvReader.configPath) FileHelper.writeObjToJsonFile(data, EnvReader.configPath)
  }
}
