/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import * as WebSocket from "ws";
import { AMTDomain } from "./models/Rcs";

export type WebSocketConfig = {
  WebSocketPort: number;
  WebSocketTLS: boolean;
  WebSocketCertificate: string;
  WebSocketCertificateKey: string;
};

export type AMTConfig = {
  ProfileName: string;
  AMTPassword: string;
  GenerateRandomPassword: boolean;
  RandomPasswordLength: number;
  RandomPasswordCharacters: string;
  ConfigurationScript: string;
  Activation: string;
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
  ClientSocket?: WebSocket;
  ClientData?: any;
  socketConn?: any;
  count?: number;
  payload?:any;
  certObj?:any;
  readyState?: number;
};

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
  action: string; 
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
  profile?: string; 
};

export type ConnectionObject = {
  socket: any;
  state: number;
  write?: any;
  close?: any;
  onStateChange?: any;
};

export enum ClientAction{
  WSMAN = "wsman",
  RESPONSE = "response", 
  ACTIVATION = "activation",
  ADMINCTLMODE = "acmactivate", 
  CLIENTCTLMODE = "ccmactivate",
  DEACTIVATE = "deactivate"
}
