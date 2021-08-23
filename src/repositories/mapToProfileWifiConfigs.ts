/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/
import { ProfileWifiConfigs } from '../RCS.Config'

export function mapToProfileWifiConfigs (results): ProfileWifiConfigs {
  const config: ProfileWifiConfigs = {
    priority: results.priority,
    profileName: results.wireless_profile_name,
    tenantId: results.tenant_id
  }
  return config
}
