import { IDB } from './interfaces/database/IDb'
import { IConfigurator } from './interfaces/IConfigurator'
import { ISecretManagerService } from './interfaces/ISecretManagerService'

declare module 'express' {
  export interface Request {
    secretsManager: ISecretManagerService
    tenantId?: string
    db: IDB
    configurator: IConfigurator
  }
}
