/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { check } from 'express-validator'
import { type Request } from 'express'
import { AuthenticationMethods, EncryptionMethods } from './constants.js'

const isValidLinkPolicy = (n: number): boolean =>
  // ValueMap={1, 14, 16, 224}
  // Values={available on S0 AC, available on Sx AC, available on S0 DC, available on Sx DC}
  n === 1 || n === 14 || n === 16 || n === 224

export const wirelessValidator = (): any => [
  check('profileName')
    .not()
    .isEmpty()
    .withMessage('Wireless profile name is required')
    .matches('^[a-zA-Z0-9]+$')
    .withMessage('Wireless profile name should be alphanumeric')
    .isLength({ max: 32 })
    .withMessage('Wireless profile name maximum length is 32'),
  check('authenticationMethod')
    .not()
    .isEmpty()
    .withMessage('Authentication method is required')
    .isIn(AuthenticationMethods.all().map((m) => m.value))
    .withMessage(
      'Authentication method must be one of ' +
        AuthenticationMethods.all()
          .map((m) => m.value.toString() + ':' + m.label)
          .join(', ')
    ),
  check('encryptionMethod')
    .not()
    .isEmpty()
    .withMessage('Encryption method is required')
    .isIn(EncryptionMethods.all().map((m) => m.value))
    .withMessage(
      'Encryption method must be one of ' +
        EncryptionMethods.all()
          .map((m) => m.value.toString() + ':' + m.label)
          .join(', ')
    ),
  check('ssid')
    .not()
    .isEmpty()
    .withMessage('SSID is required')
    .isLength({ max: 32 })
    .withMessage('Maximum length is 32'),
  check('pskPassphrase')
    .if(check('authenticationMethod').custom((value) => AuthenticationMethods.isPSK(value)))
    .isLength({ min: 8, max: 63 })
    .withMessage('PSK Passphrase length should be greater than or equal to 8 and less than or equal to 63'),
  check('ieee8021xProfileName')
    .if(check('authenticationMethod').custom((value) => AuthenticationMethods.isIEEE8021X(value)))
    .notEmpty()
    .withMessage('ieee8021xProfileName is required'),
  check('ieee8021xProfileName')
    .if(check('authenticationMethod').custom((value) => !AuthenticationMethods.isIEEE8021X(value)))
    .isEmpty()
    .withMessage('ieee8021xProfileName can not be specified with the provided authenticationMethod'),
  check('ieee8021xProfileName')
    .optional({ nullable: true })
    .custom(async (value, { req }) => {
      const profileExists = await validateIEEE8021xConfigs(value, req as Request)
      if (!profileExists) {
        throw new Error(`Ieee8021x profile ${value} does not exist in db`)
      }
      const isWired = await getProfileInterface(value, req as Request)
      if (isWired) {
        throw new Error(`Ieee8021x profile ${value} is for wired interfaces`)
      }
      return true
    }),
  check('linkPolicy')
    .optional()
    .isArray()
    .withMessage('LinkPolicy should be an array of integers')
    .custom((value) => {
      if (!value.every(Number.isInteger)) throw new Error('Array does not contain integers') // check that contains Integers
      if (!value.every(isValidLinkPolicy))
        throw new Error(
          'Array values should be either 1: available on S0 AC, 14: available on Sx AC, 16: available on S0 DC, 224: available on Sx DC'
        )
      return true
    })
]

export const wirelessEditValidator = (): any => [
  ...wirelessValidator(),
  check('version').not().isEmpty().withMessage('Version is required to patch/update a record.')]

const validateIEEE8021xConfigs = async (value: any, req: Request): Promise<boolean> => {
  const isProfileExist = await req.db.ieee8021xProfiles.checkProfileExits(value, req.tenantId)
  if (!isProfileExist) {
    return false
  }
  return true
}

const getProfileInterface = async (value: any, req: Request): Promise<boolean | null> => {
  const prof = await req.db.ieee8021xProfiles.getByName(value, req.tenantId)
  return prof?.wiredInterface ?? null
}
