/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { PasswordHelper } from './PasswordHelper.js'

test('check password length 7', () => {
  const input: string = 'aB$1abc'
  const actual = PasswordHelper.passwordCheck(input)
  expect(actual).toBeFalsy()
})

test('check password length 8', () => {
  const input: string = 'aB$1abcd'
  const actual = PasswordHelper.passwordCheck(input)
  expect(actual).toBeTruthy()
})

test('check password length 33', () => {
  const input: string = 'aB$1abcdefghijklmnopqrstuvwxyz123'
  const actual = PasswordHelper.passwordCheck(input)
  expect(actual).toBeFalsy()
})

test('check password length 32', () => {
  const input: string = 'aB$1abcdefghijklmnopqrstuvwxyz12'
  const actual = PasswordHelper.passwordCheck(input)
  expect(actual).toBeTruthy()
})

test('check password generate length 20', () => {
  const actual = PasswordHelper.generateRandomPassword(20)
  expect(actual.length).toBe(20)
})

test('check password complexity weak', () => {
  const input: string = 'aB11abcd'
  const actual = PasswordHelper.passwordCheck(input)
  expect(actual).toBeFalsy()
})

test('check password complexity bad symbol &', () => {
  const input: string = 'aB&1abcd'
  const actual = PasswordHelper.passwordCheck(input)
  expect(actual).toBeFalsy()
})
