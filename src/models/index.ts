/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type pki } from 'node-forge'
import {
  type Ieee8021xConfig,
  type CIRAConfig,
  type ProfileWifiConfigs,
  type TlsMode,
  type TlsSigningAuthority
} from './RCS.Config'

// guid: string, name: string, mpsuser: string, mpspass: string, amtuser: string, amtpassword: string, mebxpass: string) {
export interface AMTDeviceDTO {
  guid: string
  name?: string
  mpsuser?: string
  mpspass?: string
  amtuser?: string
  amtpass?: string
  mebxpass?: string
}
export interface ProvisioningCertObj {
  certChain: string[]
  privateKey: pki.PrivateKey
}
export interface AMTKeyUsage {
  /** Extension ID  */
  name: string
  /** Enables Console Usage */
  ['2.16.840.1.113741.1.2.1']: boolean
  /** Enables Agent Usage */
  ['2.16.840.1.113741.1.2.2']: boolean
  /** Enables AMT Activation Usage */
  ['2.16.840.1.113741.1.2.3']: boolean
  /** Enables TLS Usage on the Server */
  serverAuth: boolean
  /** Enables TLS Usage on the Client */
  clientAuth: boolean
  /** Enables Email Protection */
  emailProtection: boolean
  /** Enables Code Signing */
  codeSigning: boolean
  /** Enables Time Stamping */
  timeStamping: boolean
}

export interface CertAttributes {
  CN: string
  O?: string
  ST?: string
  C?: string
}

export interface CertCreationResult {
  h: any
  cert: pki.Certificate
  pem: string
  certbin: string
  privateKey: string
  privateKeyBin?: string
  checked: boolean
  key?: pki.PrivateKey
}
export interface CertsAndKeys {
  certs: pki.Certificate[]
  keys: pki.PrivateKey[]
}
export interface CertificateObject {
  pem: string
  issuer: string
  subject: string
}

export interface RPSConfig {
  vault_token: string
  vault_address: string
  secrets_path: string
  websocketport: number // no underlines to avoid breaking change
  web_port: number
  secrets_provider: string
  db_provider: string
  connection_string: string
  cors_origin: string
  cors_headers: string
  cors_methods: string
  mps_server: string
  delay_timer: number
  delay_activation_sync: number
  delay_setup_and_config_sync: number
  delay_tls_put_data_sync: number
  mqtt_address?: string
  disable_cira_domain_name?: string
  jwt_token_header: string
  jwt_tenant_property: string
}
export enum AMTRedirectionServiceEnabledStates {
  DISABLED = 32768,
  ONLY_IDER = 32769,
  ONLY_SOL = 32770,
  BOTH_IDER_SOL = 32771
}
export enum AMTUserConsent {
  NONE = 'None',
  ALL = 'All',
  KVM = 'KVM'
}
export enum AMTUserConsentValues {
  NONE = 0,
  KVM = 1,
  ALL = 4294967295
}
export function mapAMTUserConsent (e: AMTUserConsent): AMTUserConsentValues {
  switch (e) {
    case AMTUserConsent.ALL:
      return AMTUserConsentValues.ALL
    case AMTUserConsent.KVM:
      return AMTUserConsentValues.KVM
    case AMTUserConsent.NONE:
      return AMTUserConsentValues.NONE
  }
}
export enum AMTUserConsentWsmanValues {
  NONE = 'None',
  ALL = 'All',
  KVM = 'KVM'
}
export class AMTConfiguration {
  profileName?: string
  amtPassword?: string
  generateRandomPassword?: boolean
  ciraConfigName?: string
  activation: string
  mebxPassword?: string
  generateRandomMEBxPassword?: boolean
  ciraConfigObject?: CIRAConfig
  tags?: string[]
  dhcpEnabled?: boolean
  ipSyncEnabled?: boolean
  wifiConfigs?: ProfileWifiConfigs[]
  tenantId: string
  tlsMode?: TlsMode
  tlsCerts?: TLSCerts
  tlsSigningAuthority?: TlsSigningAuthority
  userConsent?: AMTUserConsent
  iderEnabled?: boolean
  kvmEnabled?: boolean
  solEnabled?: boolean
  ieee8021xProfileName?: string
  ieee8021xProfileObject?: Ieee8021xConfig
  version?: string
}

