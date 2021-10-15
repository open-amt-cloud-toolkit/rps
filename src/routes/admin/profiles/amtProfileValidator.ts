/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { Request } from 'express'
import { check, ValidationChain } from 'express-validator'
import { ClientAction, ProfileWifiConfigs } from '../../../models/RCS.Config'

export const amtProfileValidator = (): ValidationChain[] => {
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
        if ((pwd == null && !randomPwd)) {
          throw new Error('Either generateRandomPassword should be enabled or provide amtPassword')
        }
        const mebxPwd = req.body.mebxPassword
        const mebxRandomPwd = req.body.generateRandomMEBxPassword
        if (value === ClientAction.ADMINCTLMODE) {
          if (mebxPwd == null && !mebxRandomPwd) {
            throw new Error('MEBx Password is required for acmactivate')
          }
        }
        return true
      }),
    check('amtPassword')
      .if((value, { req }) => req.body.generateRandomPassword === false)
      .optional()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('AMT password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('generateRandomPassword')
      .default(false)
      .isBoolean()
      .withMessage('Generate random AMT password must be a boolean true or false')
      .custom((value, { req }) => {
        const pwd = req.body.amtPassword
        if (value === true) {
          if (pwd != null) {
            throw new Error('Either generate Random AMT Password should be enabled or should provide AMT Password but not both')
          }
        } else {
          if (pwd == null) {
            throw new Error('If generate random AMT password is disabled, amtPassword is mandatory')
          }
        }
        return true
      }),
    check('mebxPassword')
      .optional({ nullable: true })
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('MEBx password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('generateRandomMEBxPassword')
      .default(false)
      .isBoolean()
      .withMessage('Generate random MEBx password must be a boolean true or false')
      .custom((value, { req }) => {
        const pwd = req.body.mebxPassword
        const activationMode = req.body.activation
        if (activationMode === ClientAction.ADMINCTLMODE) {
          if (value === true) {
            if (pwd != null) {
              throw new Error('Either generate MEBx password should be enabled or should provide MEBx password, but not both')
            }
          } else {
            if (pwd == null) {
              throw new Error('If generate random MEBx password is disabled, mebxPassword is mandatory')
            }
          }
        }
        return true
      }),
    check('tlsConfigName')
      .optional({ nullable: true }),
    check('ciraConfigName')
      .optional({ nullable: true })
      .custom((value, { req }) => {
        if (!req.body.dhcpEnabled) {
          throw new Error('CIRA cannot be configured if DHCP is disabled')
        }
        if (req.body.tlsConfigName != null) {
          throw new Error('CIRA cannot be configured if TLS is enabled')
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
        const wifiConfigs = await validatewifiConfigs(value, req as Request)
        if (wifiConfigs.length > 0) {
          throw new Error(`wifi configs ${wifiConfigs.toString()} does not exists in db`)
        }
      })
  ]
}

const validatewifiConfigs = async (value: any, req: Request): Promise<string[]> => {
  const wifiConfigNames = []
  for (const config of value) {
    const iswifiExist = await req.db.wirelessProfiles.checkProfileExits(config.profileName)
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
      .isIn([ClientAction.ADMINCTLMODE, ClientAction.CLIENTCTLMODE])
      .withMessage('Activation accepts either acmactivate(admin control activation) or ccmactivate(client control mode activation)')
      .custom((value, { req }) => {
        const pwd = req.body.amtPassword
        const randomPwd = req.body.generateRandomPassword
        if ((pwd == null && !randomPwd)) {
          throw new Error('Either generateRandomPassword should be enabled or provide amtPassword')
        }
        const mebxPwd = req.body.mebxPassword
        const mebxRandomPwd = req.body.generateRandomMEBxPassword
        if (value === ClientAction.ADMINCTLMODE) {
          if (mebxPwd == null && !mebxRandomPwd) {
            throw new Error('MEBx Password is required for acmactivate')
          }
        }
        return true
      }),
    check('amtPassword')
      .if((value, { req }) => req.body.generateRandomPassword === false)
      .optional()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('AMT password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('generateRandomPassword')
      .optional()
      .isBoolean()
      .withMessage('Generate random AMT password must be a boolean true or false')
      .custom((value, { req }) => {
        const pwd = req.body.amtPassword
        if (value === true) {
          if (pwd != null) {
            throw new Error('Either generate Random AMT Password should be enabled or should provide AMT Password but not both')
          }
        } else {
          if (pwd == null) {
            throw new Error('If generate random AMT password is disabled, amtPassword is mandatory')
          }
        }
        return true
      }),
    check('mebxPassword')
      .if((value, { req }) => req.body.generateRandomMEBxPassword === false)
      .optional({ nullable: true })
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('MEBx password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('generateRandomMEBxPassword')
      .optional()
      .isBoolean()
      .withMessage('Generate random MEBx password must be a boolean true or false')
      .custom((value, { req }) => {
        const pwd = req.body.mebxPassword
        const activationMode = req.body.activation
        if (activationMode === ClientAction.ADMINCTLMODE) {
          if (value === true) {
            if (pwd != null) {
              throw new Error('Either generate MEBx password should be enabled or should provide MEBx password, but not both')
            }
          } else {
            if (pwd == null) {
              throw new Error('If generate random MEBx password is disabled, mebxPassword is mandatory')
            }
          }
        }
        return true
      }),
    check('tlsConfigName')
      .optional({ nullable: true }),
    check('ciraConfigName')
      .optional({ nullable: true })
      .custom((value, { req }) => {
        if (!req.body.dhcpEnabled) {
          throw new Error('CIRA cannot be configured if DHCP is disabled')
        }
        if (req.body.tlsConfigName != null) {
          throw new Error('CIRA cannot be configured if TLS is enabled')
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
        const wifiConfigs = await validatewifiConfigs(value, req as Request)
        if (wifiConfigs.length > 0) {
          throw new Error(`wifi configs ${wifiConfigs.toString()} does not exists in db`)
        }
      })
  ]
}
