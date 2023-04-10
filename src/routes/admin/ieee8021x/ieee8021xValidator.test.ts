/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { validatePxeTimeout } from './ieee8021xValidator'

describe('Checks - ieee8021xValidator', () => {
  it('should pass', () => {
    const pxeTimeout: number = 120
    expect(validatePxeTimeout(pxeTimeout, null)).toBeTruthy()
  })
  it('should fail if pxe timeout is not a number', () => {
    const pxeTimeout: string = '123'
    expect(() => { validatePxeTimeout(pxeTimeout, null) }).toThrowError('PXE Timeout must be number')
  })
  it('should fail if pxe timeout is below range', () => {
    const pxeTimeout: number = -1
    expect(() => { validatePxeTimeout(pxeTimeout, null) }).toThrowError('PXE Timeout value should be 0 - 86400')
  })
  it('should fail if pxe timeout is above range', () => {
    const pxeTimeout: number = (60 * 60 * 24) + 1
    expect(() => { validatePxeTimeout(pxeTimeout, null) }).toThrowError('PXE Timeout value should be 0 - 86400')
  })
})
