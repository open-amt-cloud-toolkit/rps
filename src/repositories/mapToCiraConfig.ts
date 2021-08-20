
/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { CIRAConfig } from '../RCS.Config'

export function mapToCiraConfig (results): CIRAConfig {
  const config: CIRAConfig = {
    configName: results.cira_config_name,
    mpsServerAddress: results.mps_server_address,
    mpsPort: results.mps_port,
    username: results.user_name,
    password: results.password,
    commonName: results.common_name,
    serverAddressFormat: results.server_address_format, // IPv4 (3), IPv6 (4), FQDN (201)
    authMethod: results.auth_method, // Mutual Auth (1), Username/Password (2) (We only support 2)
    mpsRootCertificate: results.mps_root_certificate, // Assumption is Root Cert for MPS. Need to validate.
    proxyDetails: results.proxydetails,
    tenantId: results.tenant_id,
    regeneratePassword: results.regeneratePassword
  }
  return config
}
