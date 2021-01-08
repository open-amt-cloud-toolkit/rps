/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
import { IDbCreator } from './interfaces/IDbCreator'
import { PostgresDb } from '../db'
import { RCSConfig } from '../models/Rcs'
export class PostgresDbCreator implements IDbCreator {
  static instance: any;
  config: RCSConfig;
  constructor (config: RCSConfig) {
    this.config = config
  }

  getDb (): any {
    if (typeof PostgresDbCreator.instance === 'undefined') {
      PostgresDbCreator.instance = new PostgresDb(this.config.DbConfig)
    }

    return PostgresDbCreator.instance
  }
}
