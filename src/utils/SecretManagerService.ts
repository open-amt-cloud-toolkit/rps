/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: stores amt profiles
 * Author: Ramu Bachala
 **********************************************************************/
import { ISecretManagerService } from '../interfaces/ISecretManagerService'
import { ILogger } from '../interfaces/ILogger'
import { EnvReader } from './EnvReader'
import got, { Got } from 'got'

export class SecretManagerService implements ISecretManagerService {
  gotClient: Got
  logger: ILogger
  constructor (logger: ILogger) {
    this.logger = logger
    this.gotClient = got.extend({
      prefixUrl: `${EnvReader.GlobalEnvConfig.VaultConfig.address}/v1/${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}`,
      headers: {
        'X-Vault-Token': EnvReader.GlobalEnvConfig.VaultConfig.token
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

  async getSecretAtPath (path: string): Promise<any> {
    try {
      this.logger.verbose(`getting secrets from ${path}`)
      const rspJson: any = await this.gotClient.get(path).json()
      this.logger.debug(`got data back from vault ${path}, ${JSON.stringify(rspJson?.data?.metadata)}`)
      return rspJson.data
    } catch (error) {
      this.logger.error('getSecretAtPath error \r\n')
      this.logger.error(error)
      return null
    }
  }

  async writeSecretWithKey (path: string, key: string, keyValue: any): Promise<any> {
    const data = { data: {} }
    data.data[key] = keyValue
    this.logger.verbose('writing data to vault:')
    const rspJson: any = await this.gotClient.post(path, { json: data }).json()
    this.logger.debug(`Successfully written data to vault at path: ${path}, result: ${JSON.stringify(rspJson)}`)
    return rspJson
  }

  async writeSecretWithObject (path: string, data: any): Promise<any> {
    try {
      this.logger.verbose('writing data to vault:')
      const rspJson: any = await this.gotClient.post(path, { json: data }).json()
      this.logger.debug(`Successfully written data to vault at path: ${path}, result: ${JSON.stringify(rspJson)}`)
      return rspJson
    } catch (error) {
      this.logger.error('writeSecretWithObject error \r\n')
      this.logger.error(error)
      return null
    }
  }

  async deleteSecretWithPath (path: string): Promise<void> {
    // to permanently delete the key, we use metadata path
    path = path.replace('/data/', '/metadata/')
    this.logger.verbose(`Deleting data from vault:${path}`)
    await this.gotClient.delete(`v1/${path}`)
    this.logger.debug(`Successfully Deleted data from vault: ${path}`)
  }

  async health (): Promise<any> {
    // const rspJson: any = await this.gotClient.get('v1/sys/health').json()
    const rspJson: any = await this.gotClient.get('sys/health',
      {
        prefixUrl: `${EnvReader.GlobalEnvConfig.VaultConfig.address}/v1/`
      }).json()
    return rspJson
  }
}
