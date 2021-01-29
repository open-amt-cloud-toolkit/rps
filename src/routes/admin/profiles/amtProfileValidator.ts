/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Madhavi Losetty
 **********************************************************************/
import { check } from 'express-validator'

export const amtProfileValidator = (): any => {
  return [
    check('payload.profileName')
      .not()
      .isEmpty()
      .withMessage('AMT profile name is required')
      .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
      .withMessage('AMT profile name accepts letters, numbers, special characters and no spaces'),
    check('payload.activation')
      .not()
      .isEmpty()
      .withMessage('Activation is required')
      .isIn(['acmactivate', 'ccmactivate'])
      .withMessage('Activation accepts either acmactivate(admin control activation) or ccmactivate(client control mode activation)')
      .custom((value, { req }) => {
        const pwd = req.body.payload.amtPassword
        const randomPwd = req.body.payload.generateRandomPassword
        if ((pwd === undefined && randomPwd === undefined)) {
          throw new Error('Either payload.generateRandomPassword should be enabled with payload.amtPassword or should provide payload.amtPassword')
        }
        if (value === 'acmactivate') {
          const mebxPwd = req.body.payload.mebxPassword
          const mebxRandomPwd = req.body.payload.generateRandomMEBxPassword
          if ((mebxPwd === undefined && mebxRandomPwd === undefined)) {
            throw new Error('Either payload.generateRandomMEBxPassword should be enabled with payload.mebxPasswordLength or should provide payload.mebxPassword')
          }
        }
        return true
      }),
    check('payload.amtPassword')
      .optional()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('AMT password is required field should contains atleast one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('payload.passwordLength')
      .optional()
      .isInt({ min: 8, max: 32 })
      .withMessage('Random AMT password length value should range between 8 and 32'),
    check('payload.generateRandomPassword')
      .optional()
      .isBoolean()
      .withMessage('Generate random AMT password must be a boolean true or false')
      .custom((value, { req }) => {
        const pwd = req.body.payload.amtPassword
        const pwdLength = req.body.payload.passwordLength
        if (value === true) {
          if (pwd !== undefined) {
            throw new Error('Either payload.generateRandomMEBxPassword should be enabled with payload.mebxPasswordLength or should provide payload.mebxPassword')
          }
          if (pwdLength == null) {
            throw new Error('If generate random AMT password is enabled, payload.passwordLength is mandatory')
          }
        } else {
          if (pwd == null) {
            throw new Error('If generate random AMT password is disabled, payload.amtPassword is mandatory')
          } else if (pwdLength != null) {
            throw new Error('If generate random AMT password is disabled, payload.passwordLength is not necessary')
          }
        }
        return true
      }),
    check('payload.mebxPassword')
      .optional()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('MEBx password is required field should contains atleast one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('payload.mebxPasswordLength')
      .optional()
      .isInt({ min: 8, max: 32 })
      .withMessage('Random MEBx password length value should range between 8 and 32'),
    check('payload.generateRandomMEBxPassword')
      .optional()
      .isBoolean()
      .withMessage('Generate random MEBx password must be a boolean true or false')
      .custom((value, { req }) => {
        const pwd = req.body.payload.mebxPassword
        const pwdLength = req.body.payload.mebxPasswordLength
        const activationMode = req.body.payload.activation
        if (activationMode === 'acmactivate') {
          if (value === true) {
            if (pwd !== undefined) {
              throw new Error('Either generate MEBx password should be enabled with random MEBx password length or should provide MEBx password, but not both')
            }
            if (pwdLength === undefined) {
              throw new Error('If generate random MEBx password is enabled, payload.mebxPasswordLength is mandatory')
            }
          } else {
            if (pwd === undefined) {
              throw new Error('If generate random MEBx password is disabled, payload.amtPassword is mandatory')
            } else if (pwdLength !== undefined) {
              throw new Error('If generate random MEBx password is disabled, payload.mebxPasswordLength is not necessary')
            }
          }
        }
        return true
      }),
    check('payload.ciraConfigName').optional(),
    check('payload.networkConfigName').optional()
  ]
}

export const ProfileupdateValidator = (): any => {
  return [
    check('payload.profileName')
      .not()
      .isEmpty()
      .withMessage('AMT profile name is required')
      .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
      .withMessage('AMT profile name accepts letters, numbers, special characters and no spaces'),
    check('payload.activation')
      .optional()
      .isIn(['acmactivate', 'ccmactivate'])
      .withMessage('Activation accepts either acmactivate(admin control activation) or ccmactivate(client control mode activation)')
      .custom((value, { req }) => {
        // if (typeof value !== 'string') {
        //   throw new Error('MPS Port value should range between 1024 and 49151')
        // }
        if (value === 'acmactivate') {
          const mebxPwd = req.body.payload.mebxPassword
          const mebxRandomPwd = req.body.payload.generateRandomMEBxPassword
          if ((mebxPwd === undefined && mebxRandomPwd === undefined)) {
            throw new Error('Either payload.generateRandomMEBxPassword should be enabled with payload.mebxPasswordLength or should provide payload.mebxPassword')
          }
        }
        return true
      }),
    check('payload.amtPassword')
      .optional()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('AMT password is required field should contains atleast one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('payload.passwordLength')
      .optional()
      .isInt({ min: 8, max: 32 })
      .withMessage('Random AMT password length value should range between 8 and 32'),
    check('payload.generateRandomPassword')
      .optional()
      .isBoolean()
      .withMessage('Generate random AMT password must be a boolean true or false')
      .custom((value, { req }) => {
        const pwdLength = req.body.payload.passwordLength
        if (value === true) {
          if (pwdLength == null) {
            throw new Error('If generate random AMT password is enabled, payload.passwordLength is mandatory')
          }
        }
        return true
      }),
    check('payload.mebxPassword')
      .optional()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('MEBx password is required field should contains atleast one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('payload.mebxPasswordLength')
      .optional()
      .isInt({ min: 8, max: 32 })
      .withMessage('Random MEBx password length value should range between 8 and 32'),
    check('payload.generateRandomMEBxPassword')
      .optional()
      .isBoolean()
      .withMessage('Generate random MEBx password must be a boolean true or false')
      .custom((value, { req }) => {
        const pwd = req.body.payload.mebxPassword
        const pwdLength = req.body.payload.mebxPasswordLength
        const activationMode = req.body.payload.activation
        if (activationMode === 'acmactivate') {
          if (value === true) {
            if (pwd !== undefined) {
              throw new Error('Either generate MEBx password should be enabled with random MEBx password length or should provide MEBx password, but not both')
            }
            if (pwdLength === undefined) {
              throw new Error('If generate random MEBx password is enabled, payload.mebxPasswordLength is mandatory')
            }
          } else {
            if (pwd === undefined) {
              throw new Error('If generate random MEBx password is disabled, payload.amtPassword is mandatory')
            } else if (pwdLength !== undefined) {
              throw new Error('If generate random MEBx password is disabled, payload.mebxPasswordLength is not necessary')
            }
          }
        }
        return true
      }),
    check('payload.ciraConfigName').optional(),
    check('payload.networkConfigName').optional()
  ]
}
