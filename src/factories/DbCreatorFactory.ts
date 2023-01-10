/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { IDB } from '../interfaces/database/IDb'
import { Environment } from '../utils/Environment'

export class DbCreatorFactory {
  private static instance: IDB
  async getDb (): Promise<IDB> {
    if (DbCreatorFactory.instance == null) {
      const { default: Provider }: { default: new (connectionString: string) => IDB } =
        await import(`../data/${Environment.Config.dbProvider}`)
      DbCreatorFactory.instance = new Provider(Environment.Config.connectionString)
    }
    return DbCreatorFactory.instance
  }
}
