/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: check protocol version of received messages
 * Author : Brian Osburn
 **********************************************************************/

import { RPSError } from "./utils/RPSError";
import { ProtocolVersion } from "./utils/constants"
import { Version } from "./models/Rcs";

export class VersionChecker {

    private static currentVersion: Version;

    static setCurrentVersion(currentVersion: string) {
        VersionChecker.currentVersion = VersionChecker.parseString(currentVersion);
    }

    /**
     * @description 
     * @param {string} version string
     * @returns {Version} object containing parsed version
     */
    static parseString(version: string): Version {

        if (typeof version === 'undefined' || version == "") {
            throw new RPSError(`version must be defined`);
        }

        let splitVersion = version.split(`.`);

        if (splitVersion.length <= 0 || splitVersion.length > 3) {
            throw new RPSError(`invalid version string length`);
        }

        let parsedVersion = new Version();

        parsedVersion.major = parseInt(splitVersion[0]);

        if (isNaN(parsedVersion.major)) {
            throw new RPSError(`failed to parse major`);
        }

        if (splitVersion.length >= 2) {
            parsedVersion.minor = parseInt(splitVersion[1]);

            if (isNaN(parsedVersion.minor)) {
                throw new RPSError(`failed to parse minor`);
            }
        }

        if (splitVersion.length >= 3) {
            parsedVersion.revision = parseInt(splitVersion[2]);

            if (isNaN(parsedVersion.revision)) {
                throw new RPSError(`failed to parse revision`);
            }
        }

        return parsedVersion;
    }

    static isCompatible(messageVersion: string): boolean {

        if (typeof VersionChecker.currentVersion === 'undefined') {
            VersionChecker.currentVersion = VersionChecker.parseString(ProtocolVersion);
        }

        let protocol: Version = VersionChecker.parseString(messageVersion);

        if (VersionChecker.currentVersion.major === protocol.major) {
            if (VersionChecker.currentVersion.minor === protocol.minor) {
                if (VersionChecker.currentVersion.revision >= protocol.revision) {
                    return true;
                }
            } else if (VersionChecker.currentVersion.minor >= protocol.minor) {
                return true;
            }
        }

        return false;
    }
}
