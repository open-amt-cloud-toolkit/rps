/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/
/*
  Code pattern used to make connections and queries.
  Pattern referred from https://node-postgres.com/guides/project-structure
*/
import { Pool, QueryResult } from 'pg'
import { DbConfig } from '../models/Rcs'

export class PostgresDb {
  pool: Pool

  constructor (config: DbConfig) {
    this.pool = new Pool({
      user: config.dbuser,
      host: config.dbhost,
      database: config.dbname,
      password: config.dbpassword,
      port: config.dbport
    })
  }

  async query (text, params): Promise<QueryResult> {
    const start = Date.now()
    const res = await this.pool.query(text, params)
    const duration = Date.now() - start
    console.log('executed query', { text, duration, rows: res.rowCount })
    return res
  }
}
