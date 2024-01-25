/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { RPSError } from './utils/RPSError.js'
import { ProtocolVersion } from './utils/constants.js'
import { Version } from './models/index.js'
const VersionChecker = {
  currentVersion: null as Version,
  setCurrentVersion (currentVersion: string): void {
    VersionChecker.currentVersion = VersionChecker.parseString(currentVersion)
  },

  /**
     * @description
     * @param {string} version string
     * @returns {Version} object containing parsed version
     */
  parseString (version: string): Version {
    if (version == null || version === '') {
      throw new RPSError('version must be defined')
    }

    const splitVersion = version.split('.')

    if (splitVersion.length <= 0 || splitVersion.length > 3) {
      throw new RPSError('invalid version string length')
    }

    const parsedVersion = new Version()

    parsedVersion.major = parseInt(splitVersion[0])

    if (isNaN(parsedVersion.major)) {
      throw new RPSError('failed to parse major')
    }

    if (splitVersion.length >= 2) {
      parsedVersion.minor = parseInt(splitVersion[1])

      if (isNaN(parsedVersion.minor)) {
        throw new RPSError('failed to parse minor')
      }
    }

    if (splitVersion.length >= 3) {
      parsedVersion.revision = parseInt(splitVersion[2])

      if (isNaN(parsedVersion.revision)) {
        throw new RPSError('failed to parse revision')
      }
    }

    return parsedVersion
  },

  isCompatible (messageVersion: string): boolean {
    if (VersionChecker.currentVersion == null) {
      VersionChecker.currentVersion = VersionChecker.parseString(ProtocolVersion)
    }

    const protocol: Version = VersionChecker.parseString(messageVersion)

    if (VersionChecker.currentVersion.major === protocol.major) {
      if (VersionChecker.currentVersion.minor === protocol.minor) {
        if (VersionChecker.currentVersion.revision >= protocol.revision) {
          return true
        }
      } else if (VersionChecker.currentVersion.minor >= protocol.minor) {
        return true
      }
    }

    return false
  }
}

export { VersionChecker }
