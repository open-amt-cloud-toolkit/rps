/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Madhavi Losetty
 **********************************************************************/
import { check } from 'express-validator'

export const domainInsertValidator = (): any => {
  return [
    check('payload.profileName')
      .not()
      .isEmpty()
      .withMessage('AMT Domain profile name is required')
      .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
      .withMessage('AMT Domain profile name accepts letters, numbers, special characters and no spaces'),
    check('payload.domainSuffix')
      .not()
      .isEmpty()
      .withMessage('Domain suffix name is required'),
    check('payload.provisioningCert')
      .not()
      .isEmpty()
      .withMessage('Provisioning certificate is required'),
    check('payload.provisioningCertStorageFormat')
      .not()
      .isEmpty()
      .withMessage('Provisioning Cert Storage Format is required')
      .isIn(['raw', 'string'])
      .withMessage("Provisioning Cert Storage Format should be either 'raw' or 'string'"),
    check('payload.provisioningCertPassword')
      .not()
      .isEmpty()
      .withMessage('Provisioning Cert Password is required')
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('Password should contain at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.')
  ]
}

export const domainUpdateValidator = (): any => {
  return [
    check('payload.profileName')
      .not()
      .isEmpty()
      .withMessage('AMT Domain profile name is required')
      .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
      .withMessage('AMT Domain name accepts letters, numbers, special characters and no spaces'),
    check('payload.domainSuffix')
      .optional(),
    check('payload.provisioningCert')
      .optional(),
    check('payload.provisioningCertStorageFormat')
      .optional()
      .isIn(['raw', 'string'])
      .withMessage('Provisioning Cert Storage Format is either "raw" or "string"'),
    check('payload.provisioningCertPassword')
      .optional()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('Password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.')
  ]
}
