/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { check, type Meta, type CustomValidator } from 'express-validator'
import { type AuthenticationProtocol, AuthenticationProtocols } from './constants'

export const ieee8021xValidator = (): any => [
  check('profileName')
    .not()
    .isEmpty()
    .withMessage('802.1x profile name is required')
    .matches('^[a-zA-Z0-9]+$')
    .withMessage('802.1x profile name should be alphanumeric')
    .isLength({ max: 32 })
    .withMessage('802.1x profile name maximum length is 32'),
  check('wiredInterface')
    .not()
    .isEmpty()
    .withMessage('Wired interface flag is required'),
  check('authenticationProtocol')
    .not()
    .isEmpty()
    .withMessage('Authentication protocol is required')
    .custom(validateAuthProtocol),
  check('pxeTimeout')
    .if(check('wiredInterface').matches(/^true$/i))
    .not().isEmpty()
    .withMessage('PXE Timeout is required')
    .custom(validatePxeTimeout)
]

export const ieee8021xEditValidator = (): any => [
  ...ieee8021xValidator(),
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

export const validateAuthProtocol: CustomValidator = (value, meta: Meta) => {
  const reqBody: any = meta.req.body
  const wiredInterface = reqBody.wiredInterface
  const validProtocols: AuthenticationProtocol[] = wiredInterface
    ? AuthenticationProtocols.forWiredInterface()
    : AuthenticationProtocols.forWirelessInterface()

  if (!validProtocols.map(p => p.value).includes(value)) {
    throw new Error('Authentication protocol must be one of ' +
      validProtocols.map(m => m.value.toString() + ':' + m.label.toString()).join(', '))
  }
  return true
}
