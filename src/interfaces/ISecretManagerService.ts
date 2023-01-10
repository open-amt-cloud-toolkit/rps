/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { CertCreationResult } from '../models'

export interface DeviceCredentials {
  AMT_PASSWORD: string
  MPS_PASSWORD?: string // only required for CIRA
  MEBX_PASSWORD: string
  version?: string
}

export interface WifiCredentials {
  PSK_PASSPHRASE: string
  version?: string
}

export interface TLSCredentials {
  ISSUED_CERTIFICATE: CertCreationResult
  ROOT_CERTIFICATE: CertCreationResult
  version?: string
}

// these credentials refer to the domain provisioning cert
export interface CertCredentials {
  CERT: string
  CERT_PASSWORD: string
  version?: string
}

export interface ISecretManagerService {
  getSecretFromKey: (path: string, key: string) => Promise<string>
  getSecretAtPath: (path: string) => Promise<DeviceCredentials | WifiCredentials | TLSCredentials | CertCredentials>
  writeSecretWithObject: (path: string, data: DeviceCredentials | WifiCredentials | TLSCredentials | CertCredentials) => Promise<any>
  deleteSecretAtPath: (path: string) => Promise<boolean>
  health: () => Promise<any>
}
