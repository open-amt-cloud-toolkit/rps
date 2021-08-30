import { ISecretManagerService } from './interfaces/ISecretManagerService'

declare module 'express' {
  export interface Request {
    secretsManager: ISecretManagerService
    tenantId?: string
  }
}
