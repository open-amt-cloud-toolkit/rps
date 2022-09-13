/*********************************************************************
 * Copyright (c) Intel Corporation 2020
 * SPDX-License-Identifier: Apache-2.0
 * Description: stores amt device in vault
 * Author: Brian Osburn
 **********************************************************************/

import { ILogger } from '../../interfaces/ILogger'
import { IAMTDeviceRepository } from '../../interfaces/database/IAMTDeviceRepository'
import { RPSError } from '../../utils/RPSError'
import { AMTUserName } from '../../utils/constants'
import { AMTDeviceDTO } from '../../models'
import { Configurator } from '../../Configurator'

export class AMTDeviceVaultRepository implements IAMTDeviceRepository {
  private readonly logger: ILogger
  private readonly configurator: Configurator

  constructor (logger: ILogger, configurator: Configurator) {
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
        await this.configurator.secretsManager.writeSecretWithObject(`devices/${device.guid}`, data)
        return true
      } else {
        throw new Error('secret manager missing')
      }
    } catch (error) {
      this.logger.error(`failed to insert record guid: ${device.guid}, error: ${JSON.stringify(error)}`)
      throw new RPSError('Exception writing to vault')
    }
  }

  public async delete (guid: string): Promise<boolean> {
    try {
      if (this.configurator?.secretsManager) {
        await this.configurator.secretsManager.deleteSecretWithPath(`devices/${guid}`)
        return true
      } else {
        throw new Error('secret manager missing')
      }
    } catch (error) {
      this.logger.error(`failed to delete record guid: ${guid}, error: ${JSON.stringify(error)}`)
      throw new RPSError('Exception deleting from vault')
    }
  }

  public async get (deviceId: string): Promise<AMTDeviceDTO> {
    try {
      if (this.configurator?.secretsManager) {
        const devicePwds: any = await this.configurator.secretsManager.getSecretAtPath(`devices/${deviceId}`)
        if (devicePwds) {
          const amtDevice: AMTDeviceDTO = {
            guid: deviceId,
            name: deviceId,
            mpsuser: null,
            mpspass: devicePwds.data.MPS_PASSWORD,
            amtuser: AMTUserName,
            amtpass: devicePwds.data.AMT_PASSWORD,
            mebxpass: devicePwds.data.MEBX_PASSWORD
          }
          this.logger.debug(`found vault amt device: ${deviceId}`)

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
