/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export class RPSError extends Error {
  errorName: string
  item: any
  constructor (message: string, errorName?: string, item?: any) {
    super(message)
    if (errorName) {
      this.name = errorName
    }
    if (item) {
      this.item = item
    }
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, RPSError.prototype)
  }
}
