/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { v4 as uuid } from 'uuid'
import { type RPSConfig } from '../../models'
import { devices } from '../../WebSocketListener'

export function setupTestClient (): string {
  const clientId = uuid()
  devices[clientId] = {
    ClientId: clientId,
    ClientSocket: { send: jest.fn() } as any,
    unauthCount: 0
  }
  return clientId
}

export const config: RPSConfig = {
  VaultConfig: {
    usevault: false,
    SecretsPath: 'secret/data/',
    token: '',
    address: 'http://localhost:8200'
  },
  webport: 8081,
  secretsProvider: 'vault',
  credentialspath: '../../../MPS_MicroService/private/data.json',
  corsHeaders: '*',
  corsMethods: '*',
  corsOrigin: '*',
  mpsServer: 'https://localhost:3000',
  delayTimer: 1,
  delayActivationSync: 1,
  delaySetupAndConfigSync: 1,
  delayTlsPutDataSync: 1,
  timemoutWsmanResponse: 1,
  WSConfiguration: {
    WebSocketPort: 8080
  },
  dbProvider: 'postgres',
  connectionString: 'postgresql://postgresadmin:admin123@localhost:5432/rpsdb',
  jwtTenantProperty: '',
  jwtTokenHeader: ''
}
