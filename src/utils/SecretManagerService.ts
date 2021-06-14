/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: stores amt profiles
 * Author: Ramu Bachala
 **********************************************************************/
import { ISecretManagerService } from '../interfaces/ISecretManagerService'
import { EnvReader } from './EnvReader'
import nodeVault = require('node-vault')
import Logger from '../Logger'

export class SecretManagerService implements ISecretManagerService {
  vaultClient: nodeVault.client
  private readonly log: Logger = new Logger('SecretManagerService')

  constructor (vault?: any) {
    // this.log = logger
    if (vault) {
      this.vaultClient = vault
      return
    }

    const options: nodeVault.VaultOptions = {
      apiVersion: 'v1', // default
      endpoint: EnvReader.GlobalEnvConfig.VaultConfig.address, // default
      token: EnvReader.GlobalEnvConfig.VaultConfig.token // optional client token; can be fetched after valid initialization of the server
    }

    this.vaultClient = nodeVault(options)
  }

  async listSecretsAtPath (path: string): Promise<any> {
    try {
      this.log.info('list secret ' + path)
      const data = await this.vaultClient.list(path)
      this.log.info('got data back from vault ')
      this.log.info(JSON.stringify(data))
      // { data: data: { "key": "keyvalue"}}
      return data.data.keys
    } catch (error) {
      this.log.error('getSecretFromKey error \r\n')
      this.log.error(error)
      return null
    }
  }

  async getSecretFromKey (path: string, key: string): Promise<string> {
    try {
      this.log.info('getting secret ' + path + ' ' + key)
      const data = await this.vaultClient.read(path)
      this.log.info('got data back from vault ')
      // { data: data: { "key": "keyvalue"}}
      return data.data.data[key]
    } catch (error) {
      this.log.error('getSecretFromKey error \r\n')
      this.log.error(error)
      return null
    }
  }

  async getSecretAtPath (path: string): Promise<any> {
    try {
      this.log.info('getting secrets from ' + path)
      const data = await this.vaultClient.read(path)
      this.log.info('got data back from vault ')
      return data.data
    } catch (error) {
      this.log.error('getSecretAtPath error \r\n')
      this.log.error(error)
      return null
    }
  }

  async readJsonFromKey (path: string, key: string): Promise<string> {
    const data = await this.getSecretFromKey(path, key)
    return (data ? JSON.parse(data) : null)
  }

  async writeSecretWithKey (path: string, key: string, keyValue: any): Promise<void> {
    const data = { data: {} }
    data.data[key] = keyValue
    // this.logger.info('writing:' + JSON.stringify(data))
    this.log.info('writing data to vault:')
    await this.vaultClient.write(path, data)
    this.log.info('Successfully written data to vault')
  }

  async writeSecretWithObject (path: string, data: any): Promise<void> {
    this.log.info('writing data to vault:')
    await this.vaultClient.write(path, data)
    this.log.info('Successfully written data to vault')
  }

  async deleteSecretWithPath (path: string): Promise<void> {
    // to permanently delete the key, we use metadata path
    path = path.replace('/data/', '/metadata/')
    this.log.info(`Deleting data from vault:${path}`)
    await this.vaultClient.delete(path)
    this.log.info('Successfully Deleted data from vault')
  }
}
