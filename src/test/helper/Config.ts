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
  "credentialspath": "../../../MPS_MicroService/private/credentials.json",
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
  },
  "AMTConfigurations": [
    {
      "ProfileName": "profile1",
      "AMTPassword": "P@ssw0rd",
      "GenerateRandomPassword": false,
      "RandomPasswordLength": 8,
      "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
      "ConfigurationScript": null,
      "Activation": "acmactivate"
    },
    {
      "ProfileName": "profile2",
      "AMTPassword": "P@ssw0rd",
      "GenerateRandomPassword": false,
      "RandomPasswordLength": 8,
      "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
      "ConfigurationScript": null,
      "Activation": "ccmactivate"
    },
    {
      "ProfileName": "profile3",
      "AMTPassword": "P@ssw0rd",
      "GenerateRandomPassword": false,
      "RandomPasswordLength": 8,
      "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
      "ConfigurationScript": null,
      "Activation": "invalid"
    },
    {
      "ProfileName": "profile4",
      "AMTPassword": "P@ssw0rd",
      "GenerateRandomPassword": false,
      "RandomPasswordLength": 8,
      "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
      "ConfigurationScript": null,
      "Activation": ""
    }
  ],
  "AMTDomains": [
    {
      "Name": "domain1",
      "DomainSuffix": "vprodemo.com",
      "ProvisioningCert": "vprodemo.pfx",
      "ProvisioningCertStorageFormat": "file",
      "ProvisioningCertPassword": "P@ssw0rd"
    },
    {
      "Name": "domain2",
      "DomainSuffix": "d2.com",
      "ProvisioningCert": "d2.pfx",
      "ProvisioningCertStorageFormat": "file",
      "ProvisioningCertPassword": "<StrongPassword>"
    },
    {
      "Name": "domain3",
      "DomainSuffix": "d2.com",
      "ProvisioningCert": "d2.pfx",
      "ProvisioningCertStorageFormat": "file",
      "ProvisioningCertPassword": "P@ssw0rd"
    }
  ]
};