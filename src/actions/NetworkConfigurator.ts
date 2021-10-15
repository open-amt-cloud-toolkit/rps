/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description:Configure Network settings on AMT device
 * Author : Madhavi Losetty
 **********************************************************************/

import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { ClientAction, ClientMsg, ClientObject, ProfileWifiConfigs } from '../models/RCS.Config'
import { IConfigurator } from '../interfaces/IConfigurator'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { WSManProcessor } from '../WSManProcessor'
import { IClientManager } from '../interfaces/IClientManager'
import { IValidator } from '../interfaces/IValidator'
import { CIRAConfigurator } from './CIRAConfigurator'
import { AMTGeneralSettings, AMTEthernetPortSettings, AddWiFiSettingsResponse, CIM_WiFiPortResponse, WiFiEndPointSettings, AMT_WiFiPortConfigurationService, AMT_WiFiPortConfigurationServiceResponse } from '../models/WSManResponse'
import { AMTUserName, WIFIENDPOINT } from './../utils/constants'
import { AMTConfiguration } from '../models/Rcs'
import { MqttProvider } from '../utils/MqttProvider'
import { RPSError } from '../utils/RPSError'
import { DbCreatorFactory } from '../repositories/factories/DbCreatorFactory'
import { EnvReader } from '../utils/EnvReader'

export class NetworkConfigurator implements IExecutor {
  constructor (
    private readonly logger: ILogger,
    private readonly configurator: IConfigurator,
    private readonly responseMsg: ClientResponseMsg,
    private readonly amtwsman: WSManProcessor,
    private readonly clientManager: IClientManager,
    private readonly validator: IValidator,
    private readonly CIRAConfigurator: CIRAConfigurator
  ) { }

