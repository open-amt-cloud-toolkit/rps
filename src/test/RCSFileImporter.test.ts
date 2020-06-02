import { RCSConfig, rcsObj } from "../models/Rcs";
import * as fs from "fs";
import { RCSFileImporter } from "../RCSFileImporter";
import Logger from "../Logger";

let configPath: string = `sampleConfig.json`;

let config: RCSConfig = {
    "Name": "RCS Configuration File",
    "Description": "Contains settings to configure the RCS Server",
    "WSConfiguration": {
        "WebSocketPort": 8080,
        "WebSocketTLS": false,
        "WebSocketCertificate": "tlscert.pem",
        "WebSocketCertificateKey": "tlskey.pem"
    },
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
    "DbConfig": {
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
        }
    ],
    "AMTDomains": [
        {
            "Name": "domain1",
            "DomainSuffix": "vprodemo.com",
            "ProvisioningCert": "C:\\dev\\certs\\vprodemo.pfx",
            "ProvisioningCertStorageFormat": "file",
            "ProvisioningCertPassword": "P@ssw0rd"
        },
        {
            "Name": "domain2",
            "DomainSuffix": "d2.com",
            "ProvisioningCert": "d2.pfx",
            "ProvisioningCertStorageFormat": "file",
            "ProvisioningCertPassword": "<StrongPassword>"
        }
    ]
};


test('test if profile exists', () => {

    fs.writeFileSync(configPath, JSON.stringify(config));

    let rcsFileImporter = new RCSFileImporter(Logger('RCSFileImporter'), configPath);
    let inportedConfig: RCSConfig = rcsFileImporter.importconfig();
    fs.unlinkSync(configPath);

    expect(inportedConfig.Name).toBe(config.Name);
    expect(inportedConfig.Description).toBe(config.Description);
    expect(inportedConfig).toStrictEqual(config);
});