/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import Logger from '../Logger'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { v4 as uuid } from 'uuid'
import { EnvReader } from '../utils/EnvReader'
import { config } from '../test/helper/Config'
import { Maintenance } from './Maintenance'
import { HttpHandler } from '../HttpHandler'
import { devices } from '../WebSocketListener'
EnvReader.GlobalEnvConfig = config
const responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
const httpHandler = new HttpHandler()
const maintenance = new Maintenance(new Logger('Maintenance'), responseMsg)
let maintenanceMsg
describe('execute', () => {
  beforeEach(() => {
    maintenanceMsg = {
      method: 'maintenance',
      apiKey: 'key',
      appVersion: '1.0.0',
      protocolVersion: '4.0.0',
      status: 'ok',
      message: 'ok',
      fqdn: '',
      uuid: '4c4c4544-005a-3510-804b-b4c04f564433',
      payload: {
        ver: '15.0.23',
        build: '1706',
        sku: '16392',
        uuid: '4c4c4544-005a-3510-804b-b4c04f564433',
        username: '$$OsAdmin',
        password: 'P@ssw0rd',
        currentMode: 0,
        hostname: 'DESKTOP-B22S514',
        fqdn: 'vprodemo.com',
        client: 'RPC',
        certHashes: [
          'c3846bf24b9e93ca64274c0ec67c1ecc5e024ffcacd2d74019350e81fe546ae4',
          '45140b3247eb9cc8c5b4f0d7b53091f73292089e6e5a63e2749dd3aca9198eda'
        ],
        task: 'synctime'
      }
    }
  })
  const digestChallenge = {
    realm: 'Digest:AF541D9BC94CFF7ADFA073F492F355E6',
    nonce: 'dxNzCQ9JBAAAAAAAd2N7c6tYmUl0FFzQ',
    stale: 'false',
    qop: 'auth'
  }
  const connectionParams = {
    guid: '4c4c4544-004b-4210-8033-b6c04f504633',
    port: 16992,
    digestChallenge: digestChallenge,
    username: 'admin',
    password: 'P@ssw0rd'
  }
  test('should return success response for successful timesync response', async () => {
    const clientId = uuid()
    devices[clientId] = { ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg, connectionParams: connectionParams, unauthCount: 0 }
    const result = await maintenance.execute(maintenanceMsg, clientId, httpHandler)
    expect(result.method).toBe('wsman')
  })
  test('should return failure message for maintenance task does not exists', async () => {
    const clientId = uuid()
    maintenanceMsg.payload.task = 'setMEBXPassword'
    devices[clientId] = { ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg, unauthCount: 0 }
    const result = await maintenance.execute(maintenanceMsg, clientId, httpHandler)
    expect(result.method).toBe('error')
  })
})
