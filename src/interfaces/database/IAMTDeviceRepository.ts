/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMTDeviceDTO } from '../../models'

export interface IAMTDeviceRepository {
  insert: (device: AMTDeviceDTO) => Promise<boolean>
  delete: (deviceId: string) => Promise<boolean>
  get: (deviceId: string) => Promise<AMTDeviceDTO>
}
