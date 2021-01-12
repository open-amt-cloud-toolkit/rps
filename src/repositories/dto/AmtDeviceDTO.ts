/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: object to store Amt device info into a db
 * Author: Brian Osburn
 **********************************************************************/

export class AMTDeviceDTO {
  guid: string
  name: string
  mpsuser: string
  mpspass: string
  amtuser: string
  amtpass: string
  mebxpass: string

  constructor (guid: string, name: string, mpsuser: string, mpspass: string, amtuser: string, amtpassword: string, mebxpass: string) {
    this.guid = guid
    this.name = name
    this.mpsuser = mpsuser
    this.mpspass = mpspass
    this.amtuser = amtuser
    this.amtpass = amtpassword
    this.mebxpass = mebxpass
  }
}
