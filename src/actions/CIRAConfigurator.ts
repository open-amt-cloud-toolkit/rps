/*********************************************************************
 * Copyright (c) Intel Corporation 2020
 * SPDX-License-Identifier: Apache-2.0
 * Description: Activate AMT in client control mode
 * Author : Madhavi Losetty
 **********************************************************************/

import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { ClientMsg, mpsServer, ClientObject, CIRAConfig } from '../RCS.Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { WSManProcessor } from '../WSManProcessor'
import { IClientManager } from '../interfaces/IClientManager'
import { RPSError } from '../utils/RPSError'
import { mpsserver } from '../utils/constants'
import { IConfigurator } from '../interfaces/IConfigurator'
import { AMTUserName } from './../utils/constants'

export class CIRAConfigurator implements IExecutor {
  constructor (
    private readonly logger: ILogger,
    private readonly configurator: IConfigurator,
    private readonly responseMsg: ClientResponseMsg,
    private readonly amtwsman: WSManProcessor,
    private readonly clientManager: IClientManager
  ) { }

  /**
     * @description configure CIRA
     * @param {any} message valid client message
     * @param {string} clientId Id to keep track of connections
     * @returns {ClientMsg} message to sent to client
     */
  async execute (message: any, clientId: string): Promise<ClientMsg> {
    let clientObj: ClientObject
    try {
      clientObj = this.clientManager.getClientObject(clientId)
      if (message?.payload != null || !clientObj.ciraconfig.policyRuleUserInitiate) {
        await this.delete(clientId, clientObj, message)
        const wsmanResponse = message.payload
        if (clientObj.ClientData.payload.profile.ciraConfigName && clientObj.ciraconfig.setENVSettingData) {
          // Add trusted root certificate and MPS server
          if (clientObj.ciraconfig.mpsRemoteSAPDelete && !clientObj.ciraconfig.addTrustedRootCert) {
            clientObj.ciraconfig.addTrustedRootCert = true
            this.clientManager.setClientObject(clientObj)
            const configScript: CIRAConfig = clientObj.ClientData.payload.profile.ciraConfigObject
            await this.amtwsman.execute(clientId, 'AMT_PublicKeyManagementService', 'AddTrustedRootCertificate', { CertificateBlob: configScript.mpsRootCertificate }, null, AMTUserName, clientObj.ClientData.payload.password)
          } else if (clientObj.ciraconfig.addTrustedRootCert && !clientObj.ciraconfig.addMPSServer) {
            this.logger.debug(`${clientObj.uuid}  Adding trusted root certificate.`)
            clientObj.ciraconfig.addMPSServer = true
            this.clientManager.setClientObject(clientObj)
            const configScript: CIRAConfig = clientObj.ClientData.payload.profile.ciraConfigObject
            const server: mpsServer = {
              AccessInfo: configScript.mpsServerAddress,
              InfoFormat: configScript.serverAddressFormat,
              Port: configScript.mpsPort,
              AuthMethod: configScript.authMethod,
              Username: 'admin',
              Password: clientObj.mpsPassword
            }
            if (configScript.serverAddressFormat === 3 && configScript.commonName) {
              server.CN = configScript.commonName
            }
            await this.amtwsman.execute(clientId, 'AMT_RemoteAccessService', 'AddMpServer', server, null, AMTUserName, clientObj.ClientData.payload.password)
          } else if (clientObj.ciraconfig.addMPSServer && !clientObj.ciraconfig.mpsRemoteSAP) {
            clientObj.ciraconfig.mpsRemoteSAP = true
            this.clientManager.setClientObject(clientObj)
            if (wsmanResponse.Body && wsmanResponse.Body.ReturnValueStr === 'SUCCESS') {
              this.logger.debug(`${clientObj.uuid}  Management Presence Server (MPS) successfully added.`)
              await this.amtwsman.batchEnum(clientId, 'AMT_ManagementPresenceRemoteSAP', AMTUserName, clientObj.ClientData.payload.uuid)
            } else {
              this.logger.info('AMT_ManagementPresenceRemoteSAP')
              throw new RPSError(`Device ${clientObj.uuid} ${clientObj.ciraconfig.status} Failed to add Management Presence Server.`)
            }
          } else if (!clientObj.ciraconfig.addRemoteAccessPolicyRule && clientObj.ciraconfig.addMPSServer) {
            const result = wsmanResponse.AMT_ManagementPresenceRemoteSAP
            if (result) {
              if (result?.responses?.length > 0) {
                // TBD: Check when there are more than one MPS added to system.
                const name = wsmanResponse.AMT_ManagementPresenceRemoteSAP.responses[0].Name
                this.logger.debug(`${clientObj.uuid} : Management Presence Server (MPS) exists.`)
                const policy = {
                  Trigger: 2, // 2 – Periodic
                  TunnelLifeTime: 0, // 0 means that the tunnel should stay open until it is closed
                  ExtendedData: 'AAAAAAAAABk=', // Equals to 25 seconds in base 64 with network order.
                  MpServer: mpsserver(name)
                }
                clientObj.ciraconfig.addRemoteAccessPolicyRule = true
                this.clientManager.setClientObject(clientObj)
                await this.amtwsman.execute(clientId, 'AMT_RemoteAccessService', 'AddRemoteAccessPolicyRule', policy, null, AMTUserName, clientObj.ClientData.payload.password)
              } else {
                this.logger.info('AMT_RemoteAccessService')
                throw new RPSError(`Device ${clientObj.uuid} ${clientObj.ciraconfig.status} Failed to add Management Presence Server.`)
              }
            }
          } else if (!clientObj.ciraconfig.userInitConnectionService && clientObj.ciraconfig.addRemoteAccessPolicyRule) {
            clientObj.ciraconfig.userInitConnectionService = true
            this.clientManager.setClientObject(clientObj)
            await this.amtwsman.execute(clientId, 'AMT_UserInitiatedConnectionService', 'RequestStateChange', { RequestedState: 32771 }, null, AMTUserName, clientObj.ClientData.payload.password)
          } else if (clientObj.ciraconfig.userInitConnectionService && !clientObj.ciraconfig.getENVSettingDataCIRA) {
            clientObj.ciraconfig.getENVSettingDataCIRA = true
            this.clientManager.setClientObject(clientObj)
            await this.amtwsman.batchEnum(clientId, '*AMT_EnvironmentDetectionSettingData', AMTUserName, clientObj.ClientData.payload.uuid)
          } else if (clientObj.ciraconfig.getENVSettingData && !clientObj.ciraconfig.setENVSettingDataCIRA) {
            const envSettings = wsmanResponse.AMT_EnvironmentDetectionSettingData.response
            this.logger.info(`Environment settings : ${JSON.stringify(envSettings, null, '\t')}`)
            if (envSettings.DetectionStrings === undefined) {
              envSettings.DetectionStrings = 'dummy.com'
            } else if (envSettings.DetectionStrings !== 'dummy.com') {
              envSettings.DetectionStrings = 'dummy.com'
            }
            clientObj.ciraconfig.setENVSettingDataCIRA = true
            this.clientManager.setClientObject(clientObj)
            await this.amtwsman.put(clientId, 'AMT_EnvironmentDetectionSettingData', envSettings, AMTUserName, clientObj.ClientData.payload.password)
          } else if (clientObj.ciraconfig.setENVSettingDataCIRA) {
            return this.responseMsg.get(clientId, null, 'success', 'success', `Device ${clientObj.uuid} ${clientObj.ciraconfig.status} CIRA Configured.`)
          }
        } else if (clientObj.ciraconfig.setENVSettingData) {
          return this.responseMsg.get(clientId, null, 'success', 'success', `Device ${clientObj.uuid} ${clientObj.ciraconfig.status}`)
        }
      }
    } catch (error) {
      this.logger.error(`${clientId} : Failed to configure CIRA : ${error}`)
      if (error instanceof RPSError) {
        return this.responseMsg.get(clientId, null, 'error', 'failed', error.message)
      } else {
        return this.responseMsg.get(clientId, null, 'error', 'failed', `${clientObj.ciraconfig.status} Failed to configure CIRA `)
      }
    }
  }

