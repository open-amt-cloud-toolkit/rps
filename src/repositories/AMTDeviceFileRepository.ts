/*********************************************************************
 * Copyright (c) Intel Corporation 2020
 * SPDX-License-Identifier: Apache-2.0
 * Description: stores amt device in memory
 * Author: Brian Osburn
 **********************************************************************/
import * as path from "path";
import { ILogger } from '../interfaces/ILogger';
import { AMTDeviceDTO } from './dto/AmtDeviceDTO';
import { IAMTDeviceWriter } from './interfaces/IAMTDeviceWriter';
import { FileHelper } from '../utils/FileHelper';
import { EnvReader } from "../utils/EnvReader";
import { RPSError } from "../utils/RPSError";

export class AMTDeviceFileRepository implements IAMTDeviceWriter {
    private logger: ILogger;

    constructor(logger: ILogger) {
        this.logger = logger;
    }

    public connect(): void {
        this.logger.debug(`connect called`);
    }

    public disconnect(): void {
        this.logger.debug(`disconnect called`);
    }

    public async insert(device: AMTDeviceDTO): Promise<boolean> {

        try {
            let credentialsFilePath = path.join(__dirname, EnvReader.GlobalEnvConfig.credentialspath);

            let credentialsFile = {};

            if (FileHelper.isValidPath(credentialsFilePath)) {
                this.logger.debug(`credential file found at location: ${credentialsFilePath}`);

                let credentialFileContents = FileHelper.readFileSync(credentialsFilePath);

                if(credentialFileContents){
                    let credentialFileContentsTrimmed = credentialFileContents.trim();
                    if(credentialFileContentsTrimmed && credentialFileContentsTrimmed.length > 0){
                        credentialsFile = JSON.parse(credentialFileContents);
                        this.logger.debug(`read in credential file: ${JSON.stringify(credentialsFile, null, 2)}}`);
                    }else{
                        this.logger.warn(`credential file only contains whitespaces ${credentialsFilePath}`);
                    }                
                } else{
                    this.logger.warn(`credential file is empty ${credentialsFilePath}`);
                }
            } else {
                this.logger.warn(`credential file not found at location: ${credentialsFilePath}`);
            }

            credentialsFile[device.guid] =
            {
                'name': device.name,
                'mpsuser': device.mpsuser,
                'mpspass': device.mpspass,
                'amtuser': device.amtuser,
                'amtpass': device.amtpass
            }

            this.logger.debug(`added entry to credential file: ${JSON.stringify(credentialsFile, null, 2)}}`);

            FileHelper.writeObjToJsonFile(credentialsFile, credentialsFilePath);
            return true;

        } catch (error) {
            this.logger.error(`failed to insert record guid: ${device.guid}, error: ${JSON.stringify(error)}`);
            throw new RPSError(`Exception writting to credentials file`);
        }
    }
}
