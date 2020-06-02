/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Brian Osburn
 **********************************************************************/

import { EnvReader } from "../utils/EnvReader";
import { IAMTDeviceWriter } from "./interfaces/IAMTDeviceWriter";
import { AMTDeviceVaultRepository } from "./AMTDeviceVaultRepository";
import { IConfigurator } from "../interfaces/IConfigurator";
import Logger from "../Logger";
import { AMTDeviceFileRepository } from "./AMTDeviceFileRepository";


export class AmtDeviceWriterFactory {

    static amtDeviceWriter: IAMTDeviceWriter;

    static getAmtDeviceWriter(configurator: IConfigurator): IAMTDeviceWriter {
        if (AmtDeviceWriterFactory.amtDeviceWriter == null) {
            if (EnvReader.GlobalEnvConfig.VaultConfig.usevault) {
                AmtDeviceWriterFactory.amtDeviceWriter = new AMTDeviceVaultRepository(Logger("AMTDeviceVaultRepository"), configurator);
            } else {
                AmtDeviceWriterFactory.amtDeviceWriter = new AMTDeviceFileRepository(Logger("AMTDeviceFileRepository"));
            }
        }

        return AmtDeviceWriterFactory.amtDeviceWriter;
    }
}