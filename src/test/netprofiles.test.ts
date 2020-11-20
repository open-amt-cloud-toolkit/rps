/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { RCSConfig } from '../models/Rcs'
import { ProfileManager } from '../ProfileManager';
import { ILogger } from '../interfaces/ILogger';
import Logger from '../Logger';
import { AMTConfigDb } from '../AMTConfigDb';
import * as path from 'path'
import { EnvReader } from '../utils/EnvReader';

import { NetConfigFileStorageDb } from '../NetConfigFileStorageDb';

let logger: ILogger = Logger('netprofiletests');
let AMTConfigurations = [
  {
    "ProfileName": "profile1",
    "AMTPassword": "P@ssw0rd",
    "GenerateRandomPassword": false,
    "RandomPasswordLength": 8,
    "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
    "ConfigurationScript": null,
    "Activation": "acmactivate",
    "CIRAConfigName": "ciraconfig1"
  },
  {
    "ProfileName": "profile2",
    "AMTPassword": "P@ssw0rd",
    "GenerateRandomPassword": false,
    "RandomPasswordLength": 8,
    "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
    "ConfigurationScript": null,
    "Activation": "ccmactivate",
    "CIRAConfigName": "ciraconfig1"
  },
  {
    "ProfileName": "profile3",
    "AMTPassword": "P@ssw0rd",
    "GenerateRandomPassword": false,
    "RandomPasswordLength": 8,
    "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
    "ConfigurationScript": null,
    "Activation": "invalid",
    "CIRAConfigName": "ciraconfig1"
  },
  {
    "ProfileName": "profile4",
    "AMTPassword": "P@ssw0rd",
    "GenerateRandomPassword": false,
    "RandomPasswordLength": 8,
    "RandomPasswordCharacters": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()",
    "ConfigurationScript": null,
    "Activation": "",
    "CIRAConfigName": "ciraconfig1",
    "NetworkConfigName": "profile1"
  }
];

let NETConfigurations = [
  {
    "ProfileName": "profile1",
    "DHCPEnabled": true,
    "StaticIPShared": true,
    "IPSyncEnabled": true
  },
  {
    "ProfileName": "profile2",
    "DHCPEnabled": true,
    "StaticIPShared": true,
    "IPSyncEnabled": true
  },
  {
    "ProfileName": "profile3",
    "DHCPEnabled": true,
    "StaticIPShared": true,
    "IPSyncEnabled": true
  }
]
describe("Network Profile tests", () => {
  test('delete configuration for network profile with constraint', async () => {

    let netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, Logger("NetConfigDb"));
    let reason
    let actual = await netConfigDb.deleteProfileByName('profile1').catch((error) => { reason = error })
    expect(reason).toEqual("Deletion failed for NETWORK Config: profile1. Profile associated with this Config.");
  });

  test('delete configuration for network profile no constraint', async () => {

    let netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, Logger("NetConfigDb"));
    let reason
    let actual = await netConfigDb.deleteProfileByName('profile2').catch((error) => { reason = error })
    expect(actual).toEqual("NETWORK Config profile2 successfully deleted");
  });

  test('update configuration for network profile exists', async () => {

    let netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, Logger("NetConfigDb"));
    let newProfile = {
      "ProfileName": "profile3",
      "DHCPEnabled": false,
      "StaticIPShared": true,
      "IPSyncEnabled": true
    };
    let actual = await netConfigDb.updateProfile(newProfile)
    expect(actual).toEqual(1)
  });

  test('update configuration for network profile doesnt exist', async () => {

    let netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, Logger("NetConfigDb"));
    let newProfile = {
      "ProfileName": "profile4",
      "DHCPEnabled": false,
      "StaticIPShared": true,
      "IPSyncEnabled": true
    };
    let actual = await netConfigDb.updateProfile(newProfile)
    expect(actual).toEqual(0)
  });

  test('update configuration for network profile associated with profile', async () => {

    let netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, Logger("NetConfigDb"));
    let newProfile = {
      "ProfileName": "profile1",
      "DHCPEnabled": false,
      "StaticIPShared": true,
      "IPSyncEnabled": true
    };
    let reason
    let actual = await netConfigDb.updateProfile(newProfile).catch(error => reason = error)
    expect(reason).toEqual("Operation failed for NETWORK Config: profile1. Cannot Update Network settings if its already associated with a profile.")
  });

  test('create configuration for network profile doesnt exist', async () => {

    let netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, Logger("NetConfigDb"));
    let newProfile = {
      "ProfileName": "profile11",
      "DHCPEnabled": false,
      "StaticIPShared": true,
      "IPSyncEnabled": true
    };
    let reason
    let actual = await netConfigDb.insertProfile(newProfile).catch(error => reason = error)
    expect(actual).toEqual(true)
    });

    test('create configuration for network profile already exist', async () => {

      let netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, Logger("NetConfigDb"));
      let newProfile = {
        "ProfileName": "profile11",
        "DHCPEnabled": false,
        "StaticIPShared": true,
        "IPSyncEnabled": true
      };
      let reason
      let actual = await netConfigDb.insertProfile(newProfile).catch(error => reason = error)
      expect(reason).toEqual("NETWORK Config insertion failed for profile11. NETWORK Config already exists.")
      });


    test('get network configs', async () => {

      let netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, Logger("NetConfigDb"));

      let reason
      let actual = await netConfigDb.getAllProfiles().catch(error => reason = error)
      expect(actual.length).toBeGreaterThan(0)
    });

    test('get network config by name does exist', async () => {

      let netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, Logger("NetConfigDb"));

      let reason
      let actual = await netConfigDb.getProfileByName('profile11').catch(error => reason = error)
      expect(actual).toEqual({
        "ProfileName": "profile11",
        "DHCPEnabled": false,
        "StaticIPShared": true,
        "IPSyncEnabled": true
      })
    });

    test('get network config by name does exist', async () => {

      let netConfigDb = new NetConfigFileStorageDb(AMTConfigurations, NETConfigurations, Logger("NetConfigDb"));

      let reason
      let actual = await netConfigDb.getProfileByName('profile111').catch(error => reason = error)
      expect(actual).toEqual(undefined)
    });

  });