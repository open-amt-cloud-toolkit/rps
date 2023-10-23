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
  secrets_path: 'secret/data/',
  consul_enabled: true,
  consul_host: 'consul',
  consul_port: '8500',
  consul_key_prefix: 'RPS',
  vault_address: 'http://localhost:8200',
  vault_token: 'myroot',
  web_port: 8081,
  secrets_provider: 'vault',
  cors_headers: '*',
  cors_methods: '*',
  cors_origin: '*',
  mps_server: 'https://localhost:3000',
  delay_timer: 1,
  delay_activation_sync: 1,
  delay_setup_and_config_sync: 1,
  delay_tls_put_data_sync: 1,
  websocketport: 8080,
  db_provider: 'postgres',
  connection_string: 'postgresql://postgresadmin:admin123@localhost:5432/rpsdb',
  jwt_tenant_property: '',
  jwt_token_header: '',
  telegraf_host: 'localhost',
  telegraf_port: 8020
}
