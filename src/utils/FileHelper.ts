/*********************************************************************
* Copyright (c) Intel Corporation 2019
* SPDX-License-Identifier: Apache-2.0
* Description: file helper functions for RCS
* Author: Brian Osburn
**********************************************************************/

import * as fs from "fs";

export class FileHelper {

    public static isValidPath(filePath: string): boolean {
        if (fs.existsSync(filePath)) {
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

    public static readJsonObjFromFile<T>(filePath: string): T {
        try {
            let importedFile = FileHelper.readFileSync(filePath);
            let file: T = JSON.parse(importedFile);
            return file;
        } catch (error) {
            throw new Error(`Exception in reading file: ${error}, filePath: ${filePath}`);
        }
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