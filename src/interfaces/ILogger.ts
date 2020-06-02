/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/

export interface ILogger{
    debug(log: string, ...params: any[]):void;
    info(log: string, ...params: any[]): void;
    warn(log: string, ...params: any[]): void;
    error(log: string, ...params: any[]): void;
}