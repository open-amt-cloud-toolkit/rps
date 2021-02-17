
/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { NetworkConfig } from '../RCS.Config'

export function mapToNetworkProfile (results): NetworkConfig {
  return {
    profileName: results.network_profile_name,
    dhcpEnabled: results.dhcp_enabled,
    staticIPShared: results.static_ip_shared,
    ipSyncEnabled: results.ip_sync_enabled
  } as NetworkConfig
}
