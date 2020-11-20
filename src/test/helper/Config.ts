import { RCSConfig } from "../../models/Rcs";

export let config: RCSConfig = {
  "Name": "RCS Configuration File",
  "Description": "Contains settings to configure the RCS Server",
  "VaultConfig": {
    "usevault": false,
    "SecretsPath": "kv/data/rcs/",
    "token": "",
    "address": ""
  },
  "mpsusername": "admin",
  "mpspass": "P@ssw0rd",
  "amtusername": "admin",
  "RPSXAPIKEY": "P@ssw0rd",
  "devmode": true,
  "https": false,
  "webport": 8081,
  "credentialspath": "../../../mps/private/data.json",
  "WSConfiguration": {
    "WebSocketPort": 8080,
    "WebSocketTLS": false,
    "WebSocketCertificate": "tlscert.pem",
    "WebSocketCertificateKey": "tlskey.pem"
  },
  "DbConfig":
  {
    "useDbForConfig": false,
    "dbhost": "",
    "dbname": "",
    "dbport": 0,
    "dbuser": "",
    "dbpassword": ""
  }
};