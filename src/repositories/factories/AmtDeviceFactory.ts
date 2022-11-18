/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { IAMTDeviceRepository } from '../../interfaces/database/IAMTDeviceRepository'
import { AMTDeviceVaultRepository } from './AMTDeviceVaultRepository'
import Logger from '../../Logger'
import { Configurator } from '../../Configurator'

interface IAmtDeviceFactory {
  amtDeviceRepository: IAMTDeviceRepository
  getAmtDeviceRepository: (configurator: Configurator) => IAMTDeviceRepository
}
const AmtDeviceFactory: IAmtDeviceFactory = {
  amtDeviceRepository: null,
  getAmtDeviceRepository (configurator: Configurator): IAMTDeviceRepository {
    if (AmtDeviceFactory.amtDeviceRepository == null) {
      AmtDeviceFactory.amtDeviceRepository = new AMTDeviceVaultRepository(new Logger('AMTDeviceVaultRepository'), configurator)
    }

    return AmtDeviceFactory.amtDeviceRepository
  }
}

export { AmtDeviceFactory }
