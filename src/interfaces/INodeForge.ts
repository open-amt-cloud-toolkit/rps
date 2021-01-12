/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: Interface to abstract forge package functionality
 * Author: Brian Osburn
 **********************************************************************/

export interface INodeForge {
  pkiOidsCertBag: string
  pkcs8ShroudedKeyBag: string

  pkcs12FromAsn1: (obj: any, strict?: boolean, password?: string) => any
  decode64: (encoded: string) => string
  encode64: (encode: string) => string
  asn1FromDer: (input: any, strict?: boolean) => any
  getBags: (pkcs12Pfx: any, filter: any) => any
  pkiCertificateToPem: (cert: any, maxline?: number) => string
  asn1ToDer: (obj: any) => any
  pkiCertificateToAsn1: (cert: any) => any
  sha256Create: () => any
  privateKeyToPem: (key: any, maxline?: number) => string
}
