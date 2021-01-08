export const AMTGeneralSettings = {
  AMT_GeneralSettings: {
    response: {
      AMTNetworkEnabled: 1,
      DDNSPeriodicUpdateInterval: 1440,
      DDNSTTL: 900,
      DDNSUpdateByDHCPServerEnabled: true,
      DDNSUpdateEnabled: false,
      DHCPv6ConfigurationTimeout: 0,
      DigestRealm: 'Digest:A4070000000000000000000000000000',
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
        RelatesTo: '1',
        Action: 'http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse',
        MessageID: 'uuid:00000000-8086-8086-8086-0000000568D0',
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
        DigestRealm: 'Digest:A4070000000000000000000000000000',
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
