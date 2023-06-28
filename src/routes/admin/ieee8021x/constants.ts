/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export interface FormOption<T> {
  value: T
  label: string
}

export type AuthenticationProtocol = FormOption<number>

export const AuthenticationProtocols = {
  EAP_TLS: { value: 0, label: 'EAP-TLS' },
  EAP_TTLS_MSCHAPv2: { value: 1, label: 'EAP-TTLS/MSCHAPv2' },
  PEAP_MSCHAPv2: { value: 2, label: 'PEAPv0/EAP-MSCHAPv2' },
  PEAP_GTC: { value: 3, label: 'PEAPv1/EAP-GTC' },
  EAP_FAST_MSCHAPv2: { value: 4, label: 'EAP-FAST/MSCHAPv2' },
  EAP_FAST_GTC: { value: 5, label: 'EAP-FAST/GTC' },
  EAP_MD5: { value: 6, label: 'EAP-MD5 ' },
  EAP_PSK: { value: 7, label: 'EAP-PSK ' },
  EAP_SIM: { value: 8, label: 'EAP-SIM ' },
  EAP_AKA: { value: 9, label: 'EAP-AKA ' },
  EAP_FAST_TLS: { value: 10, label: 'EAP-FAST/TLS' },
  labelForValue (value: number): string {
    return this.all().filter(p => p.value === value).map(p => p.label)[0]
  },
  all (): AuthenticationProtocol[] {
    return [
      this.EAP_TLS,
      this.EAP_TTLS_MSCHAPv2,
      this.PEAP_MSCHAPv2,
      this.PEAP_GTC,
      this.EAP_FAST_MSCHAPv2,
      this.EAP_FAST_GTC,
      this.EAP_MD5,
      this.EAP_PSK,
      this.EAP_SIM,
      this.EAP_AKA,
      this.EAP_FAST_TLS
    ]
  },
  forWiredInterface (): AuthenticationProtocol[] {
    return [
      this.EAP_TLS,
      this.PEAP_GTC,
      this.EAP_FAST_GTC,
      this.EAP_FAST_TLS,
      this.PEAP_MSCHAPv2
    ]
  },
  forWirelessInterface (): AuthenticationProtocol[] {
    return [
      this.EAP_TLS,
      this.PEAP_MSCHAPv2
    ]
  }
}
