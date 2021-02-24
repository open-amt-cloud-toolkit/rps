import { ILogger } from './interfaces/ILogger'
import { AMTDomain } from './models/Rcs'
import { IDomainsDb } from './repositories/interfaces/IDomainsDb'
import { EnvReader } from './utils/EnvReader'
import { FileHelper } from './utils/FileHelper'
import { DUPLICATE_DOMAIN_FAILED } from './utils/constants'
import { RPSError } from './utils/RPSError'

export class DomainConfigDb implements IDomainsDb {
  private readonly domains: AMTDomain[]
  private readonly logger: ILogger

  constructor (domains: AMTDomain[], logger: ILogger) {
    this.logger = logger
    this.domains = domains || []
    // this.logger.debug(JSON.stringify(this.domains))
    this.logger.debug('using local domain db')
  }

  /**
   * @description Get all Domains from FileStorage
   * @returns {AMTDomain[]} returns an array of AMT Domain objects
   */
  async getAllDomains (): Promise<AMTDomain[]> {
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    return data.AMTDomains
  }

  /**
   * @description Get Domain from FileStorage by name
   * @param {string} domainName
   * @returns {AMTDomain} Domain object
   */
  async getDomainByName (domainName: string): Promise<AMTDomain> {
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    const amtDomain: AMTDomain = data.AMTDomains.find((item: { profileName: string }) => item.profileName === domainName) || null
    return amtDomain
  }

  /**
   * @description Insert Domain into FileStorage
   * @param {AMTDomain} amtDomain
   * @returns {AMTDomain} Returns amtDomain object
   */
  async insertDomain (amtDomain: AMTDomain): Promise<AMTDomain> {
    if (this.domains.some(item => item.profileName === amtDomain.profileName) ||
    this.domains.some(item => item.domainSuffix === amtDomain.domainSuffix)) {
      this.logger.error(`domain already exists: ${amtDomain.profileName}`)
      throw new RPSError(DUPLICATE_DOMAIN_FAILED(amtDomain.profileName), 'Unique key violation')
    } else {
      this.domains.push(amtDomain)
      this.updateConfigFile()
      this.logger.info(`Domain: ${amtDomain.profileName} inserted`)
      const domain = await this.getDomainByName(amtDomain.profileName)
      return domain
    }
  }

  /**
   * @description Update AMT Domain into FileStorage
   * @param {AMTDomain} amtDomain object
   * @returns {AMTDomain} Returns amtDomain object
   */
  async updateDomain (amtDomain: AMTDomain): Promise<AMTDomain> {
    const isMatch = (item): boolean => item.profileName === amtDomain.profileName
    const index = this.domains.findIndex(isMatch)
    if (index >= 0) {
      this.domains.forEach((domain) => {
        if (domain.profileName !== amtDomain.profileName && domain.domainSuffix === amtDomain.domainSuffix) {
          this.logger.error(`domain suffix already exists: ${amtDomain.domainSuffix}`)
          throw new RPSError(DUPLICATE_DOMAIN_FAILED(amtDomain.profileName), 'Unique key violation')
        }
      })
      this.domains.splice(index, 1)
      this.domains.push(amtDomain)
      this.updateConfigFile()
      this.logger.info(`Domain: ${amtDomain.profileName} updated`)
      const domain = await this.getDomainByName(amtDomain.profileName)
      return domain
    }
    return null
  }

  /**
   * @description Delete Domain from DB by name
   * @param {string} domainName
   * @returns {boolean} Return true on successful deletion
   */
  async deleteDomainByName (domainName: string): Promise<boolean> {
    this.logger.debug(`deleteDomainByName ${domainName}`)

    let found: boolean = false
    for (let i = 0; i < this.domains.length; i++) {
      if (this.domains[i].profileName === domainName) {
        this.domains.splice(i, 1)
        found = true
        break
      }
    }

    if (found) {
      this.updateConfigFile()
      this.logger.debug(`domain deleted: ${domainName}`)
      return true
    } else {
      this.logger.debug(`domain not deleted: ${domainName}`)
    }
  }

  private updateConfigFile (): void {
    const data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath)
    data.AMTDomains = this.domains
    if (FileHelper.isValidPath(EnvReader.configPath)) {
      FileHelper.writeObjToJsonFile(data, EnvReader.configPath)
    } else {
      this.logger.error(`path not valid: ${EnvReader.configPath}`)
    }
  }
}
