/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type RPSConfig } from '../../models'

export const config: RPSConfig = {
  secrets_path: 'secret/data/',
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
  jwt_token_header: ''
}
