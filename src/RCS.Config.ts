/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import * as WebSocket from "ws";
import { AMTDomain, AMTConfiguration } from "./models/Rcs";

export type WebSocketConfig = {
  WebSocketPort: number;
  WebSocketTLS: boolean;
  WebSocketCertificate: string;
  WebSocketCertificateKey: string;
  RootCACert?: string;
};

export type AMTConfig = {
  ProfileName: string;
  AMTPassword: string;
  GenerateRandomPassword: boolean;
  RandomPasswordLength: number;
  RandomPasswordCharacters: string;
  ConfigurationScript: string;
  CIRAConfigName: string;
  Activation: string;
  CIRAConfigObject?: CIRAConfig;
  NetworkConfigName?: string;
  NetworkConfigObject?: NetworkConfig;
};

export type NetworkConfig = {
  ProfileName: string;
  DHCPEnabled: boolean;
  StaticIPShared: boolean;
  IPSyncEnabled: boolean;
};

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
export type CIRAConfig = {
  ConfigName: string;
  MPSServerAddress: string;
  MPSPort: number;
  Username: string;
  Password: string;
  CommonName: string;
  ServerAddressFormat: number; //IPv4 (3), IPv6 (4), FQDN (201)
  AuthMethod: number; //Mutual Auth (1), Username/Password (2) (We only support 2)
  MPSRootCertificate: string; // Assumption is Root Cert for MPS. Need to validate.
  ProxyDetails: string;
};

export type RemoteConfig = {
  Name: string;
  Description: string;
  WSConfiguration: WebSocketConfig;
  AMTConfigurations: Array<AMTConfig>;
  AMTDomains: Array<AMTDomain>;
};

export type ClientObject = {
  ClientId: string;
  action?: ClientAction;
  uuid?: string;
  ClientSocket?: WebSocket;
  ClientData?: any;
  socketConn?: any;
  count?: number;
  payload?:any;
  certObj?:any;
  readyState?: number;
  ciraconfig?: CIRAConfigFlow;
};

export type CIRAConfigFlow = {
  status?: string;
  policyRuleUserInitiate ?: boolean;
  policyRuleAlert?: boolean;
  policyRulePeriodic?: boolean;
  mpsRemoteSAP?: boolean;
  mpsRemoteSAP_Enumerate?: boolean;
  mpsRemoteSAP_Delete?: boolean;
  mpsRemoteSAP_Get?:boolean;
  mpsPublicCert_Delete?:boolean;
  publicCerts?: any;
  addTrustedRootCert?: boolean;
  addMPSServer?: boolean;
  addRemoteAccessPolicyRule?: boolean;
  userInitConnectionService?: boolean;
  getENVSettingData?:boolean;
  setENVSettingData?:boolean;
  getENVSettingData_CIRA?:boolean;
  setENVSettingData_CIRA?:boolean;
}

export type mpsServer = {
  AccessInfo: any;
  InfoFormat: number; 
  Port: number;
  AuthMethod: number; 
  Username: string; 
  Password: string;
  CN?: string;
}

export type ClientMsg = {
  method: string;
  apiKey: string;
  appVersion: string;
  protocolVersion?: string;
  status: string;
  message: string;
  payload: any;
};

export type Payload = {
  ver: string; 
  build: string; 
  modes?: any; 
  fqdn?: string;
  digestRealm?: string; 
  fwNonce?: Buffer; 
  password?: string; 
  currentMode?: number; 
  certHashes?: Array<string>; 
  sku?: string; 
  uuid?: any;  
  username?: string;  
  client: string;  
  profile?: any; 
};

export type ConnectionObject = {
  socket: any;
  state: number;
  write?: any;
  close?: any;
  onStateChange?: any;
};

export enum ClientAction{
  INVALID = "invalid",
  ADMINCTLMODE = "acmactivate", 
  CLIENTCTLMODE = "ccmactivate",
  DEACTIVATE = "deactivate",
  CIRACONFIG= "ciraconfig"
}

export enum ClientMethods{
  INVALID = "invalid",
  WSMAN = "wsman",
  RESPONSE = "response",
  ACTIVATION = "activate",
  DEACTIVATION = "deactivate",
  CIRACONFIG= "ciraconfig"
}
