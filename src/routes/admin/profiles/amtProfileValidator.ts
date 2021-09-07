/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { Request } from 'express'
import { check, ValidationChain } from 'express-validator'
import { ClientAction, ProfileWifiConfigs } from '../../../RCS.Config'

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
        if (value === ClientAction.ADMINCTLMODE) {
          if ((req.body.mebxPassword == null)) {
            throw new Error('MEBx Password is required for acmactivate')
          }
        }
        return true
      }),
    check('amtPassword')
      .not()
      .isEmpty()
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('AMT password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('mebxPassword')
      .optional({ nullable: true })
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('MEBx password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
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
      .optional()
      .isIn([ClientAction.ADMINCTLMODE, ClientAction.CLIENTCTLMODE])
      .withMessage('Activation accepts either acmactivate(admin control activation) or ccmactivate(client control mode activation)')
      .custom((value, { req }) => {
        if (value === ClientAction.ADMINCTLMODE) {
          if (req.body.mebxPassword == null) {
            throw new Error('MEBx Password is required for acmactivate')
          }
        }
        return true
      }),
    check('amtPassword')
      .optional({ nullable: true })
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('AMT password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
    check('mebxPassword')
      .optional({ nullable: true })
      .matches('^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9$@$!%*#?&-_~^]{8,32}$')
      .withMessage('MEBx password is required field should contains at least one lowercase letter, one uppercase letter, one numeric digit,and one special character and password length should be in between 8 to 32.'),
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
        const wifiConfigs = await validatewifiConfigs(value, req as Request)
        if (wifiConfigs.length > 0) {
          throw new Error(`wifi configs ${wifiConfigs.toString()} does not exists in db`)
        }
      })
  ]
}
