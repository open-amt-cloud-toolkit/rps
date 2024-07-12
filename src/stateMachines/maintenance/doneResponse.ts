/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export type StatusType = 'SUCCESS' | 'FAILED'
export const StatusSuccess: StatusType = 'SUCCESS'
export const StatusFailed: StatusType = 'FAILED'

export interface DoneResponse {
  taskName: string
  status: StatusType
  message: string
}

export const doneSuccess = function (taskName: string, detail = ''): DoneResponse {
  return { taskName, status: StatusSuccess, message: detail }
}
export const doneFail = function (taskName: string, detail = ''): DoneResponse {
  return { taskName, status: StatusFailed, message: detail }
}
