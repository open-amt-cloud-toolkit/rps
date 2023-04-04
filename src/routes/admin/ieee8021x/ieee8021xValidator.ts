/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { check, type CustomValidator } from 'express-validator'

export const ieee8021xValidator = (): any => [
  check('profileName')
    .not()
    .isEmpty()
    .withMessage('802.1x profile name is required')
    .matches('^[a-zA-Z0-9]+$')
    .withMessage('802.1x profile name should be alphanumeric')
    .isLength({ max: 32 })
    .withMessage('802.1x profile name maximum length is 32'),
  check('authenticationProtocol')
    .not()
    .isEmpty()
    .withMessage('Authentication protocol is required')
    .isIn([0, 3, 5, 10])
    .withMessage('Authentication protocol should be either 0(EAP_TLS), 3(EAP_GTC), 5(EAPFAST_GTC) or 10(EAPFAST_TLS)'),
  check('pxeTimeout')
    .optional()
    .custom(validatePxeTimeout)
]

export const ieee8021xEditValidator = (): any => [
  check('profileName')
    .not()
    .isEmpty()
    .withMessage('802.1x profile name is required')
    .matches('^[a-zA-Z0-9]+$')
    .withMessage('802.1x profile name should be alphanumeric')
    .isLength({ max: 32 })
    .withMessage('802.1x profile name maximum length is 32'),
  check('authenticationProtocol')
    .optional()
    .isIn([0, 3, 5, 10])
    .withMessage('Authentication protocol should be either 0(EAP_TLS), 3(EAP_GTC), 5(EAPFAST_GTC) or 10(EAPFAST_TLS)'),
  check('pxeTimeout')
    .optional()
    .custom(validatePxeTimeout),
  check('version')
    .not()
    .isEmpty()
    .withMessage('Version is required to patch/update a record.')
]

export const validatePxeTimeout: CustomValidator = value => {
  if (typeof value !== 'number') {
    throw new Error('PXE Timeout must be number')
  }
  if (value < 0 || value > 86400) {
    throw new Error('PXE Timeout value should be 0 - 86400')
  }
  return true
}
