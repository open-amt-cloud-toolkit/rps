/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Brian Osburn
 **********************************************************************/

import { IAMTDeviceRepository } from '../interfaces/IAMTDeviceRepository'
import { AMTDeviceVaultRepository } from './AMTDeviceVaultRepository'
import { IConfigurator } from '../../interfaces/IConfigurator'
import Logger from '../../Logger'

interface IAmtDeviceFactory {
  amtDeviceRepository: IAMTDeviceRepository
  getAmtDeviceRepository: (configurator: IConfigurator) => IAMTDeviceRepository
}
const AmtDeviceFactory: IAmtDeviceFactory = {
  amtDeviceRepository: null,
  getAmtDeviceRepository (configurator: IConfigurator): IAMTDeviceRepository {
    if (AmtDeviceFactory.amtDeviceRepository == null) {
      AmtDeviceFactory.amtDeviceRepository = new AMTDeviceVaultRepository(new Logger('AMTDeviceVaultRepository'), configurator)
    }

    return AmtDeviceFactory.amtDeviceRepository
  }
}

export { AmtDeviceFactory }
