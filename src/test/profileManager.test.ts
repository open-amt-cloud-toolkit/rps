/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { RCSConfig } from '../models/Rcs'
import { ProfileManager } from '../ProfileManager';
import { ILogger } from '../interfaces/ILogger';
import Logger from '../Logger';
import { AMTConfigDb } from '../AMTConfigDb';

let logger: ILogger = Logger('ProfileManagerTests');

let rcsConfig: RCSConfig = {
    "Name": "RCS Configuration File",
    "Description": "Contains settings to configure the RCS Server",
    "WSConfiguration": {
        "WebSocketPort": 8080,
        "WebSocketTLS": false,
        "WebSocketCertificate": "tlscert.pem",
        "WebSocketCertificateKey": "tlskey.pem"
    },
    "mpsusername": "admin",
    "mpspass": "P@ssw0rd",
    "amtusername": "admin",
    "RPSXAPIKEY": "P@ssw0rd",
    "VaultConfig": {
        "usevault": false,
        "SecretsPath": "kv/data/rcs/",
        "token": "",
        "address": ""
    },
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
            "ProfileName": "profile 1",
            "AMTPassword": "<StrongPassword1!>",
            "GenerateRandomPassword": false,
            "RandomPasswordLength": 8,
            "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
            "ConfigurationScript": 'sample config script 1',
            "Activation": "ccmactivate"
        },
        {
            "ProfileName": "profile 2",
            "AMTPassword": "<StrongPassword2!>",
            "GenerateRandomPassword": true,
            "RandomPasswordLength": 8,
            "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
            "ConfigurationScript": 'sample config script 2',
            "Activation": "acmactivate"
        }
    ],
    "AMTDomains": [
        {
            "Name": "domain1",
            "DomainSuffix": "d1.net",
            "ProvisioningCert": "d1.pfx",
            "ProvisioningCertStorageFormat": "file",
            "ProvisioningCertPassword": "<StrongPassword>"
        },
        {
            "Name": "domain2",
            "DomainSuffix": "d2.com",
            "ProvisioningCert": "d2.pfx",
            "ProvisioningCertStorageFormat": "file",
            "ProvisioningCertPassword": "<StrongPassword2>"
        }
    ]
};

test('test if profile exists', () => {
    let profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(rcsConfig, Logger("AMTConfigDb")));

    let actual = profileManager.doesProfileExist('profile 1');
    expect(actual).toBeTruthy();
});

test('test if profile exists', async () => {
    let profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(rcsConfig, Logger("AMTConfigDb")));

    let actual = await profileManager.doesProfileExist('profile 5');
    expect(actual).toBeFalsy();
});


test('retrieve activation based on profile', async () => {
    let profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(rcsConfig, Logger("AMTConfigDb")));

    let expected = 'ccmactivate';
    let actual = await profileManager.getActivationMode('profile 1');
    expect(actual).toEqual(expected);
});


test('retrieve activation based on profile', async () => {
    let profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(rcsConfig, Logger("AMTConfigDb")), true);

    let expected = 'acmactivate';
    let actual = await profileManager.getActivationMode('profile 2');
    expect(actual).toEqual(expected);
});



test('retrieve config script', async () => {
    let profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(rcsConfig, Logger("AMTConfigDb")));

    let expected = 'sample config script 1';
    let actual = await profileManager.getConfigurationScript("profile 1");
    expect(actual).toEqual(expected);
});


test('retrieve config script', async () => {

    let profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(rcsConfig, Logger("AMTConfigDb")), true);

    let expected = 'sample config script 2';
    let actual = await profileManager.getConfigurationScript("profile 2");
    expect(actual).toEqual(expected);
});


test('retrieve amt password', async () => {

    let profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(rcsConfig, Logger("AMTConfigDb")));

    let expected = '<StrongPassword1!>';
    let profile = 'profile 1';
    let actual = await profileManager.getAmtPassword(profile);

    expect(actual).toEqual(expected);
});

test('retrieve amt password auto generated', async () => {

    let profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(rcsConfig, Logger("AMTConfigDb")), true);

    let profile = 'profile 2';
    let expected = '<StrongPassword2!>';
    let actual = await profileManager.getAmtPassword(profile);
    expect(actual).not.toBe(expected);
});

