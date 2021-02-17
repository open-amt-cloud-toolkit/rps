/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Madhavi Losetty
 **********************************************************************/
import { check } from 'express-validator'
import { ClientAction } from '../../../RCS.Config'

export const amtProfileValidator = (): any => {
  return [
    check('profileName')
      .not()
      .isEmpty()
      .withMessage('AMT profile name is required')
      .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
      .withMessage('AMT profile name accepts letters, numbers, special characters and no spaces'),
    check('activation')
      .not()
      .isEmpty()
      .withMessage('Activation is required')
      .isIn([ClientAction.ADMINCTLMODE, ClientAction.CLIENTCTLMODE])
      .withMessage('Activation accepts either acmactivate(admin control activation) or ccmactivate(client control mode activation)')
      .custom((value, { req }) => {
        const pwd = req.body.amtPassword
        const randomPwd = req.body.generateRandomPassword
        if ((pwd == null && randomPwd == null)) {
          throw new Error('Either generateRandomPassword should be enabled with amtPassword or should provide amtPassword')
        }
        if (value === ClientAction.ADMINCTLMODE) {
          const mebxPwd = req.body.mebxPassword
          const mebxRandomPwd = req.body.generateRandomMEBxPassword
          if ((mebxPwd == null && mebxRandomPwd == null)) {
            throw new Error('Either generateRandomMEBxPassword should be enabled with mebxPasswordLength or should provide mebxPassword')
          }
        }
        return true
      }),
    check('amtPassword')
      .optional()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('AMT password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('passwordLength')
      .optional({ nullable: true })
      .isInt({ min: 8, max: 32 })
      .withMessage('Random AMT password length value should range between 8 and 32'),
    check('generateRandomPassword')
      .optional()
      .isBoolean()
      .withMessage('Generate random AMT password must be a boolean true or false')
      .custom((value, { req }) => {
        const pwd = req.body.amtPassword
        const pwdLength = req.body.passwordLength
        if (value === true) {
          if (pwd !== undefined) {
            throw new Error('Either generateRandomMEBxPassword should be enabled with mebxPasswordLength or should provide mebxPassword')
          }
          if (pwdLength == null) {
            throw new Error('If generate random AMT password is enabled, passwordLength is mandatory')
          }
        } else {
          if (pwd == null) {
            throw new Error('If generate random AMT password is disabled, amtPassword is mandatory')
          } else if (pwdLength != null) {
            throw new Error('If generate random AMT password is disabled, passwordLength is not necessary')
          }
        }
        return true
      }),
    check('mebxPassword')
      .optional()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('MEBx password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('mebxPasswordLength')
      .optional({ nullable: true })
      .isInt({ min: 8, max: 32 })
      .withMessage('Random MEBx password length value should range between 8 and 32'),
    check('generateRandomMEBxPassword')
      .optional()
      .isBoolean()
      .withMessage('Generate random MEBx password must be a boolean true or false')
      .custom((value, { req }) => {
        const pwd = req.body.mebxPassword
        const pwdLength = req.body.mebxPasswordLength
        const activationMode = req.body.activation
        if (activationMode === ClientAction.ADMINCTLMODE) {
          if (value === true) {
            if (pwd != null) {
              throw new Error('Either generate MEBx password should be enabled with random MEBx password length or should provide MEBx password, but not both')
            }
            if (pwdLength == null) {
              throw new Error('If generate random MEBx password is enabled, mebxPasswordLength is mandatory')
            }
          } else {
            if (pwd == null) {
              throw new Error('If generate random MEBx password is disabled, amtPassword is mandatory')
            } else if (pwdLength != null) {
              throw new Error('If generate random MEBx password is disabled, mebxPasswordLength is not necessary')
            }
          }
        }
        return true
      }),
    check('ciraConfigName').optional(),
    check('networkConfigName').optional()
  ]
}

export const profileUpdateValidator = (): any => {
  return [
    check('profileName')
      .not()
      .isEmpty()
      .withMessage('AMT profile name is required')
      .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
      .withMessage('AMT profile name accepts letters, numbers, special characters and no spaces'),
    check('activation')
      .optional()
      .isIn([ClientAction.ADMINCTLMODE, ClientAction.CLIENTCTLMODE])
      .withMessage('Activation accepts either acmactivate(admin control activation) or ccmactivate(client control mode activation)')
      .custom((value, { req }) => {
        // if (typeof value !== 'string') {
        //   throw new Error('MPS Port value should range between 1024 and 49151')
        // }
        if (value === ClientAction.ADMINCTLMODE) {
          const mebxPwd = req.body.mebxPassword
          const mebxRandomPwd = req.body.generateRandomMEBxPassword
          if ((mebxPwd == null && mebxRandomPwd == null)) {
            throw new Error('Either generateRandomMEBxPassword should be enabled with mebxPasswordLength or should provide mebxPassword')
          }
        }
        return true
      }),
    check('amtPassword')
      .optional()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('AMT password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('passwordLength')
      .optional()
      .isInt({ min: 8, max: 32 })
      .withMessage('Random AMT password length value should range between 8 and 32'),
    check('generateRandomPassword')
      .optional()
      .isBoolean()
      .withMessage('Generate random AMT password must be a boolean true or false')
      .custom((value, { req }) => {
        const pwdLength = req.body.passwordLength
        if (value === true) {
          if (pwdLength == null) {
            throw new Error('If generate random AMT password is enabled, passwordLength is mandatory')
          }
        }
        return true
      }),
    check('mebxPassword')
      .optional()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('MEBx password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('mebxPasswordLength')
      .optional()
      .isInt({ min: 8, max: 32 })
      .withMessage('Random MEBx password length value should range between 8 and 32'),
    check('generateRandomMEBxPassword')
      .optional()
      .isBoolean()
      .withMessage('Generate random MEBx password must be a boolean true or false')
      .custom((value, { req }) => {
        const pwd = req.body.mebxPassword
        const pwdLength = req.body.mebxPasswordLength
        const activationMode = req.body.activation
        if (activationMode === ClientAction.ADMINCTLMODE) {
          if (value === true) {
            if (pwd != null) {
              throw new Error('Either generate MEBx password should be enabled with random MEBx password length or should provide MEBx password, but not both')
            }
            if (pwdLength == null) {
              throw new Error('If generate random MEBx password is enabled, mebxPasswordLength is mandatory')
            }
          } else {
            if (pwd == null) {
              throw new Error('If generate random MEBx password is disabled, amtPassword is mandatory')
            } else if (pwdLength != null) {
              throw new Error('If generate random MEBx password is disabled, mebxPasswordLength is not necessary')
            }
          }
        }
        return true
      }),
    check('ciraConfigName').optional(),
    check('networkConfigName').optional()
  ]
}
