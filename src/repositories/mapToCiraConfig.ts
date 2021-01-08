
/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { CIRAConfig } from '../RCS.Config'

export function mapToCiraConfig (results): CIRAConfig {
  return <CIRAConfig>{
    ConfigName: results.cira_config_name,
    MPSServerAddress: results.mps_server_address,
    MPSPort: results.mps_port,
    Username: results.user_name,
    Password: results.password,
    CommonName: results.common_name,
    ServerAddressFormat: results.server_address_format, // IPv4 (3), IPv6 (4), FQDN (201)
    AuthMethod: results.auth_method, // Mutual Auth (1), Username/Password (2) (We only support 2)
    MPSRootCertificate: results.mps_root_certificate, // Assumption is Root Cert for MPS. Need to validate.
    ProxyDetails: results.proxydetails
  }
}
