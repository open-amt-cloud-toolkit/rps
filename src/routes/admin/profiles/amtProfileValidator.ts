/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Madhavi Losetty
 **********************************************************************/
import { check } from 'express-validator'
import { WirelessConfigDbFactory } from '../../../repositories/factories/WirelessConfigDbFactory'
import { IWirelessProfilesDb } from '../../../repositories/interfaces/IWirelessProfilesDB'
import { ClientAction, ProfileWifiConfigs } from '../../../RCS.Config'

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
      .if((value, { req }) => req.body.generateRandomPassword === false)
      .optional()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('AMT password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('passwordLength')
      .if((value, { req }) => req.body.generateRandomPassword === true)
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
          if (pwd != null) {
            throw new Error('Either generate Random AMT Password should be enabled with Password Length or should provide AMT Password')
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
      .if((value, { req }) => req.body.generateRandomMEBxPassword === false)
      .optional({ nullable: true })
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('MEBx password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('mebxPasswordLength')
      .if((value, { req }) => req.body.generateRandomMEBxPassword === true)
      .optional({ nullable: true })
      .isInt({ min: 8, max: 32 })
      .withMessage('Random MEBx password length value should range between 8 and 32'),
    check('generateRandomMEBxPassword')
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
    check('ciraConfigName')
      .optional({ nullable: true })
      .custom((value, { req }) => {
        if (!req.body.dhcpEnabled) {
          throw new Error('CIRA cannot be configured if DHCP is disabled')
        }
        return true
      }),
    check('tags').optional({ nullable: true }).isArray(),
    check('dhcpEnabled')
      .not()
      .isEmpty()
      .isBoolean()
      .withMessage('DHCP enabled must be a boolean'),
    check('wifiConfigs')
      .optional({ nullable: true })
      .isArray()
      .custom(async (value, { req }) => {
        if (!req.body.dhcpEnabled && value?.length > 0) {
          throw new Error('Wifi supports only DHCP in AMT')
        }
        const priorities = new Set(value.map((config: ProfileWifiConfigs) => {
          if (Number.isInteger(config.priority) && (config.priority < 1 || config.priority > 255)) {
            throw new Error('wifi config priority should be an integer and between 1 and 255')
          }
          return config.priority
        }))
        if ([...priorities].length !== value.length) {
          throw new Error('wifi config priority should be unique')
        }
        const wifiConfigs = await validatewifiConfigs(value)
        if (wifiConfigs.length > 0) {
          throw new Error(`wifi configs ${wifiConfigs.toString()} does not exists in db`)
        }
      })
  ]
}

const validatewifiConfigs = async (value: any): Promise<string[]> => {
  const profilesDb: IWirelessProfilesDb = WirelessConfigDbFactory.getConfigDb()
  const wifiConfigNames = []
  for (const config of value) {
    const iswifiExist = await profilesDb.checkProfileExits(config.profileName)
    if (!iswifiExist) {
      wifiConfigNames.push(config.profileName)
    }
  }
  return wifiConfigNames
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
      .if((value, { req }) => req.body.generateRandomPassword === false)
      .optional()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('AMT password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('passwordLength')
      .if((value, { req }) => req.body.generateRandomPassword === true)
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
      .if((value, { req }) => req.body.generateRandomMEBxPassword === false)
      .optional({ nullable: true })
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('MEBx password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('mebxPasswordLength')
      .if((value, { req }) => req.body.generateRandomMEBxPassword === true)
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
    check('ciraConfigName')
      .optional({ nullable: true })
      .custom((value, { req }) => {
        if (!req.body.dhcpEnabled) {
          throw new Error('CIRA cannot be configured if DHCP is disabled')
        }
        return true
      }),
    check('tags').optional({ nullable: true }).isArray(),
    check('dhcpEnabled')
      .optional()
      .isBoolean()
      .withMessage('DHCP enabled must be a boolean'),
    check('wifiConfigs')
      .optional({ nullable: true })
      .isArray()
      .custom(async (value, { req }) => {
        if (value?.length > 0 && req.body.dhcpEnabled == null) {
          throw new Error('DHCP enabled should be true')
        } else if (!req.body.dhcpEnabled && value?.length > 0) {
          throw new Error('Wifi supports only DHCP in AMT')
        }
        const priorities = new Set(value.map((config: ProfileWifiConfigs) => {
          if (Number.isInteger(config.priority) && (config.priority < 1 || config.priority > 255)) {
            throw new Error('wifi config priority should be an integer and between 1 and 255')
          }
          return config.priority
        }))
        if ([...priorities].length !== value.length) {
          throw new Error('wifi config priority should be unique')
        }
        const wifiConfigs = await validatewifiConfigs(value)
        if (wifiConfigs.length > 0) {
          throw new Error(`wifi configs ${wifiConfigs.toString()} does not exists in db`)
        }
      })
  ]
}
