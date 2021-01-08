/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { PasswordHelper } from '../utils/PasswordHelper'

test('check password length', () => {
  const input: string = 'aB$1abc'
  const actual = PasswordHelper.passwordCheck(input)
  expect(actual).toBeFalsy()
})

test('check password length', () => {
  const input: string = 'aB$1abcd'
  const actual = PasswordHelper.passwordCheck(input)
  expect(actual).toBeTruthy()
})

test('check password complexity', () => {
  const input: string = 'aB11abcd'
  const actual = PasswordHelper.passwordCheck(input)
  expect(actual).toBeFalsy()
})

test('check password length', () => {
  const input: string = 'aB$1abcdefghijklmnopqrstuvwxyz123'
  const actual = PasswordHelper.passwordCheck(input)
  expect(actual).toBeFalsy()
})

test('check password length', () => {
  const input: string = 'aB$1abcdefghijklmnopqrstuvwxyz12'
  const actual = PasswordHelper.passwordCheck(input)
  expect(actual).toBeTruthy()
})

test('check password length', () => {
  const actual = PasswordHelper.generateRandomPassword(20)
  expect(actual.length).toBe(20)
})
