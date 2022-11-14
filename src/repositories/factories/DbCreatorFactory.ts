import { IDB } from '../../interfaces/database/IDb'
import { RPSConfig } from '../../models'

export class DbCreatorFactory {
  private static instance: IDB
  config: RPSConfig

  constructor (config: RPSConfig) {
    this.config = config
  }

  async getDb (): Promise<IDB> {
    if (DbCreatorFactory.instance == null) {
      const { default: Provider }: { default: new (connectionString: string) => IDB } =
        await import(`../../data/${this.config.dbProvider}`)
      DbCreatorFactory.instance = new Provider(this.config.connectionString)
    }
    return DbCreatorFactory.instance
  }
}
