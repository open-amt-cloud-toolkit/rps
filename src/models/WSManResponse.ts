/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Mike Johanson
 **********************************************************************/

export interface AMTEthernetPortSettings {
    // The user-friendly name for this instance of SettingData . . .
    ElementName: string
    // Within the scope of he instantiating Namespace, InstanceID opaquely and uniquely identifies an instance of this class. (Key)
    InstanceID: string
    // Indicates whether VLAN is in use and what is the VLAN tag when used.
    VLANTag: number
    // Indicates whether Intel(R) AMT shares it's MAC address with the host system.
    SharedMAC: boolean
    // The MAC address used by Intel(R) AMT in a string format . . .
    MACAddress: string
    // Indicates whether the network link is up
    LinkIsUp: boolean
    // Enumeration values for link policy restrictions for better power consumption . . .
    LinkPolicy: number[]
    // Determines whether the link is preferred to be owned by ME or host
    LinkPreference: number
    // Determines whether the link is owned by ME or host
    LinkControl: number
    // Indicates whether the static host IP is shared with ME.
    SharedStaticIp: boolean
    // Indicates whether the dynamic host IP is shared with ME.
    SharedDynamicIP: boolean
    // Indicates whether the IP synchronization between host and ME is enabled.
    IpSyncEnabled: boolean
    // Indicates whether DHCP is in use.
    DHCPEnabled: boolean
    // String representation of IP address . . .
    IPAddress: string
    // Subnet mask in a string format.For example: 255.255.0.0
    SubnetMask: string
    // Default Gateway in a string format . . .
    DefaultGateway: string
    // Primary DNS in a string format . . .
    PrimaryDNS: string
    // Secondary DNS in a string format . . .
    SecondaryDNS: string
    // Indicates the number of retransmissions host TCP SW tries ifno ack is accepted
    ConsoleTcpMaxRetransmissions: number
    // Defines the level of the link protection feature activation . . .
    WLANLinkProtectionLevel: number
    // Indicates the physical connection type of this network interface.
    PhysicalConnectionType: number
    // Indicates which medium is currently used by Intel® AMT to communicate with the NIC .
    PhysicalNicMedium: number
}

export interface AMTGeneralSettings {
    // The user-friendly name for this instance of SettingData
    ElementName?: string
    // Within the scope of the instantiating Namespace, InstanceID opaquely and uniquely identifies an instance of this class. (KEY)
    InstanceID?: string
    // Indicates whether the network interface is enabled
    NetworkInterfaceEnabled?: boolean
    // The Intel(R) AMT device Digest Authentication Realm parameter as defined by RFC 2617.
    DigestRealm?: string
    // Defines the minimum time value, in minutes, that Intel(R) AMT will be powered after waking up from a sleep power state, or after the host enters sleep or off state.This timer value will be reloaded whenever Intel(R) AMT is servicing requests
    IdleWakeTimeout?: number
    // Intel(R) AMT host setting.
    HostName?: string
    // Intel(R) AMT domain name setting.
    DomainName?: string
    // Indicates whether Intel(R) AMT should respond to ping Echo Request messages.
    PingResponseEnabled?: boolean
    // Indicates whether Intel(R) AMT should block network interfaces other than WS-Management.
    WsmanOnlyMode?: boolean
    // Preferred Address Family (IPv4/IPv6).
    PreferredAddressFamily?: number
    // Defines the Maximum Duration (DHCPv6 MRD for the Solicit Message) in seconds during which the Intel(R) ME FW tries to locate a DHCPv6 server
    DHCPv6ConfigurationTimeout?: number
    // Defines whether the Dynamic DNS Update Client in FW is enabled or not
    DDNSUpdateEnabled?: boolean
    // If the DDNS Update client in FW is disabled then this property will define whether DDNS Update should be requested from the DHCP Server for the shared IPv4 address and shared FQDN
    DDNSUpdateByDHCPServerEnabled?: boolean
    // Defines Whether the FQDN (HostName.DomainName) is shared with the Host or dedicated to ME
    SharedFQDN?: boolean
    // Intel(R) AMT host OS FQDN
    HostOSFQDN?: string
    // Defines the Time To Live value (cachable time) of RRs registered by the FW DDNSUpdateClient
    DDNSTTL?: number
    // When set to Disabled, the AMT OOB network interfaces (LAN and WLAN) are disabled including AMT user initiated applications, Environment Detection and RMCPPing
    AMTNetworkEnabled?: number
    // Indicates whether Intel(R) AMT should respond to RMCP ping Echo Request messages.
    RmcpPingResponseEnabled?: boolean
    // Defines the interval at which the FW DDNS Update client will send periodic updates for all the RRs registered by FW
    DDNSPeriodicUpdateInterval?: number
    // Defines the interval at which the FW will send periodic WS-management events notifications (for the subscribed clients) whenever network settings are changed
    PresenceNotificationInterval?: number
    // Defines the Privacy Level setting. Privacy Level defines the values for privacy-related parameters by default and upon ME-unconfigure event.The setting can have the following values?: Default?: SOL enabled = true, IDER enabled = true, KVM enabled = true, Opt-in can be disabled = true, opt-in configurable remotely = true
    PrivacyLevel?: number
    // The system current power source
    PowerSource?: number
    // When set to Disabled, a management console cannot communicate with Intel AMT via a Thunderbolt dock.
    ThunderboltDockEnabled?: number
}
