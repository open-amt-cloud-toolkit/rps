/*********************************************************************
 * Copyright (c) Intel Corporation 2020
 * SPDX-License-Identifier: Apache-2.0
 * Description: stores amt device in vault
 * Author: Brian Osburn
 **********************************************************************/

import { ILogger } from '../../interfaces/ILogger'
import { AMTDeviceDTO } from '.././dto/AmtDeviceDTO'
import { IAMTDeviceRepository } from '../interfaces/IAMTDeviceRepository'
import { IConfigurator } from '../../interfaces/IConfigurator'
import { EnvReader } from '../../utils/EnvReader'
import { RPSError } from '../../utils/RPSError'
import { AMTUserName } from '../../utils/constants'

export class AMTDeviceVaultRepository implements IAMTDeviceRepository {
  private readonly logger: ILogger
  private readonly configurator: IConfigurator

  constructor (logger: ILogger, configurator: IConfigurator) {
    this.logger = logger
    this.configurator = configurator
  }

  public async insert (device: AMTDeviceDTO): Promise<boolean> {
    try {
      if (this.configurator?.secretsManager) {
        const data = { data: { AMT_PASSWORD: null, MEBX_PASSWORD: null, MPS_PASSWORD: null } }
        data.data.AMT_PASSWORD = device.amtpass
        data.data.MEBX_PASSWORD = device.mebxpass
        data.data.MPS_PASSWORD = device.mpspass
        await this.configurator.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}devices/${device.guid}`, data)
        return true
      } else {
        throw new Error('secret manager missing')
      }
    } catch (error) {
      this.logger.error(`failed to insert record guid: ${device.guid}, error: ${JSON.stringify(error)}`)
      throw new RPSError('Exception writing to vault')
    }
  }

  public async delete (device: AMTDeviceDTO): Promise<boolean> {
    try {
      if (this.configurator?.secretsManager) {
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
      if (this.configurator?.secretsManager) {
        const devicePwds: any = await this.configurator.secretsManager.getSecretAtPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}devices/${deviceId}`)
        this.logger.info('devicePwds :' + JSON.stringify(devicePwds))
        if (devicePwds) {
          const amtDevice: AMTDeviceDTO = new AMTDeviceDTO(
            deviceId,
            deviceId,
            null,
            devicePwds.data.MPS_PASSWORD,
            AMTUserName,
            devicePwds.data.AMT_PASSWORD,
            devicePwds.data.MEBX_PASSWORD)
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
