/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Brian Osburn
 **********************************************************************/

import { RCSConfig } from '../../src/models/Rcs'
import { DomainCredentialManager } from "../DomainCredentialManager";
import { ILogger } from '../interfaces/ILogger';
import Logger from '../Logger';
import { DomainConfigDb } from '../DomainConfigDb';

let logger: ILogger = Logger('DomainCredentialManagerTests');

let rcsConfig: RCSConfig = {
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
            "ProfileName": "profile 1",
            "AMTPassword": "<StrongPassword>",
            "GenerateRandomPassword": false,
            "RandomPasswordLength": 8,
            "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
            "ConfigurationScript": null,
            "Activation": "ccmactivate"
        },
        {
            "ProfileName": "profile 2",
            "AMTPassword": "<StrongPassword>",
            "GenerateRandomPassword": true,
            "RandomPasswordLength": 8,
            "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
            "ConfigurationScript": null,
            "Activation": "acmactivate"
        }
    ],
    "AMTDomains": [
        {
            "Name": "domain1",
            "DomainSuffix": "d1.net",
            "ProvisioningCert": "d1.pfx",
            "ProvisioningCertStorageFormat": "file",
            "ProvisioningCertPassword": "PROVISIONING_CERT_PASSWORD_KEY"
        },
        {
            "Name": "domain2",
            "DomainSuffix": "d2.com",
            "ProvisioningCert": "d2.pfx",
            "ProvisioningCertStorageFormat": "file",
            "ProvisioningCertPassword": "PROVISIONING_CERT_PASSWORD_KEY"
        }
    ]
};

test('retrieve provisioning cert based on domain', async () => {

    //let domainCredentialManager: DomainCredentialManager = new DomainCredentialManager(logger, rcsConfig.AMTDomains, new SecretManagerService(logger));
    let domainCredentialManager: DomainCredentialManager = new DomainCredentialManager(logger, new DomainConfigDb(rcsConfig.AMTDomains, Logger("DomainConfigDb")));

    let expectedProvisioningCert: string = 'd2.pfx';
    let actualProvisioningCert: string = await domainCredentialManager.getProvisioningCert('d2.com');
    // let actualProvisioningCertPassword: string = await domainCredentialManager.getProvisioningCertPassword('d2.com');
    expect(actualProvisioningCert).toEqual(expectedProvisioningCert);
    // expect(actualProvisioningCertPassword).toEqual('P@ssw0rd');
});


test('retrieve cert password based on domain', async () => {

    let domainCredentialManager: DomainCredentialManager = new DomainCredentialManager(logger, new DomainConfigDb(rcsConfig.AMTDomains, Logger("DomainConfigDb")));

    let expectedProvisioningCert: string = 'PROVISIONING_CERT_PASSWORD_KEY';
    let actualProvisioningCert: string = await domainCredentialManager.getProvisioningCertPassword('d1.net');
    expect(expectedProvisioningCert).toEqual(actualProvisioningCert);
});


test('retrieve cert password based on domain from an unknown domain', async () => {

    let domainCredentialManager: DomainCredentialManager = new DomainCredentialManager(logger, new DomainConfigDb(rcsConfig.AMTDomains, Logger("DomainConfigDb")));

    let actualProvisioningCert = await domainCredentialManager.getProvisioningCertPassword('d1.com');
    expect(actualProvisioningCert).toBeNull();
});
