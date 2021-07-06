/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description:Configure Network settings on AMT device
 * Author : Madhavi Losetty
 **********************************************************************/

import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { ClientMsg, ClientAction, ClientObject } from '../RCS.Config'
import { IConfigurator } from '../interfaces/IConfigurator'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { WSManProcessor } from '../WSManProcessor'
import { IClientManager } from '../interfaces/IClientManager'
import { RPSError } from '../utils/RPSError'
import { IValidator } from '../interfaces/IValidator'
import { CIRAConfigurator } from './CIRAConfigurator'
import { AMTGeneralSettings, AMTEthernetPortSettings } from '../models/WSManResponse'
import { AMTUserName } from './../utils/constants'
import { AMTConfiguration } from '../models/Rcs'

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
    try {
      const clientObj: ClientObject = this.clientManager.getClientObject(clientId)
      if (message?.payload != null) {
        const wsmanResponse = message.payload
        if (wsmanResponse.AMT_GeneralSettings != null) {
          const response: AMTGeneralSettings = wsmanResponse.AMT_GeneralSettings.response
          if (!response.SharedFQDN || response.AMTNetworkEnabled !== 1 || !response.RmcpPingResponseEnabled) {
            response.SharedFQDN = true
            response.AMTNetworkEnabled = 1
            response.RmcpPingResponseEnabled = true
            await this.amtwsman.put(clientId, 'AMT_GeneralSettings', response)
          } else {
            await this.amtwsman.batchEnum(clientId, 'AMT_EthernetPortSettings')
          }
        } else if (wsmanResponse.AMT_EthernetPortSettings !== undefined) {
          // Assume first entry is WIRED network port
          const response: AMTEthernetPortSettings = wsmanResponse.AMT_EthernetPortSettings.responses[0]
          const amtProfile: AMTConfiguration = clientObj.ClientData.payload.profile
          // When 'DHCPEnabled' property is set to true the following properties should be set to NULL:
          // SubnetMask, DefaultGateway, IPAddress, PrimaryDNS, SecondaryDNS.
          if (!clientObj.ciraconfig.setEthernetPortSettings) {
            if (amtProfile.dhcpEnabled) {
              response.DHCPEnabled = true
              response.SharedStaticIp = false
            } else {
              response.DHCPEnabled = false
              response.SharedStaticIp = true
            }
            response.IpSyncEnabled = true
            if (response.DHCPEnabled || response.IpSyncEnabled) {
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
            await this.amtwsman.put(clientId, 'AMT_EthernetPortSettings', response)
            clientObj.ciraconfig.setEthernetPortSettings = true
            this.clientManager.setClientObject(clientObj)
          } else {
            if (!response.IpSyncEnabled) {
              this.logger.debug(`Device ${clientObj.uuid} network configuration failed with profile : ${clientObj.ClientData.payload.profile.networkConfigObject}`)
              clientObj.ciraconfig.status += 'network configuration failed.'
            } else {
              this.logger.debug(`Device ${clientObj.uuid} network configured with profile : ${clientObj.ClientData.payload.profile.networkConfigObject}`)
              clientObj.ciraconfig.status += 'network configured.'
            }
            clientObj.action = ClientAction.CIRACONFIG
            this.clientManager.setClientObject(clientObj)
            await this.CIRAConfigurator.execute(message, clientId)
          }
        }
      } else {
        const payload: any = clientObj.ClientData.payload
        if (payload.profile.dhcpEnabled != null) {
          await this.amtwsman.batchEnum(clientId, '*AMT_GeneralSettings', AMTUserName, payload.password)
        } else {
          clientObj.action = ClientAction.CIRACONFIG
          this.clientManager.setClientObject(clientObj)
          await this.CIRAConfigurator.execute(message, clientId)
        }
      }
    } catch (error) {
      this.logger.error(`${clientId} : Failed to configure network settings : ${error}`)
      if (error instanceof RPSError) {
        return this.responseMsg.get(clientId, null, 'error', 'failed', error.message)
      } else {
        return this.responseMsg.get(clientId, null, 'error', 'failed', 'Failed to configure network settings')
      }
    }
  }
}
