/*********************************************************************
 * Copyright (c) Intel Corporation 2020
 * SPDX-License-Identifier: Apache-2.0
 * Description: stores amt device in memory
 * Author: Brian Osburn
 **********************************************************************/

import { ILogger } from '../interfaces/ILogger';
import { AMTDeviceDTO } from './dto/AmtDeviceDTO';
import { IAMTDeviceWriter } from './interfaces/IAMTDeviceWriter';
import { IConfigurator } from '../interfaces/IConfigurator';
import { EnvReader } from '../utils/EnvReader';

export class AMTDeviceVaultRepository implements IAMTDeviceWriter {
    private logger: ILogger;
    private configurator: IConfigurator;

    constructor(logger: ILogger, configurator: IConfigurator) {
        this.logger = logger;
        this.configurator = configurator;
    }

    public connect(): void {
        this.logger.debug(`connect called`);
    }

    public disconnect(): void {
        this.logger.debug(`disconnect called`);
    }

    public async insert(device: AMTDeviceDTO): Promise<boolean> {
        try {
            await this.configurator.secretsManager.writeSecretWithKey(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}devices/${device.guid}`, `${device.guid}`, device.amtpass);
            return true;
        } catch (error) {
            this.logger.error(`failed to insert record guid: ${device.guid}, error: ${JSON.stringify(error)}`);
            throw new Error(`Exception writting to vault: ${error}`);
        }
    }
}
