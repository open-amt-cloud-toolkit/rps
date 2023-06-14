/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import {
  doneFail,
  doneSuccess,
  StatusFailed,
  StatusSuccess
} from './doneResponse'

const taskName = 'syncTestSomething'
it('should create a successful response with detail', () => {
  const detail = 'something succeeded successfully'
  const rsp = doneSuccess(taskName, detail)
  expect(rsp.status).toEqual(StatusSuccess)
  expect(rsp.taskName).toEqual(taskName)
  expect(rsp.message).toEqual(detail)
})
it('should create a successful response with no detail', () => {
  const rsp = doneSuccess(taskName)
  expect(rsp.status).toEqual(StatusSuccess)
  expect(rsp.taskName).toEqual(taskName)
  expect(rsp.message).toBeFalsy()
})
it('should create a failed response with detail', () => {
  const msg = 'something failed failfully'
  const rsp = doneFail(taskName, msg)
  expect(rsp.status).toEqual(StatusFailed)
  expect(rsp.taskName).toEqual(taskName)
  expect(rsp.message).toEqual(msg)
})
it('should create a failed response with detail', () => {
  const rsp = doneFail(taskName)
  expect(rsp.status).toEqual(StatusFailed)
  expect(rsp.taskName).toEqual(taskName)
  expect(rsp.message).toBeFalsy()
})
