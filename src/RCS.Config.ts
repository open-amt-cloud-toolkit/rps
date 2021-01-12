/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import * as WebSocket from 'ws'
import { AMTDomain } from './models/Rcs'

export interface WebSocketConfig {
  WebSocketPort: number
  WebSocketTLS: boolean
  WebSocketCertificate: string
  WebSocketCertificateKey: string
  RootCACert?: string
}

export interface AMTConfig {
  ProfileName: string
  AMTPassword: string
  GenerateRandomPassword: boolean
  RandomPasswordLength: number
  MEBxPassword: string
  GenerateRandomMEBxPassword: boolean
  RandomMEBxPasswordLength: number
  RandomPasswordCharacters: string
  ConfigurationScript: string
  CIRAConfigName: string
  Activation: string
  CIRAConfigObject?: CIRAConfig
  NetworkConfigName?: string
  NetworkConfigObject?: NetworkConfig
}

export interface NetworkConfig {
  ProfileName: string
  DHCPEnabled: boolean
  StaticIPShared: boolean
  IPSyncEnabled: boolean
}

/*
- AddMpServer Method:

AccessInfo IP or FQDN of MPS server (MaxLen 256)
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
  ConfigName: string
  MPSServerAddress: string
  MPSPort: number
  Username: string
  Password: string
  CommonName: string
  ServerAddressFormat: number // IPv4 (3), IPv6 (4), FQDN (201)
  AuthMethod: number // Mutual Auth (1), Username/Password (2) (We only support 2)
  MPSRootCertificate: string // Assumption is Root Cert for MPS. Need to validate.
  ProxyDetails: string
}

export interface RemoteConfig {
  Name: string
  Description: string
  WSConfiguration: WebSocketConfig
  AMTConfigurations: AMTConfig[]
  AMTDomains: AMTDomain[]
}

export interface ClientObject {
  ClientId: string
  action?: ClientAction
  uuid?: string
  ClientSocket?: WebSocket
  ClientData?: any
  socketConn?: any
  count?: number
  payload?: any
  certObj?: any
  readyState?: number
  amtPassword?: string
  ciraconfig?: CIRAConfigFlow
}

export interface CIRAConfigFlow {
  status?: string
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
  setEthernetPortSettings?: boolean
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

export enum ClientAction{
  INVALID = 'invalid',
  ADMINCTLMODE = 'acmactivate',
  CLIENTCTLMODE = 'ccmactivate',
  DEACTIVATE = 'deactivate',
  CIRACONFIG= 'ciraconfig',
  NETWORKCONFIG = 'networkConfig'
}

export enum ClientMethods{
  INVALID = 'invalid',
  WSMAN = 'wsman',
  RESPONSE = 'response',
  ACTIVATION = 'activate',
  DEACTIVATION = 'deactivate',
  CIRACONFIG= 'ciraconfig'
}
