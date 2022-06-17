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
import { IValidator } from '../interfaces/IValidator'
import { CIRAConfigurator } from './CIRAConfigurator'
import { MqttProvider } from '../utils/MqttProvider'
import { RPSError } from '../utils/RPSError'
import { devices } from '../WebSocketListener'
import { AMT, CIM } from '@open-amt-cloud-toolkit/wsman-messages'
import { HttpHandler } from '../HttpHandler'
import { parseBody } from '../utils/parseWSManResponseBody'
import { AMTEthernetPortSettings, AMT_WiFiPortConfigurationServiceResponse, WiFiEndPointSettings } from '../models/WSManResponse'
import { AMTConfiguration } from '../models'
import { EnvReader } from '../utils/EnvReader'
import { DbCreatorFactory } from '../repositories/factories/DbCreatorFactory'

export class NetworkConfigurator implements IExecutor {
  amt: AMT.Messages
  cim: CIM.Messages
  httpHandler: HttpHandler
  dbFactory: DbCreatorFactory
  db: any
  constructor (
    private readonly logger: ILogger,
    private readonly configurator: IConfigurator,
    private readonly responseMsg: ClientResponseMsg,
    private readonly validator: IValidator,
    private readonly CIRAConfigurator: CIRAConfigurator
  ) {
    this.amt = new AMT.Messages()
    this.cim = new CIM.Messages()
    this.httpHandler = new HttpHandler()
  }

  async getDB (): Promise<void> {
    this.dbFactory = new DbCreatorFactory(EnvReader.GlobalEnvConfig)
    this.db = await this.dbFactory.getDb()
  }

