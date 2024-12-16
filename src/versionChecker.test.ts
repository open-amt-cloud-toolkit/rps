/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { VersionChecker } from './VersionChecker.js'
import { type Version } from './models/index.js'
import { RPSError } from './utils/RPSError.js'
test('test version string parsing', () => {
  const versionString = '1.2.3'

  const result: Version = VersionChecker.parseString(versionString)

  expect(result.major).toBe(1)
  expect(result.minor).toBe(2)
  expect(result.revision).toBe(3)
})

test('test version string parsing with format x.x', () => {
  const versionString = '1.2'

  const result: Version = VersionChecker.parseString(versionString)

  expect(result.major).toBe(1)
  expect(result.minor).toBe(2)
  expect(result.revision).toBe(0)
})

test('test version string parsing with format x', () => {
  const versionString = '1'

  const result: Version = VersionChecker.parseString(versionString)

  expect(result.major).toBe(1)
  expect(result.minor).toBe(0)
  expect(result.revision).toBe(0)
})

test('test version string parsing empty exception', () => {
  const versionString = ''
  let rpsError

  try {
    VersionChecker.parseString(versionString)
  } catch (error) {
    rpsError = error
  }

  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toEqual('version must be defined')
})

test('test version string parsing undefined exception', () => {
  const versionString: string | null = null
  let rpsError

  try {
    VersionChecker.parseString(versionString as any)
  } catch (error) {
    rpsError = error
  }

  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toEqual('version must be defined')
})

test('test version string parsing longer length', () => {
  const versionString = '1.2.3.4'
  let rpsError

  try {
    VersionChecker.parseString(versionString)
  } catch (error) {
    rpsError = error
  }

  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toEqual('invalid version string length')
})

test('test version string compatibility with older message', () => {
  const currentVersion = '2.0.0'
  const messageVersion = '1.2.3'

  VersionChecker.setCurrentVersion(currentVersion)
  const result: boolean = VersionChecker.isCompatible(messageVersion)
  expect(result).toBeFalsy()
})

test('test version string compatibility with newer message older server', () => {
  const currentVersion = '2.0.0'
  const messageVersion = '3.2.3'

  VersionChecker.setCurrentVersion(currentVersion)
  const result: boolean = VersionChecker.isCompatible(messageVersion)
  expect(result).toBeFalsy()
})

test('test version string compatibility newer minor version message', () => {
  const currentVersion = '2.1.3'
  const messageVersion = '2.2.2'

  VersionChecker.setCurrentVersion(currentVersion)
  const result: boolean = VersionChecker.isCompatible(messageVersion)
  expect(result).toBeFalsy()
})

test('test version string compatibility newer revision message', () => {
  const currentVersion = '2.2.3'
  const messageVersion = '2.2.4'

  VersionChecker.setCurrentVersion(currentVersion)
  const result: boolean = VersionChecker.isCompatible(messageVersion)
  expect(result).toBeFalsy()
})

test('test version string compatibility newer server than message', () => {
  const currentVersion = '2.1.2'
  const messageVersion = '2.0.3'

  VersionChecker.setCurrentVersion(currentVersion)
  const result: boolean = VersionChecker.isCompatible(messageVersion)
  expect(result).toBeTruthy()
})

test('test version string compatibility newer minor version', () => {
  const messageVersion = '2.1.3'
  const currentVersion = '2.2.2'

  VersionChecker.setCurrentVersion(currentVersion)
  const result: boolean = VersionChecker.isCompatible(messageVersion)
  expect(result).toBeTruthy()
})

test('test version string compatibility newer revision', () => {
  const messageVersion = '2.2.3'
  const currentVersion = '2.2.4'

  VersionChecker.setCurrentVersion(currentVersion)
  const result: boolean = VersionChecker.isCompatible(messageVersion)
  expect(result).toBeTruthy()
})

test('test version string with invalid chars', () => {
  const messageVersion = 'a.2.3'
  const currentVersion = '2.2.4'

  let rpsError
  try {
    VersionChecker.setCurrentVersion(currentVersion)
    VersionChecker.isCompatible(messageVersion)
  } catch (error) {
    rpsError = error
  }

  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toEqual('failed to parse major')
})

test('test version string with invalid chars', () => {
  const messageVersion = '2.e.3'
  const currentVersion = '2.2.4'

  let rpsError
  try {
    VersionChecker.setCurrentVersion(currentVersion)
    VersionChecker.isCompatible(messageVersion)
  } catch (error) {
    rpsError = error
  }

  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toEqual('failed to parse minor')
})

test('test version string with invalid chars', () => {
  const messageVersion = '2.2.t'
  const currentVersion = '2.2.4'

  let rpsError
  try {
    VersionChecker.setCurrentVersion(currentVersion)
    VersionChecker.isCompatible(messageVersion)
  } catch (error) {
    rpsError = error
  }

  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toEqual('failed to parse revision')
})
