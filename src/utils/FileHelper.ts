/*********************************************************************
* Copyright (c) Intel Corporation 2019
* SPDX-License-Identifier: Apache-2.0
* Description: file helper functions for RCS
* Author: Brian Osburn
**********************************************************************/

import * as fs from "fs";
import Logger from "../Logger";
import { ILogger } from "../interfaces/ILogger";

export class FileHelper {

    static logger: ILogger = Logger(`FileHelper`);

    public static isValidPath(filePath: string): boolean {
        if (filePath && fs.existsSync(filePath)) {
            return true;
        } else {
            return false;
        }
    }

    public static readFileSync(filePath: string): string {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            throw new Error(`Exception in reading file: ${error}, filePath: ${filePath}`);
        }
    }

    public static readFileSyncToBuffer(filePath: string): Buffer {
        try {
            return fs.readFileSync(filePath);
        } catch (error) {
            throw new Error(`Exception in reading file: ${error}, filePath: ${filePath}`);
        }
    }

    public static readJsonObjFromFile(filePath: string): any {
        let jsonFile = {};

        try {
            if (FileHelper.isValidPath(filePath)) {
                this.logger.debug(`credential file found at location: ${filePath}`);

                let fileContents = FileHelper.readFileSync(filePath);

                if (fileContents) {
                    let fileContentsTrimmed = fileContents.trim();
                    if (fileContentsTrimmed && fileContentsTrimmed.length > 0) {
                        jsonFile = JSON.parse(fileContents);
                        this.logger.debug(`read in file: ${JSON.stringify(jsonFile, null, 2)}}`);
                    } else {
                        this.logger.warn(`file only contains whitespaces ${filePath}`);
                    }
                } else {
                    this.logger.warn(`file is empty ${filePath}`);
                }
            } else {
                this.logger.warn(`file not found at location: ${filePath}`);
            }
        } catch (error) {
            throw new Error(`Exception in reading file: ${error}, filePath: ${filePath}`);
        }

        return jsonFile;
    }

    public static writeObjToJsonFile(obj: any, filePath: string): void {
        try {
            let jsonObj: string = JSON.stringify(obj, null, 2);
            fs.writeFileSync(filePath, jsonObj, 'utf8');
        } catch (error) {
            throw new Error(`Exception in writting file: ${error}, filePath: ${filePath}`);
        }
    }
}