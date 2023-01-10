/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { RPSConfig } from '../../models'

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
  delayTimer: 12,
  WSConfiguration: {
    WebSocketPort: 8080
  },
  dbProvider: 'postgres',
  connectionString: 'postgresql://postgresadmin:admin123@localhost:5432/rpsdb'
}