  /**
   * @description Set wired network configuration on AMT
   * @param {any} message valid client message
   * @param {string} clientId Id to keep track of connections
   * @returns {ClientMsg} message to sent to client
   */
  async execute (message: any, clientId: string): Promise<ClientMsg> {
    let clientObj: ClientObject
    try {
      await this.processWSManJsonResponses(message, clientId)
      clientObj = this.clientManager.getClientObject(clientId)
      const payload: any = clientObj.ClientData.payload
      if (!clientObj.network?.getWiFiPortCapabilities) {
        // gets all the existing wifi profiles from the device
        await this.amtwsman.batchEnum(clientId, 'CIM_WiFiEndpointSettings', AMTUserName, payload.password)
        clientObj.network.getWiFiPortCapabilities = true
        this.clientManager.setClientObject(clientObj)
      } else if (clientObj.network?.WiFiPortCapabilities?.length >= 0 && !clientObj.network?.isWiFiConfigsDeleted) {
        // if one or more wifi profiles exists in device, they will be deleted
        await this.deleteWiFiConfigs(clientObj, clientId)
      } else if (!clientObj.network?.setWiFiPort && clientObj.network.setEthernetPortSettings && payload.profile.wifiConfigs?.length > 0 && payload.profile.dhcpEnabled) {
        // Enumeration 32769 - WiFi is enabled in S0 + Sx/AC
        await this.amtwsman.setWiFiPort(clientId, 32769)
        clientObj.network.setWiFiPort = true
        this.clientManager.setClientObject(clientObj)
      } else if (clientObj.network.setWiFiPort && payload.profile.wifiConfigs?.length > 0 && clientObj.network.count <= payload.profile.wifiConfigs?.length - 1 && payload.profile.dhcpEnabled) {
        await this.addWifiConfigs(clientObj, clientId, payload.profile.wifiConfigs)
      } else if (clientObj.network?.getWiFiPortConfigurationService) {
        // If all wiFi configs are added, then move to CIRA config.
        await this.callCIRAConfig(clientId, clientObj, 'ethernet and wifi settings are updated', message)
      }
    } catch (error) {
      this.logger.error(`${clientId} : Failed to configure network settings : ${error}`)
      MqttProvider.publishEvent('fail', ['NetworkConfigurator'], 'Failed', clientObj.uuid)
      if (error instanceof RPSError) {
        clientObj.status.Network = error.message
      } else {
        clientObj.status.Network = 'Failed'
      }
      return this.responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify(clientObj.status))
    }
  }

  /**
   * @description Parse the wsman response received from AMT
   * @param {string} clientId Id to keep track of connections
   * @param {string} message
   */
  async processWSManJsonResponses (message: any, clientId: string): Promise<void> {
    const clientObj: ClientObject = this.clientManager.getClientObject(clientId)
    const wsmanResponse = message?.payload
    if (wsmanResponse?.AMT_GeneralSettings != null) {
      await this.processGeneralSettings(message, clientId)
    } else if (wsmanResponse?.AMT_EthernetPortSettings != null || wsmanResponse?.Header?.Method === 'AMT_EthernetPortSettings') {
      await this.processEthernetPortSettings(message, clientId)
    } else if (wsmanResponse?.Header?.Method === 'AddWiFiSettings') {
      await this.processWiFiEndpointSettings(message, clientId)
    } else if (wsmanResponse?.Header?.Method === 'CIM_WiFiPort') {
      await this.processWiFiPortResponse(message, clientId)
    } else if (wsmanResponse?.CIM_WiFiEndpointSettings != null) {
      clientObj.network.WiFiPortCapabilities = wsmanResponse.CIM_WiFiEndpointSettings.responses
      this.clientManager.setClientObject(clientObj)
    } else if (wsmanResponse?.AMT_WiFiPortConfigurationService != null) {
      await this.processWiFiPortConfigurationService(clientObj, message, clientId)
    } else if (wsmanResponse?.Header?.Method === 'AMT_WiFiPortConfigurationService') {
      if (wsmanResponse?.Body?.localProfileSynchronizationEnabled !== 1) {
        this.logger.warn(`Failed to update localProfileSynchronization for device: ${clientObj.uuid}`)
      }
      clientObj.network.getWiFiPortConfigurationService = true
      this.clientManager.setClientObject(clientObj)
    }
  }

  /**
   * @description Parse the WiFi port response received from AMT
   * @param {string} clientId Id to keep track of connections
   * @param {string} message
   */
  async processWiFiPortResponse (message: any, clientId: string): Promise<void> {
    const wsmanResponse: CIM_WiFiPortResponse = message?.payload
    const clientObj = this.clientManager.getClientObject(clientId)
    // 3 - WiFi is disabled
    // 32768 - WiFi is enabled in S0
    // 32769 - WiFi is enabled in S0 + Sx/AC
    /* RequestedState is an integer enumeration that indicates the last requested or desired state for the element, irrespective of the mechanism through which it was requested.
     The actual state of the element is represented by EnabledState. */
    // EnabledState is an integer enumeration that indicates the enabled and disabled states of an element. It can also indicate the transitions between these requested states.
    if (wsmanResponse.Body.EnabledState !== 32769 || wsmanResponse.Body.RequestedState !== 32769) {
      await this.callCIRAConfig(clientId, clientObj, 'Ethernet Configured. WiFi Failed', wsmanResponse)
    } else {
      clientObj.network.setWiFiPortResponse = true
      clientObj.network.count = 0
      this.clientManager.setClientObject(clientObj)
    }
  }

  /**
   * @description Parse the WiFi Endpoint Settings response received from AMT
   * @param {string} clientId Id to keep track of connections
   * @param {string} message
   */
  async processWiFiEndpointSettings (message: any, clientId: string): Promise<void> {
    const wsmanResponse = message?.payload
    const clientObj = this.clientManager.getClientObject(clientId)
    const payload: any = clientObj.ClientData.payload
    const response: AddWiFiSettingsResponse = wsmanResponse
    if (response.Header?.Method === 'AddWiFiSettings' && response.Body?.ReturnValue !== 0) {
      // If ReturnValue is not zero in response to add WiFi setttings, then move to CIRA config.
      // ReturnValueMap={0, 1, 2, 3, 4, .., 32768..65535}
      // Values={Completed with No Error, Not Supported, Failed, Invalid Parameter, Invalid Reference, Method Reserved, Vendor Specific}
      await this.callCIRAConfig(clientId, clientObj, 'Ethernet Configured. WiFi Failed', wsmanResponse)
    } else if (clientObj.network.count > payload.profile.wifiConfigs.length - 1) {
      // If all wiFi configs are added, Get AMT_WiFiPortConfigurationService to localProfileSynchronizationEnabled
      await this.amtwsman.batchEnum(clientId, '*AMT_WiFiPortConfigurationService', AMTUserName, clientObj.ClientData.payload.uuid)
    } else {
      this.logger.debug(`Device ${clientObj.uuid} add WiFi Settings ${response.Body?.ReturnValue}}`)
    }
  }

  /**
   * @description Parse the AMT_GeneralSettings response received from AMT
   * @param {string} clientId Id to keep track of connections
   * @param {string} message
   */
  async processGeneralSettings (message: any, clientId: string): Promise<void> {
    const wsmanResponse = message?.payload
    const response: AMTGeneralSettings = wsmanResponse?.AMT_GeneralSettings.response
    // AMTNetworkEnabled - When set to Disabled, the AMT OOB network interfaces (LAN and WLAN) are disabled including AMT user initiated applications, Environment Detection and RMCPPing.
    // 0 : Disabled, 1 - Enabled
    // SharedFQDN -Defines Whether the FQDN (HostName.DomainName) is shared with the Host or dedicated to ME. (The default value for this property is shared - TRUE).
    // RmcpPingResponseEnabled - Indicates whether Intel(R) AMT should respond to RMCP ping Echo Request messages.
    if (!response.SharedFQDN || response.AMTNetworkEnabled !== 1 || !response.RmcpPingResponseEnabled) {
      response.SharedFQDN = true
      response.AMTNetworkEnabled = 1
      response.RmcpPingResponseEnabled = true
      await this.amtwsman.put(clientId, 'AMT_GeneralSettings', response)
    } else {
      // If the network is enabled, get call to AMT_EthernetPortSettings
      await this.amtwsman.batchEnum(clientId, 'AMT_EthernetPortSettings')
    }
  }

  /**
   * @description Parse the get and set of AMT_EthernetPortSettings response received from AMT
   * @param {string} clientId Id to keep track of connections
   * @param {string} message
   */
  async processEthernetPortSettings (message: any, clientId: string): Promise<void> {
    const wsmanResponse = message?.payload
    const clientObj = this.clientManager.getClientObject(clientId)
    if (!clientObj.network?.setEthernetPortSettings && wsmanResponse?.AMT_EthernetPortSettings != null) {
      // Assume first entry is WIRED network port
      const response: AMTEthernetPortSettings = wsmanResponse.AMT_EthernetPortSettings.responses[0]
      const amtProfile: AMTConfiguration = clientObj.ClientData.payload.profile
      if (amtProfile.dhcpEnabled) {
        response.DHCPEnabled = true
        response.SharedStaticIp = false
        if (wsmanResponse.AMT_EthernetPortSettings.responses.length > 1) {
          // If the array length is greater than one, device has WiFi capabilities and storing temporarly for next steps if the profile has wifi configs to be configured.
          clientObj.network.ethernetSettingsWifiObj = wsmanResponse.AMT_EthernetPortSettings.responses[1]
          this.clientManager.setClientObject(clientObj)
        }
      } else {
        response.DHCPEnabled = false
        response.SharedStaticIp = true
      }
      response.IpSyncEnabled = true
      if (response.DHCPEnabled || response.IpSyncEnabled) {
        // When 'DHCPEnabled' property is set to true the following properties should be set to NULL:
        // SubnetMask, DefaultGateway, IPAddress, PrimaryDNS, SecondaryDNS.
        response.SubnetMask = null
        response.DefaultGateway = null
        response.IPAddress = null
        response.PrimaryDNS = null
        response.SecondaryDNS = null
      } else {
        // TBD: To set static IP address the values should be read from the REST API
        // response.SubnetMask = "255.255.255.0";
        // response.DefaultGateway = "192.168.1.1";
        // response.IPAddress = "192.168.1.223";
        // response.PrimaryDNS = "192.168.1.1";
        // response.SecondaryDNS = "192.168.1.1";
      }
      this.logger.debug(`Updated Network configuration to set on device :  ${JSON.stringify(response, null, '\t')}`)
      // put request to update ethernet port settings on the device
      await this.amtwsman.put(clientId, 'AMT_EthernetPortSettings', response)
    } else {
      const response: AMTEthernetPortSettings = wsmanResponse.Body
      const payload: any = clientObj.ClientData.payload
      if (!response.IpSyncEnabled) {
        // If the IpSyncEnabled is not set to true in the response to the put request of ethernet port settings, then it is considered as failed and move to CIRA config.
        this.logger.debug(`Device ${clientObj.uuid} Failed to set IpSyncEnabled to true `)
        await this.callCIRAConfig(clientId, clientObj, 'Failed', message)
      } else if (response.SharedStaticIp && response.IpSyncEnabled) {
        // If the IpSyncEnabled is true and SharedStaticIp is true in the response to the put request of ethernet port settings, then move to CIRA config.
        await this.callCIRAConfig(clientId, clientObj, 'Ethernet Configured', message)
      } else if (response.DHCPEnabled && response.IpSyncEnabled) {
        // If the IpSyncEnabled, DHCPEnabled is true and profile has no wifi configs
        if (payload.profile.wifiConfigs.length === 0) {
          await this.callCIRAConfig(clientId, clientObj, 'Ethernet Configured', message)
        } else if (clientObj.network.ethernetSettingsWifiObj == null && payload.profile.wifiConfigs.length > 0) {
          // If the IpSyncEnabled, DHCPEnabled is true and profile has wifi configs but no wifi capabilities
          this.logger.debug(`Device ${clientObj.uuid} Ethernet Configured. No wireless interface`)
          await this.callCIRAConfig(clientId, clientObj, 'Ethernet Configured. WiFi Failed', message)
        }
      }
      // Set the flag that ethernet port settings is updated.
      clientObj.network.setEthernetPortSettings = true
      this.clientManager.setClientObject(clientObj)
    }
  }

  async callCIRAConfig (clientId: string, clientObj: ClientObject, status: string, message: any): Promise<void> {
    this.logger.debug(`Device ${clientObj.uuid} ${status} with the profile : ${clientObj.ClientData.payload.profile.profileName}`)
    clientObj.status.Network = `${status}.`
    MqttProvider.publishEvent('success', ['NetworkConfigurator'], `Status : ${status}`, clientObj.uuid)
    clientObj.action = ClientAction.CIRACONFIG
    this.clientManager.setClientObject(clientObj)
    await this.CIRAConfigurator.execute(message, clientId)
  }

  /**
   * @description add WiFi config to AMT
   * @param {string} clientId Id to keep track of connections
   * @param {ProfileWifiConfigs[]} wifiConfigs
   * @param {ClientObject} clientObj
   */
  async addWifiConfigs (clientObj: ClientObject, clientId: string, wifiConfigs: ProfileWifiConfigs[]): Promise<void> {
    if (clientObj.network.count <= wifiConfigs.length - 1) {
      // TODO: Don't love it
      const dbf = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
      const db = await dbf.getDb()
      // Get WiFi profile information based on the profile name.
      const wifiConfig = await db.wirelessProfiles.getByName(wifiConfigs[clientObj.network.count].profileName)
      if (this.configurator?.secretsManager) {
        const data: any = await this.configurator.secretsManager.getSecretAtPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}Wireless/${wifiConfig.profileName}`)
        if (data != null) {
          wifiConfig.pskPassphrase = data.data.PSK_PASSPHRASE
        }
      }
      // Add  WiFi profile information to WiFi endpoint settings object
      const wifiEndpointSettings = {
        __parameterType: 'instance',
        __namespace: 'http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_WiFiEndpointSettings',
        ElementName: wifiConfig.profileName,
        InstanceID: 'Intel(r) AMT:WiFi Endpoint Settings ' + wifiConfig.profileName,
        AuthenticationMethod: wifiConfig.authenticationMethod,
        EncryptionMethod: wifiConfig.encryptionMethod,
        SSID: wifiConfig.ssid,
        Priority: wifiConfigs[clientObj.network.count].priority,
        PSKPassPhrase: wifiConfig.pskPassphrase
      }
      await this.amtwsman.addWifiConfig(clientId, WIFIENDPOINT, wifiEndpointSettings)
      // Increment the count to keep track of profiles added to AMT
      ++clientObj.network.count
      this.clientManager.setClientObject(clientObj)
    }
  }

  /**
   * @description delete WiFi config from AMT
   * @param {string} clientId Id to keep track of connections
   * @param {ClientObject} clientObj
   */
  async deleteWiFiConfigs (clientObj: ClientObject, clientId: string): Promise<void> {
    let wifiEndpoints: WiFiEndPointSettings[] = clientObj.network?.WiFiPortCapabilities
    const wifiProfiles: WiFiEndPointSettings[] = []
    wifiEndpoints.forEach(wifi => {
      if (wifi.InstanceID != null && wifi.Priority !== 0) {
        wifiProfiles.push({ ...wifi })
      }
    })
    wifiEndpoints = wifiProfiles
    if (wifiEndpoints?.length > 0) {
      await this.amtwsman.delete(clientId, 'CIM_WiFiEndpointSettings', { InstanceID: wifiEndpoints[0].InstanceID })
      wifiEndpoints = wifiEndpoints.slice(1)
      clientObj.network.WiFiPortCapabilities = wifiEndpoints
      this.clientManager.setClientObject(clientObj)
    } else {
      clientObj.network.isWiFiConfigsDeleted = true
      this.clientManager.setClientObject(clientObj)
      await this.amtwsman.batchEnum(clientId, '*AMT_GeneralSettings', AMTUserName)
    }
  }

  /**
   * @description Parse the get and set of AMT_EthernetPortSettings response received from AMT
   * @param {string} clientId Id to keep track of connections
   * @param {string} message
   */
  async processWiFiPortConfigurationService (clientObj: ClientObject, message: any, clientId: string): Promise<void> {
    const wifiPortConfigurationService: AMT_WiFiPortConfigurationService = message?.payload.AMT_WiFiPortConfigurationService
    if (wifiPortConfigurationService?.response.localProfileSynchronizationEnabled === 0) {
      const response: AMT_WiFiPortConfigurationServiceResponse = wifiPortConfigurationService.response
      response.localProfileSynchronizationEnabled = 1
      await this.amtwsman.put(clientId, 'AMT_WiFiPortConfigurationService', response, AMTUserName, null, true)
    } else if (wifiPortConfigurationService?.response.localProfileSynchronizationEnabled === 1) {
      clientObj.network.getWiFiPortConfigurationService = true
      this.clientManager.setClientObject(clientObj)
    }
  }
}
