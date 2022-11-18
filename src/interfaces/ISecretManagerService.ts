/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export interface ISecretManagerService {
  getSecretFromKey: (path: string, key: string) => Promise<string>
  getSecretAtPath: (path: string) => Promise<any>
  writeSecretWithKey: (path: string, key: string, keyvalue: any) => Promise<any>
  writeSecretWithObject: (path: string, data: any) => Promise<any>
  deleteSecretWithPath: (path: string) => Promise<void>
  health: () => Promise<any>
}