  /**
     * @description Delete existing CIRA configurations
     * @param {string} clientId Id to keep track of connections
     * @param {clientObj} ClientObject keep track of client info and status
     * @param {any} message valid client message
     */
  async delete (clientId: string, clientObj: ClientObject, message: any): Promise<void> {
    const wsmanResponse: any = message?.payload
    if (!clientObj.ciraconfig.policyRuleUserInitiate) {
      this.logger.debug(`Deleting CIRA Configuration for device ${clientObj.ClientData.payload.uuid}`)
      clientObj = this.clientManager.getClientObject(clientId)
      clientObj.ciraconfig.policyRuleUserInitiate = true
      this.clientManager.setClientObject(clientObj)
      await this.amtwsman.delete(clientId, 'AMT_RemoteAccessPolicyRule', { PolicyRuleName: 'User Initiated' }, AMTUserName, clientObj.ClientData.payload.password)
    } else if (!clientObj.ciraconfig.policyRuleAlert) {
      clientObj.ciraconfig.policyRuleAlert = true
      this.clientManager.setClientObject(clientObj)
      await this.amtwsman.delete(clientId, 'AMT_RemoteAccessPolicyRule', { PolicyRuleName: 'Alert' }, AMTUserName)
    } else if (!clientObj.ciraconfig.policyRulePeriodic) {
      clientObj.ciraconfig.policyRulePeriodic = true
      this.clientManager.setClientObject(clientObj)
      await this.amtwsman.delete(clientId, 'AMT_RemoteAccessPolicyRule', { PolicyRuleName: 'Periodic' }, AMTUserName)
    } else if (!clientObj.ciraconfig.mpsRemoteSAPEnumerate) {
      this.logger.debug(`${clientObj.uuid}: All policies are removed successfully.`)
      clientObj.ciraconfig.mpsRemoteSAPEnumerate = true
      this.clientManager.setClientObject(clientObj)
      await this.amtwsman.batchEnum(clientId, 'AMT_ManagementPresenceRemoteSAP')
    } else if (!clientObj.ciraconfig.mpsRemoteSAPDelete && wsmanResponse?.AMT_ManagementPresenceRemoteSAP) {
      clientObj.ciraconfig.mpsRemoteSAPDelete = true
      this.clientManager.setClientObject(clientObj)
      let selector: any
      if (wsmanResponse?.AMT_ManagementPresenceRemoteSAP.responses.length > 0) {
        const name = wsmanResponse.AMT_ManagementPresenceRemoteSAP.responses[0].Name
        selector = { Name: name }
        this.logger.debug(`MPS Name : ${name},  selector : ${JSON.stringify(selector, null, '\t')}`)
        await this.amtwsman.delete(clientId, 'AMT_ManagementPresenceRemoteSAP', selector, AMTUserName)
        return
      }
      clientObj = this.clientManager.getClientObject(clientId)
    }
    // Deletes all the public certificates if exists
    if (clientObj.ciraconfig.mpsRemoteSAPDelete && !clientObj.ciraconfig.mpsRemoteSAPGet) {
      clientObj.ciraconfig.mpsRemoteSAPGet = true
      this.clientManager.setClientObject(clientObj)
      await this.amtwsman.batchEnum(clientId, 'AMT_PublicKeyCertificate')
    } else if (clientObj.ciraconfig.mpsRemoteSAPGet && !clientObj.ciraconfig.mpsPublicCertDelete) {
      if (clientObj.ciraconfig.publicCerts == null) {
        clientObj.ciraconfig.publicCerts = wsmanResponse?.AMT_PublicKeyCertificate.responses
      }
      if (clientObj.ciraconfig.publicCerts?.length > 0) {
        const cert = clientObj.ciraconfig.publicCerts[clientObj.ciraconfig.publicCerts.length - 1]
        clientObj.ciraconfig.publicCerts.pop()
        await this.amtwsman.delete(clientId, 'AMT_PublicKeyCertificate', cert, AMTUserName)
      } else {
        clientObj.ciraconfig.mpsPublicCertDelete = true
      }
      this.clientManager.setClientObject(clientObj)
    }
    // Max five domain suffix can be added. Deletes all the domain suffixes for now.
    if (clientObj.ciraconfig.mpsPublicCertDelete && !clientObj.ciraconfig.getENVSettingData) {
      clientObj.ciraconfig.getENVSettingData = true
      this.clientManager.setClientObject(clientObj)
      await this.amtwsman.batchEnum(clientId, '*AMT_EnvironmentDetectionSettingData', AMTUserName)
    } else if (clientObj.ciraconfig.getENVSettingData && !clientObj.ciraconfig.setENVSettingData) {
      if (wsmanResponse.AMT_EnvironmentDetectionSettingData?.response?.DetectionStrings !== undefined) {
        const envSettings = wsmanResponse.AMT_EnvironmentDetectionSettingData.response
        envSettings.DetectionStrings = []
        await this.amtwsman.put(clientId, 'AMT_EnvironmentDetectionSettingData', envSettings, AMTUserName)
      } else {
        clientObj.ciraconfig.setENVSettingData = true
        this.clientManager.setClientObject(clientObj)
        this.logger.debug(`${clientObj.uuid} Deleted existing CIRA Configuration.`)
        clientObj = this.clientManager.getClientObject(clientId)
      }
    }
  }
}
