import { IDbCreator } from '../../interfaces/database/IDbCreator'
import { RCSConfig } from '../../models/Rcs'
import { PostgresDbCreator } from './PostgresDbCreator'
export class DbCreatorFactory {
  config: RCSConfig
  constructor (config: RCSConfig) {
    this.config = config
  }

  getDbCreator (): IDbCreator {
    return new PostgresDbCreator(this.config)
  }
}
