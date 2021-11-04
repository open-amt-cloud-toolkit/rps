import { IDB } from '../../interfaces/database/IDb'
import { RCSConfig } from '../../models/Rcs'

export class DbCreatorFactory {
  static instance: IDB
  config: RCSConfig
  constructor (config: RCSConfig) {
    this.config = config
  }

  async getDb (): Promise<IDB> {
    const provider = await import(`../../data/${this.config.dbProvider}`)

    if (DbCreatorFactory.instance == null) {
      // eslint-disable-next-line new-cap
      return new provider.default(this.config.connectionString)
    } else {
      return DbCreatorFactory.instance
    }
  }
}