  /**
   * @description Set wired network configuration on AMT
   * @param {any} message valid client message
   * @param {string} clientId Id to keep track of connections
   * @returns {ClientMsg} message to sent to client
   */
  async execute (message: any, clientId: string): Promise<ClientMsg> {
    let clientObj: ClientObject
    try {
      clientObj = devices[clientId]
      // Process response message if not null
      if (message != null) {
        const msg = await this.processWSManJsonResponse(message, clientId)
        if (msg) {
          return msg
        }
      }
      const payload: any = clientObj.ClientData.payload
      // gets all the existing wifi profiles from the device
      if (!clientObj.network?.getWiFiPortCapabilities) {
        const xmlRequestBody = this.cim.WiFiEndpointSettings(CIM.Methods.ENUMERATE)
        const data = this.httpHandler.wrapIt(xmlRequestBody, devices[clientId].connectionParams)
        return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
      } else if (clientObj.network?.WiFiPortCapabilities?.length >= 0 && !clientObj.network?.isWiFiConfigsDeleted) {
        // if one or more wifi profiles exists in device, they will be deleted
        return this.deleteWiFiConfigs(clientId)
      } else if (!clientObj.network?.setWiFiPort && clientObj.network.setEthernetPortSettings != null && payload.profile.wifiConfigs?.length > 0 && payload.profile.dhcpEnabled) {
        // Enumeration 32769 - WiFi is enabled in S0 + Sx/AC
        const xmlRequestBody = this.cim.WiFiPort(CIM.Methods.REQUEST_STATE_CHANGE, 32769)
        const data = this.httpHandler.wrapIt(xmlRequestBody, devices[clientId].connectionParams)
        return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
      } else if (clientObj.network.setWiFiPort && payload.profile.wifiConfigs?.length > 0 && clientObj.network.count <= payload.profile.wifiConfigs?.length - 1 && payload.profile.dhcpEnabled) {
        return await this.addWifiConfigs(clientId, payload.profile.wifiConfigs)
      } else if (devices[clientId].network?.getWiFiPortConfigurationService) {
        // If all wiFi configs are added, then move to CIRA config.
        if (clientObj.network.setEthernetPortSettings) {
          return await this.callCIRAConfig(clientId, 'ethernet and wifi settings are updated', message)
        } else {
          return await this.callCIRAConfig(clientId, 'wifi settings are updated', message)
        }
      }
    } catch (error) {
      this.logger.error(`${clientId} : Failed to configure network settings : ${error}`)
      MqttProvider.publishEvent('fail', ['NetworkConfigurator'], 'Failed', devices[clientId].uuid)
      if (error instanceof RPSError) {
        devices[clientId].status.Network = error.message
      } else {
        devices[clientId].status.Network = 'Failed'
      }
      return this.responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify(devices[clientId].status))
    }
  }

  async processWSManJsonResponse (message: any, clientId: string): Promise<ClientMsg> {
    const clientObj = devices[clientId]
    const wsmanResponse = message.payload
    switch (wsmanResponse.statusCode) {
      case 401: {
        const xmlRequestBody = this.cim.WiFiEndpointSettings(CIM.Methods.ENUMERATE)
        const data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
        return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
      }
      case 200: {
        const xmlBody = parseBody(wsmanResponse)
        // pares WSMan xml response to json
        const response = this.httpHandler.parseXML(xmlBody)
        const method = response.Envelope.Header.ResourceURI.split('/').pop()
        switch (method) {
          case 'CIM_WiFiEndpointSettings': {
            return this.validateWiFiEndpointSettings(clientId, response)
          }
          case 'AMT_GeneralSettings': {
            return this.validateGeneralSettings(clientId, response)
          }
          case 'AMT_EthernetPortSettings': {
            return await this.validateEthernetPortSettings(clientId, response)
          }
          case 'CIM_WiFiPort': {
            return await this.validateWiFiPort(clientId, response)
          }
          case 'AMT_WiFiPortConfigurationService': {
            return await this.validateWifiPortConfiguration(clientId, response)
          }
        }
        break
      }
      case 400: {
        return await this.callCIRAConfig(clientId, 'Failed', message)
      }
      default: {
        return null
      }
    }
  }

  async callCIRAConfig (clientId: string, status: string, message: any): Promise<ClientMsg> {
    const clientObj = devices[clientId]
    this.logger.debug(`Device ${clientObj.uuid} ${status} with the profile : ${clientObj.ClientData.payload.profile.profileName}`)
    clientObj.status.Network = `${status}.`
    MqttProvider.publishEvent('success', ['NetworkConfigurator'], `Status : ${status}`, clientObj.uuid)
    clientObj.action = ClientAction.CIRACONFIG
    return await this.CIRAConfigurator.execute(message, clientId)
  }

  async validateWifiPortConfiguration (clientId: string, response: any): Promise<ClientMsg> {
    const clientObj = devices[clientId]
    const action = response.Envelope.Header.Action._.split('/').pop()
    switch (action) {
      case 'AddWiFiSettingsResponse': {
        const xmlRequestBody = this.amt.WiFiPortConfigurationService(AMT.Methods.GET, null, null)
        const data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
        return this.responseMsg.get(clientId, data, 'wsman', 'ok')
      }
      case 'PutResponse':
        if (response.Envelope.Body.AMT_WiFiPortConfigurationService?.localProfileSynchronizationEnabled !== 1) {
          this.logger.warn(`Failed to update localProfileSynchronization for device: ${clientObj.uuid}`)
        }
        clientObj.network.getWiFiPortConfigurationService = true
        break
      case 'GetResponse': {
        const wifiPortConfigurationService: AMT_WiFiPortConfigurationServiceResponse = response.Envelope.Body.AMT_WiFiPortConfigurationService
        if (wifiPortConfigurationService?.localProfileSynchronizationEnabled === 0) {
          wifiPortConfigurationService.localProfileSynchronizationEnabled = 1
          // TODO: do this
          const xmlRequestBody = this.amt.WiFiPortConfigurationService(AMT.Methods.PUT, wifiPortConfigurationService, null)
          const data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
          return this.responseMsg.get(clientId, data, 'wsman', 'ok')
        } else if (wifiPortConfigurationService?.localProfileSynchronizationEnabled === 1) {
          clientObj.network.getWiFiPortConfigurationService = true
        }
        break
      }
    }
    return null
  }

  async validateWiFiPort (clientId: string, response: any): Promise<ClientMsg> {
    const clientObj = devices[clientId]
    const action = response.Envelope.Header.Action._.split('/').pop()
    switch (action) {
      case 'RequestStateChangeResponse': {
        if (response.Envelope.Body.RequestStateChange_OUTPUT.ReturnValue !== 0) {
          return await this.callCIRAConfig(clientId, 'Ethernet Configured. WiFi Failed', response)
        }
        clientObj.network.setWiFiPort = true
        break
      }
      case 'GetResponse': {
        if (response.Envelope.Body.AMT_WiFiPort.EnabledState !== 32769 || response.Envelope.Body.AMT_WiFiPort.RequestedState !== 32769) {
          await this.callCIRAConfig(clientId, 'Ethernet Configured. WiFi Failed', response)
        } else {
          clientObj.network.setWiFiPortResponse = true
          clientObj.network.count = 0
        }
        break
      }
    }
    return null
  }

  async validateEthernetPortSettings (clientId: string, response: any): Promise<ClientMsg> {
    const clientObj = devices[clientId]
    const action = response.Envelope.Header.Action._.split('/').pop()
    let xmlRequestBody = null
    let data = null
    switch (action) {
      case 'EnumerateResponse': {
        xmlRequestBody = this.amt.EthernetPortSettings(AMT.Methods.PULL, response.Envelope.Body?.EnumerateResponse?.EnumerationContext)
        data = this.httpHandler.wrapIt(xmlRequestBody, devices[clientId].connectionParams)
        return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
      }
      case 'PullResponse': {
        // As per AMT SDK first entry is WIRED network port
        const pullResponse = response.Envelope.Body.PullResponse.Items.AMT_EthernetPortSettings
        let wiredSettings: AMTEthernetPortSettings
        if (Array.isArray(pullResponse)) {
          if (pullResponse[0].InstanceID.includes('Settings 0')) {
            wiredSettings = pullResponse[0]
          } else if (pullResponse[0].InstanceID.includes('Settings 1')) {
            clientObj.network.WirelessObj = pullResponse[0]
          }

          if (pullResponse[1].InstanceID.includes('Settings 0')) {
            wiredSettings = pullResponse[1]
          } else if (pullResponse[1].InstanceID.includes('Settings 1')) {
            clientObj.network.WirelessObj = pullResponse[1]
          }
        } else {
          if (pullResponse.InstanceID.includes('Settings 0')) {
            wiredSettings = pullResponse
          } else if (pullResponse.InstanceID.includes('Settings 1')) {
            clientObj.network.WirelessObj = pullResponse
          }
        }
        const amtProfile: AMTConfiguration = clientObj.ClientData.payload.profile
        // Check if this is a Wireless LAN device, exit wired LAN configuration flow if wired link is down or PhysicalConnectionType is 3 (wireless only device)
        if (clientObj.network.WirelessObj != null && wiredSettings?.MACAddress == null) {
          // Device has WiFi capabilities and storing temporarily for next steps if the profile has wifi configs to be configured.
          this.logger.debug(`Device ${devices[clientId].uuid} supports only wireless`)
          clientObj.network.setEthernetPortSettings = false
          return null
        } else {
          if (amtProfile.dhcpEnabled) {
            wiredSettings.DHCPEnabled = true
            wiredSettings.SharedStaticIp = false
            if (response.Envelope.Body.PullResponse.Items.AMT_EthernetPortSettings.length > 1) {
              // If the array length is greater than one, device has WiFi capabilities and storing temporarily for next steps if the profile has wifi configs to be configured.
              clientObj.network.WirelessObj = response.Envelope.Body.PullResponse.Items.AMT_EthernetPortSettings[1]
            }
          } else {
            wiredSettings.DHCPEnabled = false
            wiredSettings.SharedStaticIp = true
          }
          wiredSettings.IpSyncEnabled = true
          if (wiredSettings.DHCPEnabled || wiredSettings.IpSyncEnabled) {
            // When 'DHCPEnabled' property is set to true the following properties should be removed:
            // SubnetMask, DefaultGateway, IPAddress, PrimaryDNS, SecondaryDNS.
            delete wiredSettings.SubnetMask
            delete wiredSettings.DefaultGateway
            delete wiredSettings.IPAddress
            delete wiredSettings.PrimaryDNS
            delete wiredSettings.SecondaryDNS
          } else {
            // TBD: To set static IP address the values should be read from the REST API
            // ethernetPortSettings.SubnetMask = "255.255.255.0";
            // ethernetPortSettings.DefaultGateway = "192.168.1.1";
            // ethernetPortSettings.IPAddress = "192.168.1.223";
            // ethernetPortSettings.PrimaryDNS = "192.168.1.1";
            // ethernetPortSettings.SecondaryDNS = "192.168.1.1";
          }
          this.logger.debug(`Updated Network configuration to set on device :  ${JSON.stringify(response, null, '\t')}`)
          // put request to update ethernet port settings on the device
          xmlRequestBody = this.amt.EthernetPortSettings(AMT.Methods.PUT, null, wiredSettings)
          data = this.httpHandler.wrapIt(xmlRequestBody, devices[clientId].connectionParams)
          return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
        }
      }
      case 'PutResponse': {
        const amtEthernetPortSettings: AMTEthernetPortSettings = response.Envelope.Body.AMT_EthernetPortSettings
        const payload: any = devices[clientId].ClientData.payload
        if (!amtEthernetPortSettings.IpSyncEnabled) {
          // If the IpSyncEnabled is not set to true in the response to the put request of ethernet port settings, then it is considered as failed and move to CIRA config.
          this.logger.debug(`Device ${devices[clientId].uuid} Failed to set IpSyncEnabled to true `)
          // Set the flag that ethernet port settings is updated.
          clientObj.network.setEthernetPortSettings = true
          return await this.callCIRAConfig(clientId, 'Failed', null)
        } else if (amtEthernetPortSettings.SharedStaticIp && amtEthernetPortSettings.IpSyncEnabled) {
          // If the IpSyncEnabled is true and SharedStaticIp is true in the response to the put request of ethernet port settings, then move to CIRA config.
          // Set the flag that ethernet port settings is updated.
          clientObj.network.setEthernetPortSettings = true
          return await this.callCIRAConfig(clientId, 'Ethernet Configured', null)
        } else if (amtEthernetPortSettings.DHCPEnabled && amtEthernetPortSettings.IpSyncEnabled) {
          // If the IpSyncEnabled, DHCPEnabled is true and profile has no wifi configs
          if (payload.profile.wifiConfigs.length === 0) {
            // Set the flag that ethernet port settings is updated.
            clientObj.network.setEthernetPortSettings = true
            return await this.callCIRAConfig(clientId, 'Ethernet Configured', null)
          } else if (clientObj.network.WirelessObj == null && payload.profile.wifiConfigs.length > 0) {
            // If the IpSyncEnabled, DHCPEnabled is true and profile has wifi configs but no wifi capabilities
            this.logger.debug(`Device ${clientObj.uuid} Ethernet Configured. No wireless interface`)
            // Set the flag that ethernet port settings is updated.
            clientObj.network.setEthernetPortSettings = true
            return await this.callCIRAConfig(clientId, 'Ethernet Configured. WiFi Failed', null)
          } else {
            clientObj.network.setEthernetPortSettings = true
            return null
          }
        }
        break
      }
      case 'fault': {
        // if we got an error setting EthernetPortSettings
        const faultMessage = response.Envelope.Body.Fault?.Reason?.Text
        this.logger.debug(`Device ${clientObj.uuid} Ethernet Configuration Failed. Reason: ${faultMessage}`)
        devices[clientId].network.setEthernetPortSettings = true
        return null
      }
    }
  }

  validateGeneralSettings (clientId: string, response: any): ClientMsg {
    const action = response.Envelope.Header.Action._.split('/').pop()
    let xmlRequestBody = null
    let data = null
    switch (action) {
      case 'GetResponse': {
        // AMTNetworkEnabled - When set to Disabled, the AMT OOB network interfaces (LAN and WLAN) are disabled including AMT user initiated applications, Environment Detection and RMCPPing.
        // 0 : Disabled, 1 - Enabled
        // SharedFQDN -Defines Whether the FQDN (HostName.DomainName) is shared with the Host or dedicated to ME. (The default value for this property is shared - TRUE).
        // RmcpPingResponseEnabled - Indicates whether Intel(R) AMT should respond to RMCP ping Echo Request messages.
        const settings: AMT.Models.GeneralSettings = response.Envelope.Body.AMT_GeneralSettings
        if (!settings.SharedFQDN || settings.AMTNetworkEnabled !== 1 || !settings.RmcpPingResponseEnabled) {
          settings.SharedFQDN = true
          settings.AMTNetworkEnabled = 1
          settings.RmcpPingResponseEnabled = true
          xmlRequestBody = this.amt.GeneralSettings(AMT.Methods.PUT, settings)
        } else {
          // If the network is enabled, get call to AMT_EthernetPortSettings
          xmlRequestBody = this.amt.EthernetPortSettings(AMT.Methods.ENUMERATE)
        }
        break
      }
      case 'PutResponse': {
        xmlRequestBody = this.amt.EthernetPortSettings(AMT.Methods.ENUMERATE)
        break
      }
    }
    data = this.httpHandler.wrapIt(xmlRequestBody, devices[clientId].connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  validateWiFiEndpointSettings (clientId: string, response: any): ClientMsg {
    let xmlRequestBody = null
    let data = null
    const action = response.Envelope.Header.Action._.split('/').pop()
    switch (action) {
      case 'EnumerateResponse': {
        xmlRequestBody = this.cim.WiFiEndpointSettings(CIM.Methods.PULL, response.Envelope.Body?.EnumerateResponse?.EnumerationContext)
        break
      }
      case 'PullResponse': {
        devices[clientId].network.getWiFiPortCapabilities = true
        if (response.Envelope.Body.PullResponse.Items?.CIM_WiFiEndpointSettings != null) {
          devices[clientId].network.WiFiPortCapabilities = response.Envelope.Body.PullResponse.Items.CIM_WiFiEndpointSettings
          // if one or more wifi profiles exists in device, they will be deleted
          return this.deleteWiFiConfigs(clientId)
        } else {
          xmlRequestBody = this.amt.GeneralSettings(AMT.Methods.GET)
        }
        break
      }
      case 'DeleteResponse': {
        return this.deleteWiFiConfigs(clientId)
      }
    }
    data = this.httpHandler.wrapIt(xmlRequestBody, devices[clientId].connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  deleteWiFiConfigs (clientId: string): ClientMsg {
    let xmlRequestBody = ''
    const clientObj = devices[clientId]
    let wifiEndpoints = Array.isArray(clientObj.network?.WiFiPortCapabilities) ? clientObj.network?.WiFiPortCapabilities : [clientObj.network?.WiFiPortCapabilities]
    const wifiProfiles: WiFiEndPointSettings[] = []
    wifiEndpoints.forEach(wifi => {
      if (wifi.InstanceID != null && wifi.Priority !== 0) {
        wifiProfiles.push({ ...wifi })
      }
    })
    wifiEndpoints = wifiProfiles
    if (wifiEndpoints?.length > 0) {
      const selector = { name: 'InstanceID', value: wifiEndpoints[0].InstanceID }
      xmlRequestBody = this.cim.WiFiEndpointSettings(CIM.Methods.DELETE, null, selector)
      wifiEndpoints = wifiEndpoints.slice(1)
      clientObj.network.WiFiPortCapabilities = wifiEndpoints
    } else {
      clientObj.network.isWiFiConfigsDeleted = true
      xmlRequestBody = this.amt.GeneralSettings(AMT.Methods.GET)
    }
    const data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  async addWifiConfigs (clientId: string, wifiConfigs: ProfileWifiConfigs[]): Promise<ClientMsg> {
    const clientObj = devices[clientId]
    if (clientObj.network.count <= wifiConfigs.length - 1) {
      // Get WiFi profile information based on the profile name.
      await this.getDB()
      const wifiConfig = await this.db.wirelessProfiles.getByName(wifiConfigs[clientObj.network.count].profileName)
      if (this.configurator?.secretsManager) {
        const data: any = await this.configurator.secretsManager.getSecretAtPath(`Wireless/${wifiConfig.profileName}`)
        if (data != null) {
          wifiConfig.pskPassphrase = data.data.PSK_PASSPHRASE
        }
      }
      const selector = {
        name: 'Name',
        value: 'WiFi Endpoint 0'
      }
      // Add  WiFi profile information to WiFi endpoint settings object
      const wifiEndpointSettings = {
        ElementName: wifiConfig.profileName,
        InstanceID: `Intel(r) AMT:WiFi Endpoint Settings ${wifiConfig.profileName}`,
        AuthenticationMethod: wifiConfig.authenticationMethod,
        EncryptionMethod: wifiConfig.encryptionMethod,
        SSID: wifiConfig.ssid,
        Priority: wifiConfigs[clientObj.network.count].priority,
        PSKPassPhrase: wifiConfig.pskPassphrase
      }
      // Increment the count to keep track of profiles added to AMT
      ++clientObj.network.count
      const xmlRequestBody = this.amt.WiFiPortConfigurationService(AMT.Methods.ADD_WIFI_SETTINGS, wifiEndpointSettings, selector)
      const data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
      return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
    }
  }
}
