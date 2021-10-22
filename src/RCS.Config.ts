/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import * as WebSocket from 'ws'
import { AMTConfiguration, AMTDomain } from './models/Rcs'
import { AMTEthernetPortSettings } from './models/WSManResponse'

export interface WebSocketConfig {
  WebSocketPort: number
}
export interface WirelessConfig {
  profileName: string
  authenticationMethod: number
  encryptionMethod: number
  ssid: string
  pskValue: number
  pskPassphrase: string
  linkPolicy: string[]
  tenantId: string
}

export interface ProfileWifiConfigs {
  priority: number
  profileName: string
  tenantId: string
}

/*
- AddMpServer Method:

AccessInfo: IP or FQDN of MPS server(MaxLen 256)
Port (number)
Username (16 alphanumeric characters)
Password (16 characters)
CN (common name used when AccessInfo is IP address)

Additional information that we need to provide when configuring MPS:

- AddMpServer Method:

InfoFormat IPv4 (3), IPv6 (4), FQDN (201)
AuthMethod Mutual Auth (1), Username/Password (2) (We only support 2)
Certificate (Not required)
*/
export interface CIRAConfig {
  configName: string
  mpsServerAddress: string
  mpsPort: number
  username: string
  password?: string
  commonName: string
  serverAddressFormat: number // IPv4 (3), IPv6 (4), FQDN (201)
  authMethod: number // Mutual Auth (1), Username/Password (2) (We only support 2)
  mpsRootCertificate: string // Assumption is Root Cert for MPS. Need to validate.
  proxyDetails: string
  tenantId: string
  /** Flag to regenerate a random password when editing a cira config */
  regeneratePassword?: boolean
}

export interface RemoteConfig {
  Name: string
  Description: string
  WSConfiguration: WebSocketConfig
  AMTConfigurations: AMTConfiguration[]
  AMTDomains: AMTDomain[]
}
export interface SocketConnection {
  socket: WebSocket
  state: number
  onStateChange?: Function
  close?: Function
  write?: Function
}

export interface Status {
  Status?: string
  Network?: string
  CIRAConnection?: string
}
export interface ClientObject {
  ClientId: string
  action?: ClientAction
  uuid?: string
  hostname?: string
  ClientSocket?: WebSocket
  ClientData?: any
  socketConn?: SocketConnection
  count?: number
  payload?: any
  certObj?: any
  readyState?: number
  activationStatus?: boolean
  delayEndTime?: any
  amtPassword?: string
  mebxPassword?: string
  ciraconfig?: CIRAConfigFlow
  nonce?: any
  signature?: any
  mpsUsername?: string
  mpsPassword?: string
  network?: NetworkConfigFlow
  status?: Status
}

export interface CIRAConfigFlow {
  policyRuleUserInitiate?: boolean
  policyRuleAlert?: boolean
  policyRulePeriodic?: boolean
  mpsRemoteSAP?: boolean
  mpsRemoteSAPEnumerate?: boolean
  mpsRemoteSAPDelete?: boolean
  mpsRemoteSAPGet?: boolean
  mpsPublicCertDelete?: boolean
  publicCerts?: any
  addTrustedRootCert?: boolean
  addMPSServer?: boolean
  addRemoteAccessPolicyRule?: boolean
  userInitConnectionService?: boolean
  getENVSettingData?: boolean
  setENVSettingData?: boolean
  getENVSettingDataCIRA?: boolean
  setENVSettingDataCIRA?: boolean
}

export interface NetworkConfigFlow {
  getWiFiPortCapabilities?: boolean
  WiFiPortCapabilities?: any
  isWiFiConfigsDeleted?: boolean
  getGeneralSettings?: boolean
  setEthernetPortSettings?: boolean
  ethernetSettingsWifiObj?: AMTEthernetPortSettings
  setWiFiPort?: boolean
  setWiFiPortResponse?: boolean
  getWiFiPortConfigurationService?: boolean
  count?: number
}

export interface mpsServer {
  AccessInfo: any
  InfoFormat: number
  Port: number
  AuthMethod: number
  Username: string
  Password: string
  CN?: string
}

export interface ClientMsg {
  method: string
  apiKey: string
  appVersion: string
  protocolVersion?: string
  status: string
  message: string
  payload: any
}

export interface Payload {
  ver: string
  build: string
  modes?: any
  fqdn?: string
  digestRealm?: string
  fwNonce?: Buffer
  password?: string
  currentMode?: number
  hostname?: string
  certHashes?: string[]
  sku?: string
  uuid?: any
  username?: string
  client: string
  profile?: any
}

export interface ConnectionObject {
  socket: any
  state: number
  write?: any
  close?: any
  onStateChange?: any
}

export enum ClientAction {
  INVALID = 'invalid',
  ADMINCTLMODE = 'acmactivate',
  CLIENTCTLMODE = 'ccmactivate',
  DEACTIVATE = 'deactivate',
  CIRACONFIG = 'ciraconfig',
  NETWORKCONFIG = 'networkConfig',
  MAINTENANCE = 'maintenance'
}

export enum ClientMethods{
  INVALID = 'invalid',
  WSMAN = 'wsman',
  RESPONSE = 'response',
  ACTIVATION = 'activate',
  DEACTIVATION = 'deactivate',
  CIRACONFIG= 'ciraconfig',
  HEARTBEAT='heartbeat_response',
  MAINTENANCE='maintenance'
}

export interface apiResponse {
  data?: any
  error?: string
  message?: string
}
