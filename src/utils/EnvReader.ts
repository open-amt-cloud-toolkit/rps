import { RCSConfig } from '../models/Rcs'

export interface webConfigType {
  ca: any
  cert: any
  key: any
  secureOptions?: any
}

export class EnvReader {
  static GlobalEnvConfig: RCSConfig
  static configPath: string

  static getCertConfig () {
    const webTlsConfig: webConfigType = {
      key: process.env.WEB_TLS_CERT_KEY,
      cert: process.env.WEB_TLS_CERT,
      secureOptions: ['SSL_OP_NO_SSLv2', 'SSL_OP_NO_SSLv3', 'SSL_OP_NO_COMPRESSION', 'SSL_OP_CIPHER_SERVER_PREFERENCE', 'SSL_OP_NO_TLSv1', 'SSL_OP_NO_TLSv11'],
      ca: ''
    }

    if (process.env.ROOT_CA_CERT) {
      webTlsConfig.ca = process.env.ROOT_CA_CERT
    }

    return { webConfig: webTlsConfig }
  }
}
