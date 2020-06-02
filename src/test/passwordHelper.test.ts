/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { PasswordHelper } from '../utils/PasswordHelper'

test('check password length', () => {

    let input: string = "aB$1abc";
    let actual = PasswordHelper.passwordCheck(input);
    expect(actual).toBeFalsy();
});

test('check password length', () => {

    let input: string = "aB$1abcd";
    let actual = PasswordHelper.passwordCheck(input);
    expect(actual).toBeTruthy();
});

test('check password complexity', () => {

    let input: string = "aB11abcd";
    let actual = PasswordHelper.passwordCheck(input);
    expect(actual).toBeFalsy();
});

test('check password length', () => {

    let input: string = "aB$1abcdefghijklmnopqrstuvwxyz123";
    let actual = PasswordHelper.passwordCheck(input);
    expect(actual).toBeFalsy();
});

test('check password length', () => {

    let input: string = "aB$1abcdefghijklmnopqrstuvwxyz12";
    let actual = PasswordHelper.passwordCheck(input);
    expect(actual).toBeTruthy();
});


test('check password length', () => {

    let actual = PasswordHelper.generateRandomPassword(20);
    expect(actual.length).toBe(20);
});