/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

export const AMTGeneralSettings = {
  AMT_GeneralSettings: {
    response: {
      AMTNetworkEnabled: 1,
      DDNSPeriodicUpdateInterval: 1440,
      DDNSTTL: 900,
      DDNSUpdateByDHCPServerEnabled: true,
      DDNSUpdateEnabled: false,
      DHCPv6ConfigurationTimeout: 0,
      DigestRealm: 'Digest:BA870000000000000000000000000000',
      ElementName: 'Intel(r) AMT: General Settings',
      IdleWakeTimeout: 65535,
      InstanceID: 'Intel(r) AMT: General Settings',
      NetworkInterfaceEnabled: true,
      PingResponseEnabled: true,
      PowerSource: 0,
      PreferredAddressFamily: 0,
      PresenceNotificationInterval: 0,
      PrivacyLevel: 0,
      RmcpPingResponseEnabled: true,
      SharedFQDN: true,
      WsmanOnlyMode: false
    },
    responses: {
      Header: {
        To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
        RelatesTo: 1,
        Action: 'http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse',
        MessageID: 'uuid:00000000-8086-8086-8086-000000006685',
        ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_GeneralSettings',
        Method: 'AMT_GeneralSettings'
      },
      Body: {
        AMTNetworkEnabled: 1,
        DDNSPeriodicUpdateInterval: 1440,
        DDNSTTL: 900,
        DDNSUpdateByDHCPServerEnabled: true,
        DDNSUpdateEnabled: false,
        DHCPv6ConfigurationTimeout: 0,
        DigestRealm: 'Digest:BA870000000000000000000000000000',
        ElementName: 'Intel(r) AMT: General Settings',
        IdleWakeTimeout: 65535,
        InstanceID: 'Intel(r) AMT: General Settings',
        NetworkInterfaceEnabled: true,
        PingResponseEnabled: true,
        PowerSource: 0,
        PreferredAddressFamily: 0,
        PresenceNotificationInterval: 0,
        PrivacyLevel: 0,
        RmcpPingResponseEnabled: true,
        SharedFQDN: true,
        WsmanOnlyMode: false
      }
    },
    status: 200
  }
}

export const IPSHostBasedSetupService = {
  IPS_HostBasedSetupService: {
    response: {
      AllowedControlModes: [
        2,
        1
      ],
      CertChainStatus: 0,
      ConfigurationNonce: 'qZcITXtM6mWXVKMWZDWCjeQIqaA=',
      CreationClassName: 'IPS_HostBasedSetupService',
      CurrentControlMode: 0,
      ElementName: 'Intel(r) AMT Host Based Setup Service',
      Name: 'Intel(r) AMT Host Based Setup Service',
      SystemCreationClassName: 'CIM_ComputerSystem',
      SystemName: 'Intel(r) AMT'
    },
    responses: {
      Header: {
        To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
        RelatesTo: '2',
        Action: 'http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse',
        MessageID: 'uuid:00000000-8086-8086-8086-0000000568D1',
        ResourceURI: 'http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService',
        Method: 'IPS_HostBasedSetupService'
      },
      Body: {
        AllowedControlModes: [
          2,
          1
        ],
        CertChainStatus: 0,
        ConfigurationNonce: 'qZcITXtM6mWXVKMWZDWCjeQIqaA=',
        CreationClassName: 'IPS_HostBasedSetupService',
        CurrentControlMode: 0,
        ElementName: 'Intel(r) AMT Host Based Setup Service',
        Name: 'Intel(r) AMT Host Based Setup Service',
        SystemCreationClassName: 'CIM_ComputerSystem',
        SystemName: 'Intel(r) AMT'
      }
    },
    status: 200
  }
}

export const AdminSetup = {
  Header: {
    To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
    RelatesTo: '7',
    Action: 'http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService/AdminSetupResponse',
    MessageID: 'uuid:00000000-8086-8086-8086-00000000004E',
    ResourceURI: 'http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService',
    Method: 'AdminSetup'
  },
  Body: {
    ReturnValue: 0,
    ReturnValueStr: 'SUCCESS'
  }
}