test('validate password', () => {

    let testConfig: RCSConfig = {
        "Name": "RCS Configuration File",
        "Description": "Contains settings to configure the RCS Server",
        "WSConfiguration": {
            "WebSocketPort": 8080,
            "WebSocketTLS": false,
            "WebSocketCertificate": "tlscert.pem",
            "WebSocketCertificateKey": "tlskey.pem"
        },
        "mpsusername": "admin",
        "mpspass": "P@ssw0rd",
        "amtusername": "admin",
        "RPSXAPIKEY": "P@ssw0rd",
        "VaultConfig": {
            "usevault": false,
            "SecretsPath": "kv/data/rcs/",
            "token": "",
            "address": ""
        },
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
                "ProfileName": "profile 1",
                "AMTPassword": "<StrongPassword1!>",
                "GenerateRandomPassword": false,
                "RandomPasswordLength": 8,
                "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
                "ConfigurationScript": 'sample config script 1',
                "Activation": "ccmactivate"
            },
            {
                "ProfileName": "profile 2",
                "AMTPassword": "<StrongPassword>",
                "GenerateRandomPassword": false,
                "RandomPasswordLength": 8,
                "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
                "ConfigurationScript": 'sample config script 2',
                "Activation": "acmactivate"
            },
            {
                "ProfileName": "profile 3",
                "AMTPassword": "<StrongPassword2!>",
                "GenerateRandomPassword": true,
                "RandomPasswordLength": 8,
                "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
                "ConfigurationScript": 'sample config script 3',
                "Activation": "acmactivate"
            }
        ],
        "AMTDomains": [
            {
                "Name": "domain1",
                "DomainSuffix": "d1.net",
                "ProvisioningCert": "d1.pfx",
                "ProvisioningCertStorageFormat": "file",
                "ProvisioningCertPassword": "<StrongPassword>"
            },
            {
                "Name": "domain2",
                "DomainSuffix": "d2.com",
                "ProvisioningCert": "d2.pfx",
                "ProvisioningCertStorageFormat": "file",
                "ProvisioningCertPassword": "<StrongPassword2>"
            }
        ]
    };

    let profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(rcsConfig, Logger("AMTConfigDb")));

    let actual = profileManager.validateAMTPasswords(testConfig.AMTConfigurations);

    expect(actual.length).toBe(3);
    expect(actual[0].ProfileName).toBe('profile 1');
    expect(actual[1].ProfileName).toBe('profile 2');
});


test('validate password with bad amt passwords', () => {

    let testConfig: RCSConfig = {
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
                "ProfileName": "profile 1",
                "AMTPassword": "password1",
                "GenerateRandomPassword": false,
                "RandomPasswordLength": 8,
                "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
                "ConfigurationScript": 'sample config script 1',
                "Activation": "ccmactivate"
            },
            {
                "ProfileName": "profile 2",
                "AMTPassword": "password2",
                "GenerateRandomPassword": false,
                "RandomPasswordLength": 8,
                "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
                "ConfigurationScript": 'sample config script 2',
                "Activation": "acmactivate"
            }

        ],
        "AMTDomains": [
            {
                "Name": "domain1",
                "DomainSuffix": "d1.net",
                "ProvisioningCert": "d1.pfx",
                "ProvisioningCertStorageFormat": "file",
                "ProvisioningCertPassword": "<StrongPassword>"
            },
            {
                "Name": "domain2",
                "DomainSuffix": "d2.com",
                "ProvisioningCert": "d2.pfx",
                "ProvisioningCertStorageFormat": "file",
                "ProvisioningCertPassword": "<StrongPassword2>"
            }
        ]
    };
    let profileManager: ProfileManager = new ProfileManager(logger, null, new AMTConfigDb(rcsConfig, Logger("AMTConfigDb")));

    let activation1 = profileManager.getActivationMode('profile 1');
    let activation2 = profileManager.getActivationMode('profile 2');

    expect(activation1).toBeDefined();
    expect(activation2).toBeDefined();
});