export interface TLSCerts {
  ROOT_CERTIFICATE: CertCreationResult
  ISSUED_CERTIFICATE: CertCreationResult
  version?: string
}

export class DataWithCount {
  data: any[]
  totalCount: number
}

export class AMTDomain {
  profileName: string
  domainSuffix: string
  provisioningCert: string
  provisioningCertStorageFormat: string
  provisioningCertPassword: string
  tenantId: string
  version?: string
}

export class WSMessage {
  version: number
  status: string
  data?: any
  errorText?: string
  constructor (version: number, status: string, data?: any, errorText?: string) {
    this.version = version
    this.status = status
    this.data = data
    this.errorText = errorText
  }
}

export class RCSMessage extends WSMessage {
  certs: string[]
  action: string
  nonce: string
  signature: string
  profileScript: string
  password: string
  constructor (version: number, status: string, certs: string[], action: string, nonce: string, signature: string, profileScript: string, password: string, data?: any, errorText?: string) {
    super(version, status, data, errorText)
    this.certs = certs
    this.action = action
    this.nonce = nonce
    this.signature = signature
    this.profileScript = profileScript
    this.password = password
  }
}

export class AMTActivate extends WSMessage {
  client: string
  action: string
  name: string
  profile: string
  uuid: string
  ver: string
  tag: string
  fqdn: string
  realm: string
  nonce: string
  hashes: string[]
  modes: number[]
  currentMode: number
  constructor (version: number, status: string, client?: string, action?: string, name?: string, profile?: string, uuid?: string, ver?: string, data?: any, errorText?: string, tag?: string, fqdn?: string, realm?: string, nonce?: string, hashes?: string[], modes?: number[], currentMode?: number) {
    super(version, status, data, errorText)
    this.client = client
    this.action = action
    this.name = name
    this.profile = profile
    this.uuid = uuid
    this.ver = ver
    this.tag = tag
    this.fqdn = fqdn
    this.realm = realm
    this.nonce = nonce
    this.hashes = hashes
    this.modes = modes
    this.currentMode = currentMode
  }
}

export class rcsObj {
  action: string
  certs: string[]
  nonce: string
  signature: string
  password: string
  profileScript: string
  errorText?: string
  constructor (action?: string, certs?: string[], nonce?: string, signature?: string, password?: string, profileScript?: string, errorText?: string) {
    this.action = action
    this.certs = certs
    this.nonce = nonce
    this.signature = signature
    this.password = password
    this.profileScript = profileScript
    this.errorText = errorText
  }
}

export class Client {
  client: string
  dnsSuffix: string
  digestRealm: string
  fwNonce: Buffer
  amtGuid: string
  profile: string
  certHashes: string[]
  amtVersion: string
  availableModes: number[]
  currentMode: number
  tag: string
  constructor (client?: string, dnsSuffix?: string, digestRealm?: string, fwNonce?: Buffer, amtGuid?: string, profile?: string, certHashes?: string[], amtVersion?: string, availableModes?: number[], currentMode?: number, tag?: string) {
    this.client = client
    this.dnsSuffix = dnsSuffix
    this.digestRealm = digestRealm
    this.fwNonce = fwNonce
    this.amtGuid = amtGuid
    this.profile = profile
    this.certHashes = certHashes
    this.amtVersion = amtVersion
    this.availableModes = availableModes
    this.currentMode = currentMode
    this.tag = tag
  }
}

export class Version {
  major: number
  minor: number
  revision: number

  constructor () {
    this.major = 0
    this.minor = 0
    this.revision = 0
  }
}

export type eventType = 'request' | 'success' | 'fail'

export interface OpenAMTEvent {
  type: eventType
  message: string
  methods: string[]
  guid: string
  timestamp: number
}
