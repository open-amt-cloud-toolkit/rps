/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Brian Osburn
 **********************************************************************/

import { EnvReader } from "../utils/EnvReader";
import { IAMTDeviceRepository } from "./interfaces/IAMTDeviceRepository";
import { AMTDeviceVaultRepository } from "./AMTDeviceVaultRepository";
import { IConfigurator } from "../interfaces/IConfigurator";
import Logger from "../Logger";
import { AMTDeviceFileRepository } from "./AMTDeviceFileRepository";


export class AmtDeviceFactory {

    static amtDeviceRepository: IAMTDeviceRepository;

    static getAmtDeviceRepository(configurator: IConfigurator): IAMTDeviceRepository {
        if (AmtDeviceFactory.amtDeviceRepository == null) {
            if (EnvReader.GlobalEnvConfig.VaultConfig.usevault) {
                AmtDeviceFactory.amtDeviceRepository = new AMTDeviceVaultRepository(Logger("AMTDeviceVaultRepository"), configurator);
            } else {
                AmtDeviceFactory.amtDeviceRepository = new AMTDeviceFileRepository(Logger("AMTDeviceFileRepository"));
            }
        }

        return AmtDeviceFactory.amtDeviceRepository;
    }
}