/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { check } from 'express-validator'

const isValidLinkPolicy = (n: number): boolean =>
  // ValueMap={1, 14, 16, 224}
  // Values={available on S0 AC, available on Sx AC, available on S0 DC, available on Sx DC}
  (n === 1 || n === 14 || n === 16 || n === 224)

export const wirelessValidator = (): any => [
  check('profileName')
    .not()
    .isEmpty()
    .withMessage('Wireless profile name is required')
    .matches('^[a-zA-Z0-9]+$')
    .withMessage('802.1x profile name should be alphanumeric')
    .isLength({ max: 32 })
    .withMessage('802.1x profile name maximum length is 32'),
  check('authenticationMethod')
    .not()
    .isEmpty()
    .withMessage('Authentication method is required')
    .isIn([4, 6])
    .withMessage('Authentication method should be either 4(WPA PSK) or 6(WPA2 PSK)'),
  check('encryptionMethod')
    .not()
    .isEmpty()
    .withMessage('Encryption method is required')
    .isIn([4, 3])
    .withMessage('Encryption method should be either 3(TKIP) or 4(CCMP)'),
  check('ssid')
    .not()
    .isEmpty()
    .withMessage('SSID is required')
    .isLength({ max: 32 })
    .withMessage('Maximum length is 32'),
  check('pskPassphrase')
    .not()
    .isEmpty()
    .withMessage('PSK Passphrase is required')
    .isLength({ min: 8, max: 63 })
    .withMessage('PSK Passphrase length should be greater than or equal to 8 and less than or equal to 63'),
  check('linkPolicy')
    .optional()
    .isArray()
    .withMessage('LinkPolicy should be an array of integers')
    .custom((value) => {
      if (!value.every(Number.isInteger)) throw new Error('Array does not contain integers') // check that contains Integers
      if (!value.every(isValidLinkPolicy)) throw new Error('Array values should be either 1: available on S0 AC, 14: available on Sx AC, 16: available on S0 DC, 224: available on Sx DC')
      return true
    })
]

export const wirelessEditValidator = (): any => [
  check('profileName')
    .not()
    .isEmpty()
    .withMessage('Wireless profile name is required')
    .matches('^[a-zA-Z0-9]+$')
    .withMessage('802.1x profile name should be alphanumeric')
    .isLength({ max: 32 })
    .withMessage('802.1x profile name maximum length is 32'),
  check('authenticationMethod')
    .optional()
    .isIn([4, 6])
    .withMessage('Authentication method should be either 4(WPA PSK) or 6(WPA2 PSK)'),
  check('encryptionMethod')
    .optional()
    .isIn([4, 3])
    .withMessage('Encryption method should be either 3(TKIP) or 4(CCMP)'),
  check('ssid')
    .optional()
    .isLength({ max: 32 })
    .withMessage('Maximum length is 32'),
  check('pskPassphrase')
    .optional()
    .isLength({ min: 8, max: 63 })
    .withMessage('PSK Passphrase length should be greater than or equal to 8 and less than or equal to 63'),
  check('linkPolicy')
    .optional()
    .isArray()
    .withMessage('LinkPolicy should be an array of integers')
    .custom((value) => {
      if (!value.every(Number.isInteger)) throw new Error('Array does not contain integers') // check that contains Integers
      if (!value.every(isValidLinkPolicy)) throw new Error('Array values should be either 1: available on S0 AC, 14: available on Sx AC, 16: available on S0 DC, 224: available on Sx DC')
      return true
    }),
  check('version')
    .not()
    .isEmpty()
    .withMessage('Version is required to patch/update a record.')
]
