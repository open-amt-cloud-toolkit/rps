/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: stores amt profiles
 * Author: Ramu Bachala
 **********************************************************************/
import { ISecretManagerService } from '../interfaces/ISecretManagerService'
import { ILogger } from '../interfaces/ILogger'
import { EnvReader } from './EnvReader'
import nodeVault = require('node-vault')

export class SecretManagerService implements ISecretManagerService {
  vaultClient: nodeVault.client
  logger: ILogger

  constructor (logger: ILogger, vault?: any) {
    this.logger = logger
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

  async getSecretFromKey (path: string, key: string): Promise<string> {
    try {
      this.logger.verbose(`getting secret from vault: ${path}, ${key}`)
      const data = await this.vaultClient.read(path)
      this.logger.debug(`got data back from vault: ${path}, ${key}`)
      // { data: data: { "key": "keyvalue"}}
      return data.data.data[key]
    } catch (error) {
      this.logger.error('getSecretFromKey error \r\n')
      this.logger.error(error)
      return null
    }
  }

  async getSecretAtPath (path: string): Promise<any> {
    try {
      this.logger.verbose(`getting secrets from ${path}`)
      const data = await this.vaultClient.read(path)
      this.logger.debug(`got data back from vault ${path}`)
      return data.data
    } catch (error) {
      this.logger.error('getSecretAtPath error \r\n')
      this.logger.error(error)
      return null
    }
  }

  async writeSecretWithKey (path: string, key: string, keyValue: any): Promise<void> {
    const data = { data: {} }
    data.data[key] = keyValue
    this.logger.verbose('writing data to vault:')
    await this.vaultClient.write(path, data)
    this.logger.debug(`Successfully written data to vault at path: ${path}`)
  }

  async writeSecretWithObject (path: string, data: any): Promise<void> {
    this.logger.verbose('writing data to vault:')
    await this.vaultClient.write(path, data)
    this.logger.debug(`Successfully written data to vault at path: ${path}`)
  }

  async deleteSecretWithPath (path: string): Promise<void> {
    // to permanently delete the key, we use metadata path
    path = path.replace('/data/', '/metadata/')
    this.logger.verbose(`Deleting data from vault:${path}`)
    await this.vaultClient.delete(path)
    this.logger.debug(`Successfully Deleted data from vault: ${path}`)
  }
}
