/*********************************************************************
* Copyright (c) Intel Corporation 2019
* SPDX-License-Identifier: Apache-2.0
* Description: Constants
**********************************************************************/

import { CIRAConfig, ProfileWifiConfigs, WebSocketConfig } from '../RCS.Config'

export class ProvisioningCertObj {
  certChain: string[]
  privateKey: string
}

export class CertificateObject {
  pem: string
  issuer: string
  subject: string
}

export class VaultConfig {
  usevault: boolean
  SecretsPath: string
  address: string
  token: string
}
export class RCSConfig {
  VaultConfig: VaultConfig
  amtusername: string
  webport: number
  credentialspath: string
  WSConfiguration: WebSocketConfig
  dbProvider: string
  connectionString: string
  corsOrigin: string
  corsHeaders: string
  corsMethods: string
  mpsServer: string
  delayTimer: number
  mqttAddress?: string
  constructor () {
    this.VaultConfig = new VaultConfig()
  }
}
export class AMTConfiguration {
  profileName?: string
  amtPassword?: string
  ciraConfigName?: string
  activation: string
  mebxPassword?: string
  ciraConfigObject?: CIRAConfig
  tags?: string[]
  dhcpEnabled?: boolean
  wifiConfigs?: ProfileWifiConfigs[]
  tenantId: string
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

const recipeRCSConfig = {
  web_port: 'webport',
  credentials_path: 'credentialspath',
  websocketport: 'WSConfiguration.WebSocketPort',
  vault_address: 'VaultConfig.address',
  vault_token: 'VaultConfig.token',
  secrets_path: 'VaultConfig.SecretsPath',
  db_provider: 'dbProvider',
  connection_string: 'connectionString',
  amt_domains: 'AMTDomains',
  amt_configurations: 'AMTConfigurations',
  cira_configurations: 'CIRAConfigurations',
  cors_origin: 'corsOrigin',
  cors_headers: 'corsHeaders',
  cors_methods: 'corsMethods',
  cors_allow_credentials: 'corsAllowCredentials',
  mps_server: 'mpsServer',
  delay_timer: 'delayTimer',
  mqtt_address: 'mqttAddress'
}

export function mapConfig (src, dot): RCSConfig {
  return dot.transform(recipeRCSConfig, src) as RCSConfig
}

export type eventType = 'request' | 'success' | 'fail'

export interface OpenAMTEvent {
  type: eventType
  message: string
  methods: string[]
  guid: string
  timestamp: number
}
