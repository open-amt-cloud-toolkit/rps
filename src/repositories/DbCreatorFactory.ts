import { IDbCreator } from "./interfaces/IDbCreator";
import { RCSConfig } from "../models/Rcs";
import { PostgresDbCreator } from "./PostgresDbCreator";
import { ConfigDbCreator } from "./ConfigDbCreator";
export class DbCreatorFactory {
  config: RCSConfig;
  constructor(config: RCSConfig) {
    this.config = config;
  }
  getDbCreator(): IDbCreator {
    if(this.config.DbConfig.useDbForConfig)
      return new PostgresDbCreator(this.config);
    else
      return new ConfigDbCreator(this.config);
  }
}
