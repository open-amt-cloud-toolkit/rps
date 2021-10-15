/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { check } from 'express-validator'

export const tlsInsertValidator = (): any => {
  return [
    check('configName')
      .not()
      .isEmpty()
      .withMessage('TLS profile name is required')
      .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
      .withMessage('TLS profile name accepts letters, numbers, special characters and no spaces'),
    check('commonName')
      .not()
      .isEmpty()
      .withMessage('commonName is required'),
    check('issuedCommonName')
      .not()
      .isEmpty()
      .withMessage('issuedCommonName is required'),
    check('organization')
      .not()
      .isEmpty()
      .withMessage('organization is required'),
    check('stateOrProvince')
      .not()
      .isEmpty()
      .withMessage('stateOrProvince is required'),
    check('country')
      .not()
      .isEmpty()
      .withMessage('country is required'),
    check('isTrustedCert')
      .not()
      .isEmpty()
      .withMessage('isTrustedCert is required')
      .isBoolean()
      .withMessage('isTrustedCert needs to be a bool'),
    check('tlsMode')
      .not()
      .isEmpty()
      .withMessage('tlsMode is required')
      .isIn([1, 2, 3, 4])
      .withMessage('tlsMode must be set to one of these values: 1 (Server Authentication Only), 2 (Server and Non-TLS Authentication), 3 (Mutual TLS only), 4 (Mutual and Non-TLS authentication)')
  ]
}

export const tlsUpdateValidator = (): any => {
  return [
    check('configName')
      .not()
      .isEmpty()
      .withMessage('TLS profile name is required')
      .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
      .withMessage('TLS profile name accepts letters, numbers, special characters and no spaces'),
    check('commonName')
      .isEmpty(),
    check('organization')
      .isEmpty(),
    check('stateOrProvince')
      .isEmpty(),
    check('country')
      .isEmpty(),
    check('issuedCommonName')
      .isEmpty(),
    check('isTrustedCert')
      .optional()
      .isBoolean()
      .withMessage('isTrustedCert needs to be a bool'),
    check('tlsMode')
      .optional()
      .isIn([1, 2, 3, 4])
      .withMessage('tlsMode must be set to one of these values: 0 (No TLS), 1 (Server Authentication Only), 2 (Server and Non-TLS Authentication), 3 (Mutual TLS only), 4 (Mutual and Non-TLS authentication)')
  ]
}
