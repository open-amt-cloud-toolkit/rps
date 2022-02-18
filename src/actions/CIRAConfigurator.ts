/*********************************************************************
 * Copyright (c) Intel Corporation 2020
 * SPDX-License-Identifier: Apache-2.0
 * Description: Activate AMT in client control mode
 * Author : Madhavi Losetty
 **********************************************************************/

import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { mpsServer, ClientObject, CIRAConfig, ClientAction, ClientMsg } from '../models/RCS.Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { RPSError } from '../utils/RPSError'
import { IConfigurator } from '../interfaces/IConfigurator'
import { EnvReader } from '../utils/EnvReader'
import got from 'got'
import { MqttProvider } from '../utils/MqttProvider'
import { TLSConfigurator } from './TLSConfigurator'
import { randomUUID } from 'crypto'
import { devices } from '../WebSocketListener'
import { HttpHandler } from '../HttpHandler'
import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { parseBody } from '../utils/parseWSManResponseBody'
export class CIRAConfigurator implements IExecutor {
  amt: AMT.Messages
  httpHandler: HttpHandler
  constructor (
    private readonly logger: ILogger,
    private readonly configurator: IConfigurator,
    private readonly responseMsg: ClientResponseMsg,
    private readonly tlsConfigurator: TLSConfigurator
  ) {
    this.amt = new AMT.Messages()
    this.httpHandler = new HttpHandler()
  }

