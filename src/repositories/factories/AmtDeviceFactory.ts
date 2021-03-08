/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Brian Osburn
 **********************************************************************/

import { EnvReader } from '../../utils/EnvReader'
import { IAMTDeviceRepository } from '../interfaces/IAMTDeviceRepository'
import { AMTDeviceVaultRepository } from './AMTDeviceVaultRepository'
import { IConfigurator } from '../../interfaces/IConfigurator'
import Logger from '../../Logger'
import { AMTDeviceFileRepository } from './AMTDeviceFileRepository'

interface IAmtDeviceFactory {
  amtDeviceRepository: IAMTDeviceRepository
  getAmtDeviceRepository: (configurator: IConfigurator) => IAMTDeviceRepository
}
const AmtDeviceFactory: IAmtDeviceFactory = {
  amtDeviceRepository: null,
  getAmtDeviceRepository (configurator: IConfigurator): IAMTDeviceRepository {
    if (AmtDeviceFactory.amtDeviceRepository == null) {
      if (EnvReader.GlobalEnvConfig.VaultConfig.usevault) {
        AmtDeviceFactory.amtDeviceRepository = new AMTDeviceVaultRepository(new Logger('AMTDeviceVaultRepository'), configurator)
      } else {
        AmtDeviceFactory.amtDeviceRepository = new AMTDeviceFileRepository(new Logger('AMTDeviceFileRepository'))
      }
    }

    return AmtDeviceFactory.amtDeviceRepository
  }
}

export { AmtDeviceFactory }
