import { IDomainsDb } from "./repositories/interfaces/IDomainsDb";
import { AMTDomains, RCSConfig, AMTDomain } from "./models/Rcs";
import { FileHelper } from "./utils/FileHelper";
import { EnvReader } from "./utils/EnvReader";
import { ILogger } from "./interfaces/ILogger";


export class DomainConfigDb implements IDomainsDb {
  private domains: AMTDomains;
  private logger: ILogger;

  constructor(amtDomains: AMTDomains, logger: ILogger) {
    this.logger = logger;
    this.domains = amtDomains;
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
    } else{
      this.logger.debug(`domain not deleted: ${domainName}`);
    }
  }

  private updateConfigFile() {
    let config: RCSConfig;
    if (FileHelper.isValidPath(EnvReader.configPath)) {
        config = FileHelper.readJsonObjFromFile<RCSConfig>(EnvReader.configPath);
    } else {
        config = new RCSConfig();
    }

    config.AMTDomains = this.domains;
    FileHelper.writeObjToJsonFile(config, EnvReader.configPath);
  }
}
