/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { VersionChecker } from "../VersionChecker";
import { Version } from "../models/Rcs";
import { RPSError } from "../utils/RPSError";
test('test version string parsing', () => {

    let versionString: string = "1.2.3";

    let result: Version = VersionChecker.parseString(versionString);

    expect(result.major).toBe(1);
    expect(result.minor).toBe(2);
    expect(result.revision).toBe(3);
});

test('test version string parsing with format x.x', () => {

    let versionString: string = "1.2";

    let result: Version = VersionChecker.parseString(versionString);

    expect(result.major).toBe(1);
    expect(result.minor).toBe(2);
    expect(result.revision).toBe(0);
});

test('test version string parsing with format x', () => {

    let versionString: string = "1";

    let result: Version = VersionChecker.parseString(versionString);

    expect(result.major).toBe(1);
    expect(result.minor).toBe(0);
    expect(result.revision).toBe(0);
});


test('test version string parsing empty exception', () => {

    let versionString: string = "";
    let rpsError;

    try {
        let result: Version = VersionChecker.parseString(versionString);
    } catch (error) {
        rpsError = error;
    }

    expect(rpsError).toBeInstanceOf(RPSError);
    expect(rpsError.message).toEqual(
        `version must be defined`
    );
});

test('test version string parsing undefined exception', () => {

    let versionString: string;
    let rpsError;

    try {
        let result: Version = VersionChecker.parseString(versionString);
    } catch (error) {
        rpsError = error;
    }

    expect(rpsError).toBeInstanceOf(RPSError);
    expect(rpsError.message).toEqual(
        `version must be defined`
    );
});


test('test version string parsing longer length', () => {

    let versionString: string = "1.2.3.4";
    let rpsError;

    try {
        let result: Version = VersionChecker.parseString(versionString);
    } catch (error) {
        rpsError = error;
    }

    expect(rpsError).toBeInstanceOf(RPSError);
    expect(rpsError.message).toEqual(
        `invalid version string length`
    );
});


test('test version string compatibility with older message', () => {

    let currentVersion: string = "2.0.0";
    let messageVersion: string = "1.2.3";

    VersionChecker.setCurrentVersion(currentVersion);
    let result: boolean = VersionChecker.isCompatible(messageVersion);
    expect(result).toBeFalsy();
});

test('test version string compatibility with newer message older server', () => {

    let currentVersion: string = "2.0.0";
    let messageVersion: string = "3.2.3";

    VersionChecker.setCurrentVersion(currentVersion);
    let result: boolean = VersionChecker.isCompatible(messageVersion);
    expect(result).toBeFalsy();
});


test('test version string compatibility newer minor version message', () => {

    let currentVersion: string = "2.1.3";
    let messageVersion: string = "2.2.2";

    VersionChecker.setCurrentVersion(currentVersion);
    let result: boolean = VersionChecker.isCompatible(messageVersion);
    expect(result).toBeFalsy();
});

test('test version string compatibility newer revision message', () => {

    let currentVersion: string = "2.2.3";
    let messageVersion: string = "2.2.4";

    VersionChecker.setCurrentVersion(currentVersion);
    let result: boolean = VersionChecker.isCompatible(messageVersion);
    expect(result).toBeFalsy();
});



test('test version string compatibility newer server than message', () => {

    let currentVersion: string = "2.1.2";
    let messageVersion: string = "2.0.3";

    VersionChecker.setCurrentVersion(currentVersion);
    let result: boolean = VersionChecker.isCompatible(messageVersion);
    expect(result).toBeTruthy();
});


test('test version string compatibility newer minor version', () => {

    let messageVersion: string = "2.1.3";
    let currentVersion: string = "2.2.2";

    VersionChecker.setCurrentVersion(currentVersion);
    let result: boolean = VersionChecker.isCompatible(messageVersion);
    expect(result).toBeTruthy();
});

test('test version string compatibility newer revision', () => {

    let messageVersion: string = "2.2.3";
    let currentVersion: string = "2.2.4";

    VersionChecker.setCurrentVersion(currentVersion);
    let result: boolean = VersionChecker.isCompatible(messageVersion);
    expect(result).toBeTruthy();
});


test('test version string with invalid chars', () => {

    let messageVersion: string = "a.2.3";
    let currentVersion: string = "2.2.4";

    let rpsError;
    try {
        VersionChecker.setCurrentVersion(currentVersion);
        let result: boolean = VersionChecker.isCompatible(messageVersion);
    } catch (error) {
        rpsError = error;
    }

    expect(rpsError).toBeInstanceOf(RPSError);
    expect(rpsError.message).toEqual(
        `failed to parse major`
    );
});

test('test version string with invalid chars', () => {

    let messageVersion: string = "2.e.3";
    let currentVersion: string = "2.2.4";

    let rpsError;
    try {
        VersionChecker.setCurrentVersion(currentVersion);
        let result: boolean = VersionChecker.isCompatible(messageVersion);
    } catch (error) {
        rpsError = error;
    }

    expect(rpsError).toBeInstanceOf(RPSError);
    expect(rpsError.message).toEqual(
        `failed to parse minor`
    );
});

test('test version string with invalid chars', () => {

    let messageVersion: string = "2.2.t";
    let currentVersion: string = "2.2.4";

    let rpsError;
    try {
        VersionChecker.setCurrentVersion(currentVersion);
        let result: boolean = VersionChecker.isCompatible(messageVersion);
    } catch (error) {
        rpsError = error;
    }

    expect(rpsError).toBeInstanceOf(RPSError);
    expect(rpsError.message).toEqual(
        `failed to parse revision`
    );
});

