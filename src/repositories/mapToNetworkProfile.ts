
/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author : Ramu Bachala
 **********************************************************************/

import { NetworkConfig } from "../RCS.Config";


export function mapToNetworkProfile(results): NetworkConfig {
  return <NetworkConfig>{
    ProfileName: results.network_profile_name,
    DHCPEnabled: results.dhcp_enabled,
    StaticIPShared: results.static_ip_shared,
    IPSyncEnabled: results.ip_sync_enabled
  }
}