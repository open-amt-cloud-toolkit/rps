/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AuthenticationMethods, EncryptionMethods, type FormOption } from './constants'

describe('Test AuthenticationMethods Constants', () => {
  AuthenticationMethods.all().forEach((m: FormOption<number>) => {
    it(`should have label: ${m.label} for value: ${m.value}`, () => {
      expect(AuthenticationMethods.labelForValue(m.value)).toEqual(m.label)
    })
  })

  AuthenticationMethods.allExceptIEEE8021X().forEach((m: FormOption<number>) => {
    it(`${m.label} method should not be IEEE8021X`, () => {
      expect(AuthenticationMethods.isIEEE8021X(m.value)).toBeFalsy()
      expect(AuthenticationMethods.isPSK(m.value)).toBeTruthy()
    })
  })
})

describe('Test EncryptionMethodOpts Constants', () => {
  EncryptionMethods.all().forEach((m: FormOption<number>) => {
    it(`should have label: ${m.label} for value: ${m.value}`, () => {
      expect(EncryptionMethods.labelForValue(m.value)).toEqual(m.label)
    })
  })
})
