import { IDB } from '../../interfaces/database/IDb'
import { RPSConfig } from '../../models'

export class DbCreatorFactory {
  static instance: IDB
  config: RPSConfig
  constructor (config: RPSConfig) {
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
