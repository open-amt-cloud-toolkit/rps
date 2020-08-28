/*********************************************************************
 * Copyright (c) Intel Corporation 2020
 * SPDX-License-Identifier: Apache-2.0
 * Description: stores amt device in memory
 * Author: Brian Osburn
 **********************************************************************/
import * as path from "path";
import { ILogger } from '../interfaces/ILogger';
import { AMTDeviceDTO } from './dto/AmtDeviceDTO';
import { IAMTDeviceRepository } from './interfaces/IAMTDeviceRepository';
import { FileHelper } from '../utils/FileHelper';
import { EnvReader } from "../utils/EnvReader";
import { RPSError } from "../utils/RPSError";

export class AMTDeviceFileRepository implements IAMTDeviceRepository {
    private logger: ILogger;

    constructor(logger: ILogger) {
        this.logger = logger;
    }

    public async insert(device: AMTDeviceDTO): Promise<boolean> {

        try {
            let credentialsFilePath = path.join(__dirname, EnvReader.GlobalEnvConfig.credentialspath);

            let credentialsFile = FileHelper.readJsonObjFromFile(credentialsFilePath);

            if (!credentialsFile.credentials) {
                credentialsFile.credentials = {};
            }

            credentialsFile.credentials[device.guid] =
            {
                'name': device.name,
                'mpsuser': device.mpsuser,
                'mpspass': device.mpspass,
                'amtuser': device.amtuser,
                'amtpass': device.amtpass
            };

            this.logger.debug(`added entry to credential file: ${JSON.stringify(credentialsFile, null, 2)}}`);

            FileHelper.writeObjToJsonFile(credentialsFile, credentialsFilePath);
            return true;

        } catch (error) {
            this.logger.error(`failed to insert record guid: ${device.guid}, error: ${JSON.stringify(error)}`);
            throw new RPSError(`Exception writting to credentials file`);
        }
    }

    public async get(deviceId: string): Promise<AMTDeviceDTO> {
        try {
            let credentialsFilePath = path.join(__dirname, EnvReader.GlobalEnvConfig.credentialspath);

            let amtDevice: AMTDeviceDTO = null;

            if (FileHelper.isValidPath(credentialsFilePath)) {
                this.logger.debug(`credential file found at location: ${credentialsFilePath}`);

                let credentialsFile = FileHelper.readJsonObjFromFile(credentialsFilePath);

                if (!credentialsFile.credentials) {
                    credentialsFile.credentials = {};
                }

                let device = credentialsFile.credentials[deviceId];

                if (device) {
                    amtDevice = new AMTDeviceDTO(device.deviceId, device.name, device.mpsuser, device.mpspass, device.amtuser, device.amtpass);
                } else {
                    throw new RPSError(`device not found`);
                }

                this.logger.debug(`returning device: ${JSON.stringify(amtDevice, null, 2)}}`);

                return amtDevice;

            } else {
                this.logger.warn(`credential file not found at location: ${credentialsFilePath}`);
                throw new Error(`credentials path not valid`);
            }

        } catch (error) {
            this.logger.error(`failed to get device record guid: ${deviceId}, error: ${JSON.stringify(error)}, error: ${error}`);
            throw new RPSError(`Exception reading device: ${deviceId}`);
        }
    }
}
