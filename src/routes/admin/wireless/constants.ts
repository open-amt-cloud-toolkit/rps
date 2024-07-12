/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

// https://software.intel.com/sites/manageability/AMT_Implementation_and_Reference_Guide/HTMLDocuments/WS-Management_Class_Reference/CIM_WiFiEndpointSettings.htm

export interface FormOption<T> {
  value: T
  label: string
}
export type AuthenticationMethod = FormOption<number>
export const AuthenticationMethods = {
  WPA_PSK: { value: 4, label: 'WPA PSK' },
  WPA_IEEE8021X: { value: 5, label: 'WPA IEEE 802.1x' },
  WPA2_PSK: { value: 6, label: 'WPA2 PSK' },
  WPA2_IEEE8021X: { value: 7, label: 'WPA2 IEEE 802.1x' },
  labelForValue(value: number): string {
    const e = this.all().find((e) => e.value === value)
    return e ? e.label : ''
  },
  all(): AuthenticationMethod[] {
    return [
      this.WPA_PSK,
      this.WPA_IEEE8021X,
      this.WPA2_PSK,
      this.WPA2_IEEE8021X
    ]
  },
  allExceptIEEE8021X(): AuthenticationMethod[] {
    // for now, these are same as ...
    return this.all().filter((m) => m !== this.WPA_IEEE8021X && m !== this.WPA2_IEEE8021X)
  },
  isIEEE8021X(value: number): boolean {
    return value === this.WPA_IEEE8021X.value || value === this.WPA2_IEEE8021X.value
  },
  isPSK(value: number): boolean {
    return value === this.WPA_PSK.value || value === this.WPA2_PSK.value
  }
}

export type EncryptionMethod = FormOption<number>
export const EncryptionMethods = {
  TKIP: { value: 3, label: 'TKIP' },
  CCMP: { value: 4, label: 'CCMP' },
  labelForValue(value: number): string {
    const e = this.all().find((e) => e.value === value)
    return e ? e.label : ''
  },
  all(): EncryptionMethod[] {
    return [
      this.TKIP,
      this.CCMP
    ]
  }
}
