/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Madhavi Losetty
 **********************************************************************/
import { check } from 'express-validator'

export const domainInsertValidator = (): any => {
  return [
    check('profileName')
      .not()
      .isEmpty()
      .withMessage('AMT Domain profile name is required')
      .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
      .withMessage('AMT Domain profile name accepts letters, numbers, special characters and no spaces'),
    check('domainSuffix')
      .not()
      .isEmpty()
      .withMessage('Domain suffix name is required'),
    check('provisioningCert')
      .not()
      .isEmpty()
      .withMessage('Provisioning certificate is required'),
    check('provisioningCertStorageFormat')
      .not()
      .isEmpty()
      .withMessage('Provisioning Cert Storage Format is required')
      .isIn(['raw', 'string'])
      .withMessage("Provisioning Cert Storage Format should be either 'raw' or 'string'"),
    check('provisioningCertPassword')
      .not()
      .isEmpty()
      .withMessage('Provisioning Cert Password is required')
      .isLength({ max: 64 })
      .withMessage('Password should not exceed 64 characters in length')
  ]
}

export const domainUpdateValidator = (): any => {
  return [
    check('profileName')
      .not()
      .isEmpty()
      .withMessage('AMT Domain profile name is required')
      .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
      .withMessage('AMT Domain name accepts letters, numbers, special characters and no spaces'),
    check('domainSuffix')
      .optional(),
    check('provisioningCert')
      .optional(),
    check('provisioningCertStorageFormat')
      .optional()
      .isIn(['raw', 'string'])
      .withMessage('Provisioning Cert Storage Format is either "raw" or "string"'),
    check('provisioningCertPassword')
      .optional()
      .isLength({ max: 64 })
      .withMessage('Password should not exceed 64 characters in length')
  ]
}
