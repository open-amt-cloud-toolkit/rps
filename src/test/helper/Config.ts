import { RCSConfig } from '../../models/Rcs'

export const config: RCSConfig = {
  Name: 'RCS Configuration File',
  Description: 'Contains settings to configure the RCS Server',
  VaultConfig: {
    usevault: false,
    SecretsPath: 'kv/data/rcs/',
    token: '',
    address: ''
  },
  mpsusername: 'admin',
  mpspass: 'P@ssw0rd',
  amtusername: 'admin',
  RPSXAPIKEY: 'P@ssw0rd',
  devmode: true,
  https: false,
  webport: 8081,
  credentialspath: '../../../MPS_MicroService/private/data.json',
  corsHeaders:"*",
  corsMethods:"*",
  corsOrigin:"*",
  WSConfiguration: {
    WebSocketPort: 8080,
    WebSocketTLS: false,
    WebSocketCertificate: 'tlscert.pem',
    WebSocketCertificateKey: 'tlskey.pem'
  },
  DbConfig:
  {
    useDbForConfig: false,
    dbhost: '',
    dbname: '',
    dbport: 0,
    dbuser: '',
    dbpassword: ''
  }
}