  /**
     * @description configure CIRA
     * @param {any} message valid client message
     * @param {string} clientId Id to keep track of connections
     * @returns {ClientMsg} message to sent to client
     */
  async execute (message: any, clientId: string): Promise<any> {
    let clientObj: ClientObject
    try {
      clientObj = devices[clientId]
      // Process the response received from AMT
      if (message != null) {
        const msg = await this.processWSManJsonResponse(message, clientId)
        if (msg) {
          return msg
        }
      }
      // Delete existing CIRA Config
      const msg = this.removeRemoteAccessPolicyRule(clientId, clientObj)
      if (msg) {
        return msg
      }
      // Configure
      if (clientObj.ClientData.payload.profile.ciraConfigName && clientObj.ciraconfig.setENVSettingData) {
        // Add trusted root certificate and MPS server
        if (!clientObj.ciraconfig.addTrustedRootCert) {
          const configScript: CIRAConfig = clientObj.ClientData.payload.profile.ciraConfigObject
          const xmlRequestBody = this.amt.PublicKeyManagementService(AMT.Methods.ADD_TRUSTED_ROOT_CERTIFICATE, (clientObj.messageId++).toString(), configScript.mpsRootCertificate)
          const data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
          return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
        }
      } else if (clientObj.ciraconfig.setENVSettingData) {
        MqttProvider.publishEvent('success', ['CIRAConfigurator'], 'CIRA Configured', clientObj.uuid)
        if (clientObj.ClientData.payload.profile.tlsCerts != null) {
          clientObj.action = ClientAction.TLSCONFIG
          await this.tlsConfigurator.execute(message, clientId)
        } else {
          return this.responseMsg.get(clientId, null, 'success', 'success', JSON.stringify(clientObj.status))
        }
      }
    } catch (error) {
      this.logger.error(`${clientId} : Failed to configure CIRA : ${error}`)
      if (error instanceof RPSError) {
        clientObj.status.CIRAConnection = error.message
      } else {
        clientObj.status.CIRAConnection = 'Failed'
      }
      MqttProvider.publishEvent('fail', ['CIRAConfigurator'], 'Failed to configure CIRA', clientObj.uuid)
      return this.responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify(clientObj.status))
    }
  }

  async processWSManJsonResponse (message: any, clientId: string): Promise<ClientMsg> {
    const clientObj = devices[clientId]
    const wsmanResponse = message.payload
    switch (wsmanResponse.statusCode) {
      case 401: {
        const xmlRequestBody = this.amt.RemoteAccessPolicyRule(AMT.Methods.DELETE, (clientObj.messageId++).toString(), { name: 'PolicyRuleName', value: 'User Initiated' })
        const data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
        return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
      }
      case 200: {
        const xmlBody = parseBody(wsmanResponse)
        // pares WSMan xml response to json
        const response = this.httpHandler.parseXML(xmlBody)
        const method = response.Envelope.Header.ResourceURI.split('/').pop()
        switch (method) {
          case 'AMT_RemoteAccessPolicyRule': {
            return this.validateRemoteAccessPolicyRule(clientId, clientObj, response)
          }
          case 'AMT_ManagementPresenceRemoteSAP': {
            return this.validateManagementPresenceRemoteSAP(clientId, clientObj, response)
          }
          case 'AMT_PublicKeyCertificate': {
            return this.validatePublicKeyCertificate(clientId, clientObj, response)
          }
          case 'AMT_EnvironmentDetectionSettingData': {
            return await this.ValidateEnvironmentDetectionSettingData(clientId, clientObj, response)
          }
          case 'AMT_PublicKeyManagementService': {
            return await this.ValidatePublicKeyManagementService(clientId, clientObj, response)
          }
          case 'AMT_RemoteAccessService': {
            return this.ValidateRemoteAccessService(clientId, clientObj, response)
          }
          case 'AMT_UserInitiatedConnectionService': {
            return this.ValidateUserInitiatedConnectionService(clientId, clientObj, response)
          }
        }
        break
      }
      case 400: {
        const msg = this.removeRemoteAccessPolicyRule(clientId, clientObj)
        if (msg == null) {
          const xmlRequestBody = this.amt.ManagementPresenceRemoteSAP(AMT.Methods.ENUMERATE, (clientObj.messageId++).toString())
          const data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
          return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
        } else {
          return msg
        }
      }
      default: {
        return null
      }
    }
  }

  removeRemoteAccessPolicyRule (clientId: string, clientObj: ClientObject): ClientMsg {
    if (clientObj.ciraconfig.policyRuleUserInitiate && clientObj.ciraconfig.policyRuleAlert && clientObj.ciraconfig.policyRulePeriodic) {
      return null
    }
    const selector = { name: 'PolicyRuleName', value: '' }
    if (!clientObj.ciraconfig.policyRuleUserInitiate) {
      this.logger.debug(`Deleting CIRA Configuration for device ${clientObj.ClientData.payload.uuid}`)
      clientObj.ciraconfig.policyRuleUserInitiate = true
      selector.value = 'User Initiated'
    } else if (clientObj.ciraconfig.policyRuleUserInitiate && !clientObj.ciraconfig.policyRuleAlert) {
      clientObj.ciraconfig.policyRuleAlert = true
      selector.value = 'Alert'
    } else if (clientObj.ciraconfig.policyRuleAlert && !clientObj.ciraconfig.policyRulePeriodic) {
      clientObj.ciraconfig.policyRulePeriodic = true
      selector.value = 'Periodic'
    }
    const xmlRequestBody = this.amt.RemoteAccessPolicyRule(AMT.Methods.DELETE, (clientObj.messageId++).toString(), selector)
    const data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  ValidateUserInitiatedConnectionService (clientId: string, clientObj: ClientObject, response: any): ClientMsg {
    let xmlRequestBody = null
    let data = null
    const action = response.Envelope.Header.Action.split('/').pop()
    switch (action) {
      case 'RequestStateChangeResponse': {
        if (response.Envelope.Body?.RequestStateChange_OUTPUT?.ReturnValue !== 0) {
          throw new RPSError(`Device ${clientObj.uuid} failed to update User Initiated Connection Service.`)
        }
        xmlRequestBody = this.amt.EnvironmentDetectionSettingData(AMT.Methods.GET, (clientObj.messageId++).toString())
        clientObj.ciraconfig.userInitConnectionService = true
        break
      }
    }
    data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  validateRemoteAccessPolicyRule (clientId: string, clientObj: ClientObject, response: any): ClientMsg {
    let xmlRequestBody = null
    let data = null
    const action = response.Envelope.Header.Action.split('/').pop()
    switch (action) {
      case 'DeleteResponse': {
        xmlRequestBody = this.amt.ManagementPresenceRemoteSAP(AMT.Methods.ENUMERATE, (clientObj.messageId++).toString())
        break
      }
    }
    data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  validateManagementPresenceRemoteSAP (clientId: string, clientObj: ClientObject, response: any): ClientMsg {
    let xmlRequestBody = null
    let data = null
    const action = response.Envelope.Header.Action.split('/').pop()
    switch (action) {
      case 'EnumerateResponse': {
        xmlRequestBody = this.amt.ManagementPresenceRemoteSAP(AMT.Methods.PULL, (clientObj.messageId++).toString(), response.Envelope.Body?.EnumerateResponse?.EnumerationContext)
        break
      }
      case 'PullResponse': {
        // To Do: Need to repeat the process for multiple MPS servers.
        if (response.Envelope.Body.PullResponse.Items?.AMT_ManagementPresenceRemoteSAP != null) {
          const selector = { name: 'Name', value: response.Envelope.Body.PullResponse.Items.AMT_ManagementPresenceRemoteSAP.Name }
          if (clientObj.ciraconfig.addRemoteAccessPolicyRule) {
            const policy = {
              Trigger: 2, // 2 – Periodic
              TunnelLifeTime: 0, // 0 means that the tunnel should stay open until it is closed
              ExtendedData: 'AAAAAAAAABk=' // Equals to 25 seconds in base 64 with network order.
            }
            xmlRequestBody = this.amt.RemoteAccessService(AMT.Methods.ADD_REMOTE_ACCESS_POLICY_RULE, (clientObj.messageId++).toString(), null, policy, selector)
          } else {
            this.logger.debug(`MPS: ${JSON.stringify(selector, null, '\t')}`)
            xmlRequestBody = this.amt.ManagementPresenceRemoteSAP(AMT.Methods.DELETE, (clientObj.messageId++).toString(), null, selector)
          }
        } else {
          xmlRequestBody = this.amt.PublicKeyCertificate(AMT.Methods.ENUMERATE, (clientObj.messageId++).toString())
        }
        break
      }
      case 'DeleteResponse': {
        xmlRequestBody = this.amt.PublicKeyCertificate(AMT.Methods.ENUMERATE, (clientObj.messageId++).toString())
        break
      }
    }
    data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  validatePublicKeyCertificate (clientId: string, clientObj: ClientObject, response: any): ClientMsg {
    const action = response.Envelope.Header.Action.split('/').pop()
    let xmlRequestBody = null
    let data = null
    switch (action) {
      case 'EnumerateResponse': {
        xmlRequestBody = this.amt.PublicKeyCertificate(AMT.Methods.PULL, (clientObj.messageId++).toString(), response.Envelope.Body?.EnumerateResponse?.EnumerationContext)
        break
      }
      case 'PullResponse': {
        if (response.Envelope.Body.PullResponse.Items?.AMT_PublicKeyCertificate != null) {
          this.logger.debug(`Public Key Certificate InstanceID : ${response.Envelope.Body.PullResponse.Items.AMT_PublicKeyCertificate.InstanceID}`)
          const selector = { name: 'InstanceID', value: response.Envelope.Body.PullResponse.Items.AMT_PublicKeyCertificate.InstanceID }
          xmlRequestBody = this.amt.PublicKeyCertificate(AMT.Methods.DELETE, (clientObj.messageId++).toString(), null, selector)
        } else {
          xmlRequestBody = this.amt.EnvironmentDetectionSettingData(AMT.Methods.GET, (clientObj.messageId++).toString())
        }
        break
      }
      case 'DeleteResponse': {
        xmlRequestBody = this.amt.EnvironmentDetectionSettingData(AMT.Methods.GET, (clientObj.messageId++).toString())
        break
      }
    }
    data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  async ValidateEnvironmentDetectionSettingData (clientId: string, clientObj: ClientObject, response: any): Promise<ClientMsg> {
    const action = response.Envelope.Header.Action.split('/').pop()
    let xmlRequestBody = null
    let data = null
    switch (action) {
      case 'GetResponse': {
        const envSettings = response.Envelope.Body.AMT_EnvironmentDetectionSettingData
        if (clientObj.ciraconfig.userInitConnectionService) {
          if (EnvReader.GlobalEnvConfig.disableCIRADomainName?.toLowerCase() !== '') {
            envSettings.DetectionStrings = [EnvReader.GlobalEnvConfig.disableCIRADomainName]
          } else {
            envSettings.DetectionStrings = [`${randomUUID()}.com`]
          }
          clientObj.ciraconfig.setENVSettingDataCIRA = true
          xmlRequestBody = this.amt.EnvironmentDetectionSettingData(AMT.Methods.PUT, (clientObj.messageId++).toString(), envSettings)
          data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
          return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
        }
        if (envSettings.DetectionStrings != null && !clientObj.ciraconfig.userInitConnectionService) {
          envSettings.DetectionStrings = []
          clientObj.ciraconfig.setENVSettingData = true
          xmlRequestBody = this.amt.EnvironmentDetectionSettingData(AMT.Methods.PUT, (clientObj.messageId++).toString(), envSettings)
          data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
          return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
        }
        clientObj.ciraconfig.setENVSettingData = true
        return null
      }
      case 'PutResponse': {
        if (clientObj.ciraconfig.setENVSettingData && !clientObj.ciraconfig.setENVSettingDataCIRA) {
          clientObj.status.CIRAConnection = 'Unconfigured'
          this.logger.debug(`${clientObj.uuid} Deleted existing CIRA Configuration.`)
        }
        if (clientObj.ciraconfig.setENVSettingDataCIRA) {
          clientObj.status.CIRAConnection = 'Configured'
          MqttProvider.publishEvent('success', ['CIRAConfigurator'], 'CIRA Configured', clientObj.uuid)
          if (clientObj.ClientData.payload.profile.tlsCerts != null && clientObj.ClientData.payload.profile.tlsCerts != null) {
            clientObj.action = ClientAction.TLSCONFIG
            await this.tlsConfigurator.execute(null, clientId)
          } else {
            return this.responseMsg.get(clientId, null, 'success', 'success', JSON.stringify(clientObj.status))
          }
        }
        break
      }
    }
    return null
  }

  async ValidatePublicKeyManagementService (clientId: string, clientObj: ClientObject, response: any): Promise<ClientMsg> {
    if (response.Envelope.Body.AddTrustedRootCertificate_OUTPUT.ReturnValue !== 0) {
      throw new RPSError(`Device ${clientObj.uuid} failed to add Trusted Root Certificate.`)
    }
    clientObj.ciraconfig.addTrustedRootCert = true
    this.logger.debug(`${clientObj.uuid} Added Trusted Root Certificate.`)
    await this.setMPSPasswordInVault(clientObj)
    await this.saveDeviceInfoToMPS(clientId)
    // Add MPS Server
    const configScript: CIRAConfig = clientObj.ClientData.payload.profile.ciraConfigObject
    const server: mpsServer = {
      AccessInfo: configScript.mpsServerAddress,
      InfoFormat: configScript.serverAddressFormat,
      Port: configScript.mpsPort,
      AuthMethod: configScript.authMethod,
      Username: clientObj.mpsUsername,
      Password: clientObj.mpsPassword
    }
    if (configScript.serverAddressFormat === 3 && configScript.commonName) {
      server.CommonName = configScript.commonName
    }
    const xmlRequestBody = this.amt.RemoteAccessService(AMT.Methods.ADD_MPS, (clientObj.messageId++).toString(), server)
    const data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  ValidateRemoteAccessService (clientId: string, clientObj: ClientObject, response: any): ClientMsg {
    let xmlRequestBody = null
    let data = null
    const action = response.Envelope.Header.Action.split('/').pop()
    switch (action) {
      case 'AddMpServerResponse': {
        if (response.Envelope.Body.AddMpServer_OUTPUT.ReturnValue !== 0) {
          throw new RPSError(`Device ${clientObj.uuid} failed to add MPS server.`)
        }
        clientObj.ciraconfig.addRemoteAccessPolicyRule = true
        xmlRequestBody = this.amt.ManagementPresenceRemoteSAP(AMT.Methods.ENUMERATE, (clientObj.messageId++).toString())
        break
      }
      case 'AddRemoteAccessPolicyRuleResponse': {
        if (response.Envelope.Body.AddRemoteAccessPolicyRule_OUTPUT.ReturnValue !== 0) {
          throw new RPSError(`Device ${clientObj.uuid} failed to add access policy rule.`)
        }
        xmlRequestBody = this.amt.UserInitiatedConnectionService(AMT.Methods.REQUEST_STATE_CHANGE, (clientObj.messageId++).toString(), 32771)
        break
      }
    }
    data = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  async setMPSPasswordInVault (clientObj: ClientObject): Promise<void> {
    clientObj.mpsUsername = await (await this.configurator.profileManager.getCiraConfiguration(clientObj.ClientData.payload.profile.profileName))?.username
    clientObj.mpsPassword = await this.configurator.profileManager.getMPSPassword(clientObj.ClientData.payload.profile.profileName)

    if (clientObj.mpsUsername && clientObj.mpsPassword) {
      try {
        if (this.configurator?.secretsManager) {
          let data: any = await this.configurator.secretsManager.getSecretAtPath(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}devices/${clientObj.uuid}`)

          if (data != null) {
            data.data.MPS_PASSWORD = clientObj.mpsPassword
          } else {
            data = { data: { MPS_PASSWORD: clientObj.mpsPassword } }
          }

          await this.configurator.secretsManager.writeSecretWithObject(`${EnvReader.GlobalEnvConfig.VaultConfig.SecretsPath}devices/${clientObj.uuid}`, data)
        } else {
          MqttProvider.publishEvent('fail', ['CIRAConfigurator'], 'Secret Manager Missing', clientObj.uuid)
          throw new Error('secret manager missing')
        }
      } catch (error) {
        MqttProvider.publishEvent('fail', ['CIRAConfigurator'], 'Exception writing to vault', clientObj.uuid)
        this.logger.error(`failed to insert record guid: ${clientObj.uuid}, error: ${JSON.stringify(error)}`)
        throw new RPSError('Exception writing to vault')
      }
    } else {
      MqttProvider.publishEvent('fail', ['CIRAConfigurator'], 'mpsUsername or mpsPassword is null', clientObj.uuid)
      throw new RPSError('setMPSPassword: mpsUsername or mpsPassword is null')
    }
  }

  async saveDeviceInfoToMPS (clientId: string): Promise<boolean> {
    const clientObj = devices[clientId]
    if (clientObj.mpsUsername && clientObj.mpsPassword) {
      try {
        const profile = await this.configurator.profileManager.getAmtProfile(clientObj.ClientData.payload.profile.profileName)
        let tags = []
        if (profile?.tags != null) {
          tags = profile.tags
        }
        await got(`${EnvReader.GlobalEnvConfig.mpsServer}/api/v1/devices`, {
          method: 'POST',
          json: {
            guid: clientObj.uuid,
            hostname: clientObj.hostname,
            mpsusername: clientObj.mpsUsername,
            tags: tags,
            tenantId: profile.tenantId
          }
        })
        return true
      } catch (err) {
        this.logger.error('unable to register metadata with MPS', err)
      }
    } else {
      MqttProvider.publishEvent('fail', ['CIRAConfigurator'], 'mpsUsername or mpsPassword is null', clientObj.uuid)
      throw new RPSError(`Device ${clientObj.uuid} setMPSPassword: mpsUsername or mpsPassword is null`)
    }
    return false
  }
}