export const AddNestCertInChain = {
  Header: {
    To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
    RelatesTo: '6',
    Action: 'http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService/AddNextCertInChainResponse',
    MessageID: 'uuid:00000000-8086-8086-8086-00000000004D',
    ResourceURI: 'http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService',
    Method: 'AddNextCertInChain'
  },
  Body: {
    ReturnValue: 0,
    ReturnValueStr: 'SUCCESS'
  }
}

export const AMTEthernetPortSettings = {
  AMT_EthernetPortSettings: {
    responses: [
      {
        DHCPEnabled: true,
        DefaultGateway: '192.168.1.1',
        ElementName: 'Intel(r) AMT Ethernet Port Settings',
        IPAddress: '192.168.1.39',
        InstanceID: 'Intel(r) AMT Ethernet Port Settings 0',
        IpSyncEnabled: true,
        LinkIsUp: true,
        LinkPolicy: [
          1,
          14,
          16
        ],
        MACAddress: '54 - b2 - 03 - 8b- ea - b6',
        PrimaryDNS: '192.168.1.1',
        SharedDynamicIP: true,
        SharedMAC: true,
        SharedStaticIp: false,
        SubnetMask: '255.255.255.0'
      },
      {
        ConsoleTcpMaxRetransmissions: 5,
        DHCPEnabled: true,
        ElementName: 'Intel(r) AMT Ethernet Port Settings',
        InstanceID: 'Intel(r) AMT Ethernet Port Settings 1',
        LinkControl: 2,
        LinkIsUp: false,
        LinkPreference: 2,
        MACAddress: '00 - 00 - 00 - 00 - 00 - 00',
        SharedMAC: true,
        WLANLinkProtectionLevel: 1
      }
    ],
    status: 200
  }
}

export const AMTEthernetPortSettingsResponse = {
  Header: {
    To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
    RelatesTo: 4,
    Action: 'http://schemas.xmlsoap.org/ws/2004/09/transfer/PutResponse',
    MessageID: 'uuid:00000000-8086-8086-8086-000000006688',
    ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_EthernetPortSettings',
    Method: 'AMT_EthernetPortSettings'
  },
  Body: {
    DHCPEnabled: true,
    DefaultGateway: '192.168.1.1',
    ElementName: 'Intel(r) AMT Ethernet Port Settings',
    IPAddress: '192.168.1.39',
    InstanceID: 'Intel(r) AMT Ethernet Port Settings 0',
    IpSyncEnabled: true,
    LinkIsUp: true,
    LinkPolicy: [
      1,
      14,
      16
    ],
    MACAddress: '54-b2-03-8b-ea-b6',
    PrimaryDNS: '192.168.1.1',
    SharedDynamicIP: true,
    SharedMAC: true,
    SharedStaticIp: false,
    SubnetMask: '255.255.255.0'
  }
}

export const CIMWiFiPortResponse = {
  Header: {
    To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
    RelatesTo: 6,
    Action: 'http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse',
    MessageID: 'uuid:00000000-8086-8086-8086-000000000EA6',
    ResourceURI: 'http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_WiFiPort',
    Method: 'CIM_WiFiPort'
  },
  Body: {
    CreationClassName: 'CIM_WiFiPort',
    DeviceID: 'WiFi Port 0',
    ElementName: 'WiFi Port 0',
    EnabledState: 32769,
    HealthState: 5,
    LinkTechnology: 11,
    PermanentAddress: '58a0239a79af',
    PortType: 0,
    RequestedState: 32769,
    SystemCreationClassName: 'CIM_ComputerSystem',
    SystemName: 'Intel(r) AMT'
  }
}

export const AddWiFiSettingsResponse = {
  Header: {
    To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
    RelatesTo: 5,
    Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_WiFiPortConfigurationService/AddWiFiSettingsResponse',
    MessageID: 'uuid:00000000-8086-8086-8086-00000000012E',
    ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_WiFiPortConfigurationService',
    Method: 'AddWiFiSettings'
  },
  Body: {
    WiFiEndpointSettings: {
      Address: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
      ReferenceParameters: {
        ResourceURI: 'http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_WiFiEndpointSettings',
        SelectorSet: {
          Selector: {
            Value: 'Intel(r) AMT:WiFi Endpoint Settings home',
            Name: 'InstanceID'
          }
        }
      }
    },
    ReturnValue: 0,
    ReturnValueStr: 'SUCCESS'
  }
}
