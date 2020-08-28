/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Madhavi Losetty
 **********************************************************************/

export interface IExecutor{
    execute(message: any, clientId: string): Promise<any>;
}