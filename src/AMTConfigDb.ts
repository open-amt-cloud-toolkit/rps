import { RCSConfig, AMTConfigurations } from "./models/Rcs";
import { IProfilesDb } from "./repositories/interfaces/IProfilesDb";
import { FileHelper } from "./utils/FileHelper";
import { EnvReader } from "./utils/EnvReader";
import { ILogger } from "./interfaces/ILogger";

export class AMTConfigDb implements IProfilesDb {
    amtProfiles: AMTConfigurations;
    private logger: ILogger;

    constructor(rcsConfig: RCSConfig, logger: ILogger) {
        this.logger = logger;
        this.logger.debug(`using local IProfilesDb`);
        this.amtProfiles = rcsConfig.AMTConfigurations;
    }
    async getAllProfiles(): Promise<any> {
        this.logger.debug(`getAllProfiles called`);
        return this.amtProfiles;
    }
    async getProfileByName(profileName: any): Promise<any> {
        this.logger.debug(`getProfileByName: ${profileName}`);
        return this.amtProfiles.find(item => item.ProfileName === profileName);
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
            return true;
        } else {
            this.logger.error(`profile not deleted: ${profileName}`);
        }

    }

    async insertProfile(amtConfig: any): Promise<any> {
        this.logger.debug(`insertProfile: ${amtConfig.ProfileName}`);

        if (this.amtProfiles.some(item => item.ProfileName === amtConfig.ProfileName)) {
            this.logger.error(`profile already exists: ${amtConfig.ProfileName}`);
        } else {
            this.amtProfiles.push(amtConfig);
            this.updateConfigFile();
            this.logger.info(`profile created: ${amtConfig.ProfileName}`);
            return true;
        }
    }

    private updateConfigFile() {
        let config: RCSConfig;
        if (FileHelper.isValidPath(EnvReader.configPath)) {
            config = FileHelper.readJsonObjFromFile<RCSConfig>(EnvReader.configPath);
        } else {
            config = new RCSConfig();
        }
        config.AMTConfigurations = this.amtProfiles;
        FileHelper.writeObjToJsonFile(config, EnvReader.configPath);
    }
}
