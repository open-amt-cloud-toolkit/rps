/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Madhavi Losetty
 **********************************************************************/
import { check } from 'express-validator'

const ipv4 = '^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$'
const ipv6 = '^((?:[0-9A-Fa-f]{1,4}))((?::[0-9A-Fa-f]{1,4}))*::((?:[0-9A-Fa-f]{1,4}))((?::[0-9A-Fa-f]{1,4}))*|((?:[0-9A-Fa-f]{1,4}))((?::[0-9A-Fa-f]{1,4})){7}$'
const fqdn = '^(?=.{1,254}$)((?=[a-z0-9-]{1,63}\\.)(xn--+)?[a-z0-9]+(-[a-z0-9]+)*\\.)+[a-z]{2,63}$'

export const ciraInsertValidator = (): any => {
  return [
    check('payload.configName')
      .not()
      .isEmpty()
      .withMessage('CIRA profile name is required')
      .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
      .withMessage('CIRA profile name accepts letters, numbers, special characters and no spaces'),
    check('payload.serverAddressFormat')
      .not()
      .isEmpty()
      .withMessage('MPS server address format is required')
      .isIn([3, 4, 201])
      .withMessage('MPS server address format should be either 3(IPV4) , 4(IPV6) or 201(FQDN)'),
    check('payload.mpsServerAddress')
      .not()
      .isEmpty()
      .withMessage('MPS server address is required')
      .custom((value, { req }) => {
        if (serverAddressFormatValidator(value, req)) {
          return true
        }
        return false
      }),
    check('payload.mpsPort')
      .not()
      .isEmpty()
      .withMessage('MPS port is required')
      .isInt({ min: 1024, max: 49151 })
      .withMessage('MPS Port value should range between 1024 and 49151'),
    check('payload.username')
      .not()
      .isEmpty()
      .withMessage('MPS user name is required')
      .matches('^[a-zA-Z0-9]+$') // As per AMT SDK, accepts only alphanumeric values
      .withMessage('MPS user name should be alphanumeric'),
    check('payload.password')
      .not()
      .isEmpty()
      .withMessage('MPS password is required')
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('Password should contain atleast one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('payload.commonName')
      .optional()
      .matches('^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$')
      .withMessage('Cert. Hostname(CN) should be an IP address.'),
    check('payload.authMethod')
      .not()
      .isEmpty()
      .withMessage('Authentication method is required')
      .isIn([1, 2])
      .withMessage('Authentication method should be either 1 (Mutual Auth) or 2 (username and password)'),
    check('payload.mpsRootCertificate')
      .not()
      .isEmpty()
      .withMessage('MPS public root certificate is required'),
    check('payload.proxyDetails')
      .optional()
  ]
}

export const ciraUpdateValidator = (): any => {
  return [
    check('payload.configName')
      .not()
      .isEmpty()
      .withMessage('CIRA profile name is required')
      .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
      .withMessage('CIRA profile name accepts letters, numbers, special characters and no spaces'),
    check('payload.serverAddressFormat')
      .optional()
      .isIn([3, 4, 201])
      .withMessage('MPS server address format 3(IPV4) , 4(IPV6) or 201(FQDN)')
      .custom((value, { req }) => {
        if (req.body.payload.mpsServerAddress == null) {
          throw new Error('Server address is required to update')
        }
        return true
      }),
    check('payload.mpsServerAddress')
      .optional()
      .custom((value, { req }) => {
        if (serverAddressFormatValidator(value, req)) {
          return true
        }
        return false
      }),
    check('payload.mpsPort')
      .optional()
      .custom((value, { req }) => {
        if (typeof value !== 'number' || value <= 1024 || value >= 49151) {
          throw new Error('MPS Port value should range between 1024 and 49151')
        }
        return true
      }),
    check('payload.username')
      .optional()
      .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
      .withMessage('MPS user name accepts letters, numbers, special characters and no spaces'),
    check('payload.password')
      .optional()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('Password should contain atleast one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('payload.commonName')
      .optional()
      .matches('^([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])\\.([01]?[0-9]?[0-9]|2[0-4][0-9]|25[0-5])$')
      .withMessage('Cert. Hostname(CN) should be an IP address.')
      .custom((value, { req }) => {
        if (req.body.payload.serverAddressFormat == null || req.body.payload.mpsServerAddress == null) {
          throw new Error('payload.serverAddressFormat and payload.mpsServerAddress is required')
        }
        return true
      }),
    check('payload.authMethod')
      .optional()
      .isIn([1, 2])
      .withMessage('Authentication method accepts either 1 - Mutual Auth or 2 -username/password)'),
    check('payload.mpsRootCertificate')
      .optional(),
    check('payload.proxyDetails')
      .optional()
  ]
}

function serverAddressFormatValidator (value, req): boolean {
  if (req.body.payload.serverAddressFormat == null) {
    throw new Error('payload.serverAddressFormat is required')
  }
  if (value != null) {
    if (req.body.payload.serverAddressFormat === 3) {
      if (!value.match(ipv4)) {
        throw new Error('payload.serverAddressFormat 3 requires IPV4 server address')
      } else if (req.body.payload.commonName == null) {
        throw new Error('payload.commonName is required when payload.serverAddressFormat is 3')
      }
    } else if (req.body.payload.serverAddressFormat === 4) {
      if (!value.match(ipv6)) {
        throw new Error('payload.serverAddressFormat 4 requires IPV6 server address')
      }
    } else if (req.body.payload.serverAddressFormat === 201) {
      if (!value.match(fqdn) && !value.match(ipv4)) {
        throw new Error('payload.serverAddressFormat 201 requires FQDN server address')
      }
    }
  }
  return true
}
