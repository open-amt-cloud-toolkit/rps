/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Madhavi Losetty
 **********************************************************************/
import { check } from 'express-validator'

export const networkValidator = (): any => {
  return [
    check('profileName')
      .not()
      .isEmpty()
      .withMessage('Network profile name is required')
      .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
      .withMessage('Network profile name accepts letters, numbers, special characters and no spaces'),
    check('dhcpEnabled')
      .not()
      .isEmpty()
      .withMessage('dhcpEnabled is required')
      .isBoolean()
      .withMessage('Must be a boolean, true or false')
  ]
}
