/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type DeviceCredentials, type ISecretManagerService, type TLSCredentials, type WifiCredentials } from '../../interfaces/ISecretManagerService'
import { type ILogger } from '../../interfaces/ILogger'
import { Environment } from '../../utils/Environment'
import got, { type Got } from 'got'

export class VaultService implements ISecretManagerService {
  gotClient: Got
  logger: ILogger
  constructor (logger: ILogger) {
    this.logger = logger
    this.gotClient = got.extend({
      prefixUrl: `${Environment.Config.VaultConfig.address}/v1/${Environment.Config.VaultConfig.SecretsPath}`,
      headers: {
        'X-Vault-Token': Environment.Config.VaultConfig.token
      }
    })
  }

  async getSecretFromKey (path: string, key: string): Promise<string> {
    try {
      this.logger.verbose(`getting secret from vault: ${path}, ${key}`)
      const rspJson: any = await this.gotClient.get(path).json()
      this.logger.debug(`got data back from vault: ${path}, ${key}`)
      if (rspJson.data?.data[key]) {
        return rspJson.data.data[key]
      }
    } catch (error) {
      this.logger.error('getSecretFromKey error \r\n')
      this.logger.error(error)
    }
    return null
  }

  async getSecretAtPath (path: string): Promise<DeviceCredentials | TLSCredentials | WifiCredentials> {
    try {
      this.logger.verbose(`getting secrets from ${path}`)
      const rspJson: any = await this.gotClient.get(path).json()
      this.logger.debug(`got data back from vault ${path}, ${JSON.stringify(rspJson?.data?.metadata)}`)
      const secretData = rspJson.data.data
      secretData.version = rspJson.data.metadata.version
      return secretData
    } catch (error) {
      this.logger.error('getSecretAtPath error \r\n')
      this.logger.error(error)
      return null
    }
  }

  async writeSecretWithObject (path: string, data: any): Promise<any> {
    try {
      const json = {
        data
      }
      this.logger.verbose('writing data to vault:')
      const rspJson: any = await this.gotClient.post(path, { json }).json()
      this.logger.debug(`Successfully written data to vault at path: ${path}, result: ${JSON.stringify(rspJson)}`)
      return rspJson
    } catch (error) {
      this.logger.error('writeSecretWithObject error \r\n')
      this.logger.error(error)
      return null
    }
  }

  async deleteSecretAtPath (path: string): Promise<boolean> {
    try {
    // to permanently delete the key, we use metadata path
      const basePath = Environment.Config.VaultConfig.SecretsPath.replace('/data/', '/metadata/')
      this.logger.verbose(`Deleting data from vault:${path}`)
      await this.gotClient.delete(`${path}`, {
        prefixUrl: `${Environment.Config.VaultConfig.address}/v1/${basePath}`
      }).json()
      this.logger.debug(`Successfully Deleted data from vault: ${path}`)
      return true
    } catch (error) {
      this.logger.error('Failed to delete secret')
      return false
    }
  }

  async health (): Promise<any> {
    const rspJson: any = await this.gotClient.get('sys/health?standbyok=true',
      {
        prefixUrl: `${Environment.Config.VaultConfig.address}/v1/`
      }).json()
    return rspJson
  }
}

export default VaultService
