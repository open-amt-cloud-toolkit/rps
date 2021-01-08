/*********************************************************************
* Copyright (c) Intel Corporation 2019
* SPDX-License-Identifier: Apache-2.0
* Description: Constants
**********************************************************************/

import { NetworkConfig } from '../RCS.Config'

export class ProvisioningCertObj {
    certChain: Array<string>;
    privateKey: string;
}

export class CertificateObject {
    pem: string;
    issuer: string;
    subject: string;
}

export class DbConfig {
    useDbForConfig: boolean;
    useRawCerts?: boolean;
    dbhost: string;
    dbname: string;
    dbport: number;
    dbuser: string;
    dbpassword: string;
}

export class VaultConfig {
    usevault: boolean;
    SecretsPath: string;
    address: string;
    token: string;
}
export class WSConfiguration {
    WebSocketPort: number;
    WebSocketTLS: boolean;
    WebSocketCertificate: string;
    WebSocketCertificateKey: string;
    RootCACert?: string;
}
export class RCSConfig {
    Name: string;
    Description: string;
    VaultConfig: VaultConfig;
    mpsusername: string;
    mpspass: string;
    amtusername: string;
    devmode: boolean;
    https: boolean;
    webport: number;
    credentialspath: string;
    datapath?: string;
    WSConfiguration: WSConfiguration;
    DbConfig: DbConfig;
    RPSXAPIKEY: string;
    NodeEnv?: string;
    constructor () {
      this.VaultConfig = new VaultConfig()
      this.WSConfiguration = new WSConfiguration()
      this.DbConfig = new DbConfig()
    }
}
export class AMTConfiguration {
    ProfileName: string;
    AMTPassword: string;
    GenerateRandomPassword: boolean;
    RandomPasswordLength?: number;
    RandomPasswordCharacters?: string;
    ConfigurationScript?: string;
    CIRAConfigName?: string;
    Activation: string;
    NetworkConfigName?: string;
    NetworkConfigObject?: NetworkConfig;
    MEBxPassword: string;
    GenerateRandomMEBxPassword: boolean;
    RandomMEBxPasswordLength?: number;
}

export class AMTDomain {
    Name: string;
    DomainSuffix: string;
    ProvisioningCert: string;
    ProvisioningCertStorageFormat: string;
    ProvisioningCertPassword: string;
}

export class WSMessage {
    version: number;
    status: string;
    data?: any;
    errorText?: string;
    constructor (version: number, status: string, data?: any, errorText?: string) {
      this.version = version
      this.status = status
      this.data = data
      this.errorText = errorText
    }
}

export class RCSMessage extends WSMessage {
    certs: Array<string>;
    action: string;
    nonce: string;
    signature: string;
    profileScript: string;
    password: string;
    constructor (version: number, status: string, certs: Array<string>, action: string, nonce: string, signature: string, profileScript: string, password: string, data?: any, errorText?: string) {
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
    client: string;
    action: string;
    name: string;
    profile: string;
    uuid: string;
    ver: string;
    tag: string;
    fqdn: string;
    realm: string;
    nonce: string;
    hashes: Array<string>;
    modes: Array<number>;
    currentMode: number;
    constructor (version: number, status: string, client?: string, action?: string, name?: string, profile?: string, uuid?: string, ver?: string, data?: any, errorText?: string, tag?: string, fqdn?: string, realm?: string, nonce?: string, hashes?: Array<string>, modes?: Array<number>, currentMode?: number) {
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
    action: string;
    certs: Array<string>;
    nonce: string;
    signature: string;
    password: string;
    profileScript: string;
    errorText?: string;
    constructor (action?: string, certs?: Array<string>, nonce?: string, signature?: string, password?: string, profileScript?: string, errorText?: string) {
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
    client: string;
    dnsSuffix: string;
    digestRealm: string;
    fwNonce: Buffer;
    amtGuid: string;
    profile: string;
    certHashes: Array<string>;
    amtVersion: string;
    availableModes: Array<number>;
    currentMode: number;
    tag: string;
    constructor (client?: string, dnsSuffix?: string, digestRealm?: string, fwNonce?: Buffer, amtGuid?: string, profile?: string, certHashes?: Array<string>, amtVersion?: string, availableModes?: Array<number>, currentMode?: number, tag?: string) {
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
    major: number;
    minor: number;
    revision: number;

    constructor () {
      this.major = 0
      this.minor = 0
      this.revision = 0
    }
}

const recipeRCSConfig = {
  name: 'Name',
  description: 'Description',
  user: 'mpsusername',
  password: 'mpspass',
  amt_user: 'amtusername',
  developer_mode: 'devmode',
  https: 'https',
  web_port: 'webport',
  credentials_path: 'credentialspath',
  websocketport: 'WSConfiguration.WebSocketPort',
  websockettls: 'WSConfiguration.WebSocketTLS',
  web_tls_cert: 'WSConfiguration.WebSocketCertificate',
  web_tls_cert_key: 'WSConfiguration.WebSocketCertificateKey',
  root_ca_cert: 'WSConfiguration.RootCACert',
  use_vault: 'VaultConfig.usevault',
  vault_address: 'VaultConfig.address',
  vault_token: 'VaultConfig.token',
  secrets_path: 'VaultConfig.SecretsPath',
  db_host: 'DbConfig.dbhost',
  db_name: 'DbConfig.dbname',
  db_port: 'DbConfig.dbport',
  db_user: 'DbConfig.dbuser',
  db_password: 'DbConfig.dbpassword',
  use_db_profiles: 'DbConfig.useDbForConfig',
  xapikey: 'RPSXAPIKEY',
  amt_domains: 'AMTDomains',
  amt_configurations: 'AMTConfigurations',
  cira_configurations: 'CIRAConfigurations',
  data_path: 'datapath',
  node_env: 'NodeEnv',
  use_raw_certs: 'DbConfig.useRawCerts'
}

export function mapConfig (src, dot) {
  let config: RCSConfig

  config = <RCSConfig>dot.transform(recipeRCSConfig, src)

  return config
}
