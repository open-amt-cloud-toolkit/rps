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
    const amtDomain: AMTDomain = data.AMTDomains.find((item: { Name: string }) => item.Name === domainName) || null
    return amtDomain
  }

  /**
   * @description Insert Domain into FileStorage
   * @param {AMTDomain} amtDomain
   * @returns {boolean} Return true on successful insertion
   */
  async insertDomain (amtDomain: AMTDomain): Promise<boolean> {
    if (this.domains.some(item => item.Name === amtDomain.Name) ||
    this.domains.some(item => item.DomainSuffix === amtDomain.DomainSuffix)) {
      this.logger.error(`domain already exists: ${amtDomain.Name}`)
      throw new RPSError(DUPLICATE_DOMAIN_FAILED(amtDomain.Name), 'Unique key violation')
    } else {
      this.domains.push(amtDomain)
      this.updateConfigFile()
      this.logger.info(`Domain: ${amtDomain.Name} inserted`)
      return true
    }
  }

  /**
   * @description Update AMT Domain into FileStorage
   * @param {AMTDomain} amtDomain object
   * @returns {boolean} Return true on successful updation
   */
  async updateDomain (amtDomain: AMTDomain): Promise<boolean> {
    const isMatch = (item): boolean => item.Name === amtDomain.Name
    const index = this.domains.findIndex(isMatch)
    if (index >= 0) {
      this.domains.forEach((domain) => {
        if (domain.Name !== amtDomain.Name && domain.DomainSuffix === amtDomain.DomainSuffix) {
          this.logger.error(`domain suffix already exists: ${amtDomain.DomainSuffix}`)
          throw new RPSError(DUPLICATE_DOMAIN_FAILED(amtDomain.Name), 'Unique key violation')
        }
      })
      this.domains.splice(index, 1)
      this.domains.push(amtDomain)
      this.updateConfigFile()
      this.logger.info(`Domain: ${amtDomain.Name} updated`)
      this.logger.silly(`Domain ${JSON.stringify(amtDomain)}`)
      return true
    } else {
      this.logger.info(`Domain: ${amtDomain.Name} doesnt exist`)
      return false
    }
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
      if (this.domains[i].Name === domainName) {
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
