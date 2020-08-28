/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: interface to export AMT device
 * Author: Brian Osburn
 **********************************************************************/
import { AMTDeviceDTO } from "../dto/AmtDeviceDTO";

export interface IAMTDeviceRepository {
    insert(device: AMTDeviceDTO): Promise<boolean>;
    get(deviceId: string): Promise<AMTDeviceDTO>;
}