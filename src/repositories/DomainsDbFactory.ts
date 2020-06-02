/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { DbCreatorFactory } from "./PostgresDbCreator";
import { IDbCreator } from "./interfaces/IDbCreator";
import { EnvReader } from "../utils/EnvReader";
import { IDomainsDb } from "./interfaces/IDomainsDb";
import { DomainsDb } from "./domains";
import { DomainConfigDb } from "../DomainConfigDb";
import Logger from "../Logger";

export class DomainsDbFactory {
  static dbCreator: IDbCreator = null;
  static dbCreatorFactory: DbCreatorFactory;
  static domainsDb: IDomainsDb;

  static getDomainsDb(): IDomainsDb {
    if (DomainsDbFactory.domainsDb == null) {
      if (EnvReader.GlobalEnvConfig.DbConfig.useDbForConfig) {
        DomainsDbFactory.dbCreatorFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig);
        DomainsDbFactory.dbCreator = DomainsDbFactory.dbCreatorFactory.getDbCreator();
        DomainsDbFactory.domainsDb = new DomainsDb(DomainsDbFactory.dbCreator);
      } else {
        DomainsDbFactory.domainsDb = new DomainConfigDb(EnvReader.GlobalEnvConfig.AMTDomains, Logger("DomainConfigDb"));
      }
    }

    return DomainsDbFactory.domainsDb;
  }
}