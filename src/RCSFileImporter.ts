/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: imports a rcs config from a file
 * Author: Brian Osburn
 **********************************************************************/

import { IRCSConfigReader } from "./interfaces/IRCSConfigReader";
import { ILogger } from "./interfaces/ILogger";
import { RCSConfig } from "./models/Rcs";
import { FileHelper } from "./utils/FileHelper";

export class RCSFileImporter implements IRCSConfigReader {

    private filePath: string;
    private logger: ILogger;

    constructor(logger: ILogger, filePath: string) {
        this.logger = logger;
        this.filePath = filePath;
    }

    public importconfig(): RCSConfig {
        try {
            if (FileHelper.isValidPath(this.filePath)) {
                this.logger.info(`file path exists: ${this.filePath}`);
                return FileHelper.readJsonObjFromFile<RCSConfig>(this.filePath);
            } else {
                this.logger.warn(`file does not exist: ${this.filePath}`);
                return new RCSConfig();
            }
        } catch (error) {
            this.logger.error(`Exception in importconfig: ${error}, filePath: ${this.filePath}`);
            return new RCSConfig();
        }
    }
}