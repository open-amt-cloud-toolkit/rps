/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type Request } from 'express'
import { check, type ValidationChain } from 'express-validator'
import { ClientAction } from '../../../models/RCS.Config'
import { AMTUserConsent } from '../../../models'

export const amtProfileValidator = (): ValidationChain[] => [
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
    .withMessage(`Activation accepts either ${ClientAction.ADMINCTLMODE} (admin control activation) or ${ClientAction.CLIENTCTLMODE} (client control mode activation)`)
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
          throw new Error(`MEBx Password is required for ${ClientAction.ADMINCTLMODE}`)
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
  check('tlsMode')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 4 })
    .withMessage('tlsMode must be set to one of these values: 1 (Server Authentication Only), 2 (Server and Non-TLS Authentication), 3 (Mutual TLS only), 4 (Mutual and Non-TLS authentication)'),
  check('ciraConfigName')
    .optional({ nullable: true })
    .custom((value, { req }) => {
      if (req.body.tlsMode != null) {
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
      if (value.length > 8) {
        throw new Error('A maximum of 8 wifi profiles can be stored at a time.')
      }
      for (const config of value) {
        // priority is uint8 on AMT, but api doesn't accept 0 because some profiles exists with O priority by default on some devices
        if (Number.isInteger(config.priority) && (config.priority < 1 || config.priority > 255)) {
          throw new Error('wifi config priority should be an integer and between 1 and 255')
        }
      }
      const wifiConfigs = await validatewifiConfigs(value, req as Request)
      if (wifiConfigs.length > 0) {
        throw new Error(`wifi configs ${wifiConfigs.toString()} does not exists in db`)
      }
    }),
  check('userConsent')
    .optional({ nullable: true })
    .isIn(Object.values(AMTUserConsent))
    .withMessage(`User consent must be one of ${Object.values(AMTUserConsent)}`)
    .custom((value, { req }) => {
      const activation = req.body.activation
      if ((activation === ClientAction.CLIENTCTLMODE && value !== AMTUserConsent.ALL)) {
        throw new Error('User consent is required for all the actions in client control mode')
      }
      return true
    }),
  check('iderEnabled')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('IDER enabled must be a boolean'),
  check('kvmEnabled')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('KVM enabled must be a boolean'),
  check('solEnabled')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('Serial Over Lan (sol) enabled must be a boolean')
]

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

export const profileUpdateValidator = (): any => [
  check('profileName')
    .not()
    .isEmpty()
    .withMessage('AMT profile name is required')
    .matches('^[a-zA-Z0-9$@$!%*#?&-_~^]+$')
    .withMessage('AMT profile name accepts letters, numbers, special characters and no spaces'),
  check('activation')
    .isIn([ClientAction.ADMINCTLMODE, ClientAction.CLIENTCTLMODE])
    .withMessage(`Activation accepts either ${ClientAction.ADMINCTLMODE} (admin control activation) or ${ClientAction.CLIENTCTLMODE} (client control mode activation)`)
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
          throw new Error(`MEBx Password is required for ${ClientAction.ADMINCTLMODE}`)
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
  check('tlsMode')
    .optional({ nullable: true })
    .isInt({ min: 1, max: 4 })
    .withMessage('tlsMode must be set to one of these values: 1 (Server Authentication Only), 2 (Server and Non-TLS Authentication), 3 (Mutual TLS only), 4 (Mutual and Non-TLS authentication)'),
  check('ciraConfigName')
    .optional({ nullable: true })
    .custom((value, { req }) => {
      if (req.body.tlsMode != null) {
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
      if (value.length > 8) {
        throw new Error('A maximum of 8 wifi profiles can be stored at a time.')
      }
      for (const config of value) {
        if (Number.isInteger(config.priority) && (config.priority < 1 || config.priority > 255)) {
          throw new Error('wifi config priority should be an integer and between 1 and 255')
        }
      }
      const wifiConfigs = await validatewifiConfigs(value, req as Request)
      if (wifiConfigs.length > 0) {
        throw new Error(`wifi configs ${wifiConfigs.toString()} does not exists in db`)
      }
    }),
  check('userConsent')
    .optional({ nullable: true })
    .isIn(Object.values(AMTUserConsent))
    .withMessage(`User consent must be one of ${Object.values(AMTUserConsent)}`)
    .custom((value, { req }) => {
      const activation = req.body.activation
      if ((activation === ClientAction.CLIENTCTLMODE && value !== AMTUserConsent.ALL)) {
        throw new Error('User consent is required for all the actions in client control mode')
      }
      return true
    }),
  check('iderEnabled')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('IDER enabled must be a boolean'),
  check('kvmEnabled')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('KVM enabled must be a boolean'),
  check('solEnabled')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('Serial Over Lan (sol) enabled must be a boolean')
]
