import { ILogger } from "./interfaces/ILogger";
import { AMTDomain, AMTDomains } from "./models/Rcs";
import { IDomainsDb } from "./repositories/interfaces/IDomainsDb";
import { EnvReader } from "./utils/EnvReader";
import { FileHelper } from "./utils/FileHelper";
import { DOMAIN_INSERTION_FAILED_DUPLICATE } from "./utils/constants";


export class DomainConfigDb implements IDomainsDb {
  private domains: AMTDomains;
  private logger: ILogger;

  constructor(domains: AMTDomains, logger: ILogger) {
    this.logger = logger;
    this.domains = domains || new AMTDomains();
    // this.logger.debug(JSON.stringify(this.domains))
    this.logger.debug(`using local domain db`);
  }

  async getAllDomains(): Promise<any> {
    this.logger.debug(`getAllDomains called`);
    return this.domains;
  }
  async getDomainByName(domainName: string): Promise<any> {
    this.logger.debug(`getDomainByName: ${domainName}`);
    return this.domains.find(item => item.Name === domainName);
  }
  async insertDomain(amtDomain: AMTDomain): Promise<any> {
    this.logger.debug(`insertDomain: ${amtDomain.Name}`);

    if (this.domains.some(item => item.Name === amtDomain.Name)) {
      this.logger.error(`domain already exists: ${amtDomain.Name}`);
      throw (DOMAIN_INSERTION_FAILED_DUPLICATE(amtDomain.Name))
    } else {
      this.domains.push(amtDomain);
      this.updateConfigFile();
      this.logger.info(`Domain: ${amtDomain.Name} inserted`);
      return true;
    }
  }
  async deleteDomainByName(domainName: string): Promise<any> {
    this.logger.debug(`deleteDomainByName ${domainName}`);

    let found: boolean = false;
    for (var i = 0; i < this.domains.length; i++) {
      if (this.domains[i].Name === domainName) {
        this.domains.splice(i, 1);
        found = true;
        break;
      }
    }

    if (found) {
      this.updateConfigFile();
      this.logger.debug(`domain deleted: ${domainName}`);
      return true;
    } else {
      this.logger.debug(`domain not deleted: ${domainName}`);
    }
  }

  private updateConfigFile() {
    let data: any = FileHelper.readJsonObjFromFile(EnvReader.configPath);
    data.AMTDomains = this.domains;
    if (FileHelper.isValidPath(EnvReader.configPath)) {
      FileHelper.writeObjToJsonFile(data, EnvReader.configPath);
    } else {
      this.logger.error(`path not valid: ${EnvReader.configPath}`)
    }
  }
}

