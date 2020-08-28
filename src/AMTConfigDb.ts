import { RCSConfig, AMTConfigurations, CIRAConfigurations, AMTConfiguration } from "./models/Rcs";
import { IProfilesDb } from "./repositories/interfaces/IProfilesDb";
import { FileHelper } from "./utils/FileHelper";
import { EnvReader } from "./utils/EnvReader";
import { ILogger } from "./interfaces/ILogger";
import { CIRAConfig } from "./RCS.Config";
import { PROFILE_SUCCESSFULLY_DELETED, PROFILE_NOT_FOUND, PROFILE_INSERTION_FAILED_DUPLICATE } from "./utils/constants";


export class AMTConfigDb implements IProfilesDb {
    amtProfiles: AMTConfigurations;
    ciraConfigs: CIRAConfigurations;
    private logger: ILogger;

    constructor(profiles: AMTConfigurations, ciraConfigs: CIRAConfigurations, logger: ILogger) {
        this.logger = logger;
        this.logger.debug(`using local IProfilesDb`);
        this.amtProfiles = profiles || new AMTConfigurations();
        this.ciraConfigs = ciraConfigs || new CIRAConfigurations();
    }
    async getAllProfiles(): Promise<any> {
        this.logger.debug(`getAllProfiles called`);
        return this.amtProfiles;
    }
    async getProfileByName(profileName: any): Promise<any> {
        this.logger.debug(`getProfileByName: ${profileName}`);
        return this.amtProfiles.find(item => item.ProfileName === profileName);
    }
    async getCiraConfigForProfile(ciraConfigName): Promise<any> {
        let data:any = FileHelper.readJsonObjFromFile(EnvReader.configPath);
        this.ciraConfigs = data ? data.CIRAConfigurations : this.ciraConfigs;
        let config = this.ciraConfigs.find((ciraConfig : CIRAConfig) => {
            if(ciraConfig["ConfigName"] === ciraConfigName){
                this.logger.debug(`found matching element CIRA: ${JSON.stringify(ciraConfig, null,'\t')}`)
                return ciraConfig
            }
        });
        return config;
      }
    
    async deleteProfileByName(profileName: any): Promise<any> {
        this.logger.debug(`deleteProfileByName ${profileName}`);

        let found: boolean = false;
        for (var i = 0; i < this.amtProfiles.length; i++) {
            if (this.amtProfiles[i].ProfileName === profileName) {
                this.amtProfiles.splice(i, 1);
                found = true;
                break;
            }
        }

        if (found) {
            this.updateConfigFile();
            this.logger.info(`profile deleted: ${profileName}`);
            return PROFILE_SUCCESSFULLY_DELETED(profileName);
        } else {
            this.logger.error(PROFILE_NOT_FOUND(profileName));
        }

    }

    async insertProfile(amtConfig: any): Promise<any> {
        this.logger.debug(`insertProfile: ${amtConfig.ProfileName}`);

        if (this.amtProfiles.some(item => item.ProfileName === amtConfig.ProfileName)) {
            this.logger.error(`profile already exists: ${amtConfig.ProfileName}`);
            throw(PROFILE_INSERTION_FAILED_DUPLICATE(amtConfig.ProfileName))
        } else {
            this.amtProfiles.push(amtConfig);
            this.updateConfigFile();
            this.logger.info(`profile created: ${amtConfig.ProfileName}`);
            return true;
        }
    }
    private updateConfigFile() {
        let data:any = FileHelper.readJsonObjFromFile(EnvReader.configPath);
        data.AMTConfigurations = this.amtProfiles;
        if(EnvReader.configPath) FileHelper.writeObjToJsonFile(data, EnvReader.configPath);
    }
}
