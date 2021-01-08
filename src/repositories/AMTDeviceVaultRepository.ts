/*********************************************************************
 * Copyright (c) Intel Corporation 2020
 * SPDX-License-Identifier: Apache-2.0
 * Description: stores amt device in memory
 * Author: Brian Osburn
 **********************************************************************/

import { ILogger } from '../interfaces/ILogger'
import { AMTDeviceDTO } from './dto/AmtDeviceDTO'
import { IAMTDeviceRepository } from './interfaces/IAMTDeviceRepository'
import { IConfigurator } from '../interfaces/IConfigurator'
import { EnvReader } from '../utils/EnvReader'
import { RPSError } from '../utils/RPSError'

export class AMTDeviceVaultRepository implements IAMTDeviceRepository {
    private logger: ILogger;
    private configurator: IConfigurator;

    constructor (logger: ILogger, configurator: IConfigurator) {
      this.logger = logger
      this.configurator = configurator
    }

    public async insert (device: AMTDeviceDTO): Promise<boolean> {
      try {
        if (this.configurator && this.configurator.secretsManager) {
          await this.configurator.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}devices/${device.guid}`, `${device.guid}`, device.amtpass)
          return true
        } else {
          throw new Error('secret manager missing')
        }
      } catch (error) {
        this.logger.error(`failed to insert record guid: ${device.guid}, error: ${JSON.stringify(error)}`)
        throw new RPSError('Exception writting to vault')
      }
    }

    public async delete (device: AMTDeviceDTO): Promise<boolean> {
      try {
        if (this.configurator && this.configurator.secretsManager) {
          await this.configurator.secretsManager.deleteSecretWithPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}devices/${device.guid}`)
          return true
        } else {
          throw new Error('secret manager missing')
        }
      } catch (error) {
        this.logger.error(`failed to delete record guid: ${device.guid}, error: ${JSON.stringify(error)}`)
        throw new RPSError('Exception deleting from vault')
      }
    }

    public async get (deviceId: string): Promise<AMTDeviceDTO> {
      try {
        if (this.configurator && this.configurator.secretsManager) {
          const amtPassword = await this.configurator.secretsManager.getSecretFromKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}devices/${deviceId}`, deviceId)

          if (amtPassword) {
            const amtDevice: AMTDeviceDTO = new AMTDeviceDTO(
              deviceId,
              deviceId,
              EnvReader.GlobalEnvConfig.mpsusername,
              EnvReader.GlobalEnvConfig.mpspass,
              EnvReader.GlobalEnvConfig.amtusername,
              amtPassword)

            this.logger.debug(`found vault amt device: ${deviceId}, ${JSON.stringify(amtDevice)}`)

            return amtDevice
          } else {
            throw new RPSError('amt password not found')
          }
        } else {
          throw new Error('secret manager missing')
        }
      } catch (error) {
        this.logger.error(`failed to get vault record for device: ${deviceId}, error: ${JSON.stringify(error)}`)
        throw new RPSError(`Exception reading from device: ${deviceId}`)
      }
    }
}
