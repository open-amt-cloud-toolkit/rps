/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { VersionChecker } from './VersionChecker'
import { Version } from './models'
import { RPSError } from './utils/RPSError'
test('test version string parsing', () => {
  const versionString: string = '1.2.3'

  const result: Version = VersionChecker.parseString(versionString)

  expect(result.major).toBe(1)
  expect(result.minor).toBe(2)
  expect(result.revision).toBe(3)
})

test('test version string parsing with format x.x', () => {
  const versionString: string = '1.2'

  const result: Version = VersionChecker.parseString(versionString)

  expect(result.major).toBe(1)
  expect(result.minor).toBe(2)
  expect(result.revision).toBe(0)
})

test('test version string parsing with format x', () => {
  const versionString: string = '1'

  const result: Version = VersionChecker.parseString(versionString)

  expect(result.major).toBe(1)
  expect(result.minor).toBe(0)
  expect(result.revision).toBe(0)
})

test('test version string parsing empty exception', () => {
  const versionString: string = ''
  let rpsError

  try {
    VersionChecker.parseString(versionString)
  } catch (error) {
    rpsError = error
  }

  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toEqual(
    'version must be defined'
  )
})

test('test version string parsing undefined exception', () => {
  let versionString: string
  let rpsError

  try {
    VersionChecker.parseString(versionString)
  } catch (error) {
    rpsError = error
  }

  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toEqual(
    'version must be defined'
  )
})

test('test version string parsing longer length', () => {
  const versionString: string = '1.2.3.4'
  let rpsError

  try {
    VersionChecker.parseString(versionString)
  } catch (error) {
    rpsError = error
  }

  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toEqual(
    'invalid version string length'
  )
})

test('test version string compatibility with older message', () => {
  const currentVersion: string = '2.0.0'
  const messageVersion: string = '1.2.3'

  VersionChecker.setCurrentVersion(currentVersion)
  const result: boolean = VersionChecker.isCompatible(messageVersion)
  expect(result).toBeFalsy()
})

test('test version string compatibility with newer message older server', () => {
  const currentVersion: string = '2.0.0'
  const messageVersion: string = '3.2.3'

  VersionChecker.setCurrentVersion(currentVersion)
  const result: boolean = VersionChecker.isCompatible(messageVersion)
  expect(result).toBeFalsy()
})

test('test version string compatibility newer minor version message', () => {
  const currentVersion: string = '2.1.3'
  const messageVersion: string = '2.2.2'

  VersionChecker.setCurrentVersion(currentVersion)
  const result: boolean = VersionChecker.isCompatible(messageVersion)
  expect(result).toBeFalsy()
})

test('test version string compatibility newer revision message', () => {
  const currentVersion: string = '2.2.3'
  const messageVersion: string = '2.2.4'

  VersionChecker.setCurrentVersion(currentVersion)
  const result: boolean = VersionChecker.isCompatible(messageVersion)
  expect(result).toBeFalsy()
})

test('test version string compatibility newer server than message', () => {
  const currentVersion: string = '2.1.2'
  const messageVersion: string = '2.0.3'

  VersionChecker.setCurrentVersion(currentVersion)
  const result: boolean = VersionChecker.isCompatible(messageVersion)
  expect(result).toBeTruthy()
})

test('test version string compatibility newer minor version', () => {
  const messageVersion: string = '2.1.3'
  const currentVersion: string = '2.2.2'

  VersionChecker.setCurrentVersion(currentVersion)
  const result: boolean = VersionChecker.isCompatible(messageVersion)
  expect(result).toBeTruthy()
})

test('test version string compatibility newer revision', () => {
  const messageVersion: string = '2.2.3'
  const currentVersion: string = '2.2.4'

  VersionChecker.setCurrentVersion(currentVersion)
  const result: boolean = VersionChecker.isCompatible(messageVersion)
  expect(result).toBeTruthy()
})

test('test version string with invalid chars', () => {
  const messageVersion: string = 'a.2.3'
  const currentVersion: string = '2.2.4'

  let rpsError
  try {
    VersionChecker.setCurrentVersion(currentVersion)
    VersionChecker.isCompatible(messageVersion)
  } catch (error) {
    rpsError = error
  }

  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toEqual(
    'failed to parse major'
  )
})

test('test version string with invalid chars', () => {
  const messageVersion: string = '2.e.3'
  const currentVersion: string = '2.2.4'

  let rpsError
  try {
    VersionChecker.setCurrentVersion(currentVersion)
    VersionChecker.isCompatible(messageVersion)
  } catch (error) {
    rpsError = error
  }

  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toEqual(
    'failed to parse minor'
  )
})

test('test version string with invalid chars', () => {
  const messageVersion: string = '2.2.t'
  const currentVersion: string = '2.2.4'

  let rpsError
  try {
    VersionChecker.setCurrentVersion(currentVersion)
    VersionChecker.isCompatible(messageVersion)
  } catch (error) {
    rpsError = error
  }

  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toEqual(
    'failed to parse revision'
  )
})
