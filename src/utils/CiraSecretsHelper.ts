import { CIRAConfig } from "../RCS.Config";
import { ISecretManagerService } from "../interfaces/ISecretManagerService";
import { EnvReader } from "./EnvReader";
import { AMTConfiguration } from "../models/Rcs";

export class CiraSecretsHelper {
  secretsManager : ISecretManagerService;

  constructor(secretsManager: ISecretManagerService) {
    this.secretsManager = secretsManager;
  }
  public async getCiraSecretFromVault(ciraConfig: CIRAConfig) {
    if (this.secretsManager) {
      ciraConfig.Password = await this.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfig.ConfigName}`, `${ciraConfig.ConfigName}_CIRA_PROFILE_PASSWORD`);
    }
  }

  public async getProfileSecretFromVault(amtProfile: AMTConfiguration) {
    if (this.secretsManager) {
      // ciraConfig.Password = await this.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}CIRAConfigs/${ciraConfig.ConfigName}`, `${ciraConfig.ConfigName}_CIRA_PROFILE_PASSWORD`);
    }
  }
}