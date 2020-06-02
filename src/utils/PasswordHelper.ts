/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: password related functions
 **********************************************************************/

import * as crypto from 'crypto';
import { AMTRandomPasswordChars } from "../utils/constants";
const cryptoRandomString = require('crypto-random-string');

export class PasswordHelper {

    /**
    * @description Generates the console nonce used validate the console.  AMT only accepts a nonce that is 20 bytes long of random data
    * @returns {buffer} Returns console nonce used to verify RCS server to AMT
    */
    public static generateNonce(): Buffer {
        let nonce = Buffer.from(crypto.randomBytes(20), 0, 20);
        return nonce;
    }

    /**
     * @description Checks the proposed AMT password against AMT password requirements
     * @param {string} password Password string to test
     * @returns {boolean} Returns true if password meets AMT password requirements
     */
    public static passwordCheck(password: string): boolean {
        let pass: boolean;
        let len: number = 8;
        let maxLen: number = 32;
        let matches = new Array<string>();
        matches.push("[$@$!%*#?&]");
        matches.push("[A-Z]");
        matches.push("[0-9]");
        matches.push("[a-z]");
        let n = 0;
        for (let i = 0; i < matches.length; i++) {
            if (new RegExp(matches[i]).test(password)) {
                n++;
            }
        }

        if (password.length < len || password.length > maxLen || n < 4) {
            pass = false;
        } else {
            pass = true;
        }
        return pass;
    }

    /**
     * @description Generates a random password out of a given set of characters and of a given length
     * @param {number} length Length of desired password
     * @returns {string} Returns random password string
     */
    public static generateRandomPassword(length: number): string {

        for (let i = 0; i < 10000; ++i) {
            let password: string = cryptoRandomString({ length: length, characters: AMTRandomPasswordChars });

            if (PasswordHelper.passwordCheck(password)) {
                return password;
            }
        }

        return null;
    }
}