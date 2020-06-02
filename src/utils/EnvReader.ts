import { RCSConfig } from '../models/Rcs';

export type webConfigType = {
  ca: any,
  cert: any,
  key: any,
  secureOptions?: any,
}

export class EnvReader {

  static GlobalEnvConfig: RCSConfig;
  static configPath: string;

  static InitFromEnv(config: RCSConfig) {
    if (process.env.WEB_PORT) {
      config.webport = parseInt(process.env.WEB_PORT);
    }
    else {
      if (config.webport) {
        config.webport = config.webport;
      } else {
        config.webport = 8081; // default
      }
    }

    if (process.env.HTTPS) {
      config.https = (process.env.HTTPS === "true" ? true : false);
    }

    if (process.env.USE_DB_PROFILES) {
      config.DbConfig.useDbForConfig = (process.env.USE_DB_PROFILES === "true" ? true : false);
    }

    config.DbConfig.dbhost = process.env.DB_HOST || config.DbConfig.dbhost;
    config.DbConfig.dbname = process.env.DB_NAME || config.DbConfig.dbname;


    if (process.env.DB_PORT) {
      config.DbConfig.dbport = parseInt(process.env.DB_PORT);
    }

    config.DbConfig.dbuser = process.env.DB_USER || config.DbConfig.dbuser;
    config.DbConfig.dbpassword = process.env.DB_PASSWORD || config.DbConfig.dbpassword;

    if (process.env.WEBSOCKETPORT) {
      config.WSConfiguration.WebSocketPort = parseInt(process.env.WEBSOCKETPORT)
    }
    else {
      if (config.WSConfiguration.WebSocketPort) {
        config.WSConfiguration.WebSocketPort = config.WSConfiguration.WebSocketPort;
      } else {
        config.WSConfiguration.WebSocketPort = 8080
      }
    }

    if (process.env.WEBSOCKETTLS) {
      config.WSConfiguration.WebSocketTLS = process.env.WEBSOCKETTLS === 'true' ? true : false
    }
    else {
      if (config.WSConfiguration.WebSocketTLS) {
        config.WSConfiguration.WebSocketTLS = config.WSConfiguration.WebSocketTLS;
      } else {
        config.WSConfiguration.WebSocketTLS = false
      }
    }

    config.WSConfiguration.WebSocketCertificate = process.env.WEB_TLS_CERT || config.WSConfiguration.WebSocketCertificate;
    config.WSConfiguration.WebSocketCertificateKey = process.env.WEB_TLS_CERT_KEY || config.WSConfiguration.WebSocketCertificateKey;


    if (process.env.USEVAULT) {
      config.VaultConfig.usevault = (process.env.USEVAULT === "true" ? true : false);
    }
    config.VaultConfig.address = process.env.VAULT_ADDR || config.VaultConfig.address;
    config.VaultConfig.token = process.env.VAULT_TOKEN || config.VaultConfig.token;


    if (process.env.DEVELOPER_MODE) {
      config.devmode = (process.env.DEVELOPER_MODE === "true" ? true : false);
    }

    if (process.env.SECRETS_PATH) {
      config.VaultConfig.SecretsPath = process.env.SECRETS_PATH;
    }
    else {
      if (config.VaultConfig.SecretsPath) {
        config.VaultConfig.SecretsPath = config.VaultConfig.SecretsPath;
      } else {
        config.VaultConfig.SecretsPath = "secret/data/";
      }
    }

    if (config.VaultConfig.SecretsPath.lastIndexOf("/") !== config.VaultConfig.SecretsPath.length - 1) {
      config.VaultConfig.SecretsPath += "/";
    }
    config.credentialspath = process.env.CREDENTIALS_PATH || config.credentialspath;
    config.mpsusername = process.env.MPS_USER || config.mpsusername;
    config.mpspass = process.env.MPS_PASSWORD || config.mpspass;

    if (process.env.AMT_USER) {
      config.amtusername = process.env.AMT_USER;
    } else {
      if (config.amtusername) {
        config.amtusername = config.amtusername;
      } else {
        config.amtusername = "admin";
      }
    }

    config.RPSXAPIKEY = process.env.RPSXAPIKEY || config.RPSXAPIKEY;

    this.GlobalEnvConfig = config;
  }

  static getCertConfig() {
    let webTlsConfig: webConfigType = {
      "key": process.env.WEB_TLS_CERT_KEY,
      "cert": process.env.WEB_TLS_CERT,
      "secureOptions": ["SSL_OP_NO_SSLv2", "SSL_OP_NO_SSLv3", "SSL_OP_NO_COMPRESSION", "SSL_OP_CIPHER_SERVER_PREFERENCE", "SSL_OP_NO_TLSv1", "SSL_OP_NO_TLSv11"],
      "ca": ""
    }

    if (process.env.ROOT_CA_CERT) {
      webTlsConfig.ca = process.env.ROOT_CA_CERT
    }

    return { webConfig: webTlsConfig }
  }
}