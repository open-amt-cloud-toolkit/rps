
/*********************************************************************
 * Copyright (c) Intel Corporation 2021
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { WirelessConfig } from '../RCS.Config'

export function mapToWirelessProfile (results): WirelessConfig {
  const config: WirelessConfig = {
    profileName: results.wireless_profile_name,
    authenticationMethod: results.authentication_method,
    encryptionMethod: results.encryption_method,
    ssid: results.ssid,
    pskValue: results.psk_value,
    pskPassphrase: results.psk_passphrase,
    linkPolicy: results.link_policy
  }
  return config
}
