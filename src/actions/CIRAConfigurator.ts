/*********************************************************************
 * Copyright (c) Intel Corporation 2020
 * SPDX-License-Identifier: Apache-2.0
 * Description: Activate AMT in client control mode
 * Author : Madhavi Losetty
 **********************************************************************/

import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { mpsServer, ClientObject, CIRAConfig, ClientAction } from '../models/RCS.Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { WSManProcessor } from '../WSManProcessor'
import { RPSError } from '../utils/RPSError'
import { mpsserver } from '../utils/constants'
import { IConfigurator } from '../interfaces/IConfigurator'
import { AMTUserName } from './../utils/constants'
import { EnvReader } from '../utils/EnvReader'
import got from 'got'
import { MqttProvider } from '../utils/MqttProvider'
import { TLSConfigurator } from './TLSConfigurator'
import { randomUUID } from 'crypto'
import { devices } from '../WebSocketListener'

export class CIRAConfigurator implements IExecutor {
  constructor (
    private readonly logger: ILogger,
    private readonly configurator: IConfigurator,
    private readonly responseMsg: ClientResponseMsg,
    private readonly amtwsman: WSManProcessor,
    private readonly tlsConfigurator: TLSConfigurator
  ) { }

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
      const ciraConfig = clientObj.ciraconfig
      if (message?.payload != null || !ciraConfig.policyRuleUserInitiate) {
        await this.delete(clientId, message)
        const wsmanResponse = message.payload
        if (clientObj.ClientData.payload.profile.ciraConfigName && ciraConfig.setENVSettingData) {
          // Add trusted root certificate and MPS server
          if (ciraConfig.mpsRemoteSAPDelete && !ciraConfig.addTrustedRootCert) {
            ciraConfig.addTrustedRootCert = true
            const configScript: CIRAConfig = clientObj.ClientData.payload.profile.ciraConfigObject
            await this.amtwsman.execute(clientId, 'AMT_PublicKeyManagementService', 'AddTrustedRootCertificate', { CertificateBlob: configScript.mpsRootCertificate }, null, AMTUserName, clientObj.ClientData.payload.password)
          } else if (ciraConfig.addTrustedRootCert && !ciraConfig.addMPSServer) {
            this.logger.debug(`${clientObj.uuid}  Adding trusted root certificate.`)
            ciraConfig.addMPSServer = true

            await this.setMPSPassword(clientId)

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
              server.CN = configScript.commonName
            }
            await this.amtwsman.execute(clientId, 'AMT_RemoteAccessService', 'AddMpServer', server, null, AMTUserName, clientObj.ClientData.payload.password)
          } else if (ciraConfig.addMPSServer && !ciraConfig.mpsRemoteSAP) {
            ciraConfig.mpsRemoteSAP = true
            if (wsmanResponse.Body && wsmanResponse.Body.ReturnValueStr === 'SUCCESS') {
              MqttProvider.publishEvent('success', ['CIRAConfigurator'], 'Management Presence Server (MPS) successfully added', clientObj.uuid)
              this.logger.debug(`${clientObj.uuid}  Management Presence Server (MPS) successfully added.`)
              await this.amtwsman.batchEnum(clientId, 'AMT_ManagementPresenceRemoteSAP', AMTUserName, clientObj.ClientData.payload.uuid)
            } else {
              MqttProvider.publishEvent('fail', ['CIRAConfigurator'], 'Failed to add Management Presence Server', clientObj.uuid)
              this.logger.error('AMT_ManagementPresenceRemoteSAP')
              throw new RPSError(`Device ${clientObj.uuid} Failed to add Management Presence Server.`)
            }
          } else if (!ciraConfig.addRemoteAccessPolicyRule && ciraConfig.addMPSServer) {
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
                ciraConfig.addRemoteAccessPolicyRule = true
                await this.amtwsman.execute(clientId, 'AMT_RemoteAccessService', 'AddRemoteAccessPolicyRule', policy, null, AMTUserName, clientObj.ClientData.payload.password)
              } else {
                MqttProvider.publishEvent('fail', ['CIRAConfigurator'], 'Failed to add Management Presence Server', clientObj.uuid)
                this.logger.error('AMT_RemoteAccessService')
                throw new RPSError(`Device ${clientObj.uuid} Failed to add Management Presence Server.`)
              }
            }
          } else if (!ciraConfig.userInitConnectionService && ciraConfig.addRemoteAccessPolicyRule) {
            ciraConfig.userInitConnectionService = true
            await this.amtwsman.execute(clientId, 'AMT_UserInitiatedConnectionService', 'RequestStateChange', { RequestedState: 32771 }, null, AMTUserName, clientObj.ClientData.payload.password)
          } else if (ciraConfig.userInitConnectionService && !ciraConfig.getENVSettingDataCIRA) {
            ciraConfig.getENVSettingDataCIRA = true
            await this.amtwsman.batchEnum(clientId, '*AMT_EnvironmentDetectionSettingData', AMTUserName, clientObj.ClientData.payload.uuid)
          } else if (ciraConfig.getENVSettingData && !ciraConfig.setENVSettingDataCIRA) {
            const envSettings = wsmanResponse.AMT_EnvironmentDetectionSettingData.response
            this.logger.debug(`Environment settings : ${JSON.stringify(envSettings, null, '\t')}`)
            if (EnvReader.GlobalEnvConfig.disableCIRADomainName?.toLowerCase() !== '') {
              envSettings.DetectionStrings = EnvReader.GlobalEnvConfig.disableCIRADomainName // this can be whatever.com
            } else {
              envSettings.DetectionStrings = `${randomUUID()}.com`
            }
            ciraConfig.setENVSettingDataCIRA = true
            await this.amtwsman.put(clientId, 'AMT_EnvironmentDetectionSettingData', envSettings, AMTUserName, clientObj.ClientData.payload.password)
          } else if (ciraConfig.setENVSettingDataCIRA) {
            clientObj.status.CIRAConnection = 'Configured'
            MqttProvider.publishEvent('success', ['CIRAConfigurator'], 'CIRA Configured', clientObj.uuid)
            //  TBD: Need to refactor this repetitive code
            if (clientObj.ClientData.payload.profile.tlsCerts != null && clientObj.ClientData.payload.profile.tlsCerts != null) {
              clientObj.action = ClientAction.TLSCONFIG
              await this.tlsConfigurator.execute(message, clientId)
            } else {
              return this.responseMsg.get(clientId, null, 'success', 'success', JSON.stringify(clientObj.status))
            }
          }
        } else if (ciraConfig.setENVSettingData) {
          MqttProvider.publishEvent('success', ['CIRAConfigurator'], 'CIRA Configured', clientObj.uuid)
          if (clientObj.ClientData.payload.profile.tlsCerts != null && clientObj.ClientData.payload.profile.tlsCerts != null) {
            clientObj.action = ClientAction.TLSCONFIG
            await this.tlsConfigurator.execute(message, clientId)
          } else {
            return this.responseMsg.get(clientId, null, 'success', 'success', JSON.stringify(clientObj.status))
          }
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

  /**
     * @description Delete existing CIRA configurations
     * @param {string} clientId Id to keep track of connections
     * @param {clientObj} ClientObject keep track of client info and status
     * @param {any} message valid client message
     */
  async delete (clientId: string, message: any): Promise<void> {
    const clientObj = devices[clientId]
    const ciraConfig = clientObj.ciraconfig
    const wsmanResponse: any = message?.payload
    if (!ciraConfig.policyRuleUserInitiate) {
      this.logger.debug(`Deleting CIRA Configuration for device ${clientObj.ClientData.payload.uuid}`)
      ciraConfig.policyRuleUserInitiate = true
      await this.amtwsman.delete(clientId, 'AMT_RemoteAccessPolicyRule', { PolicyRuleName: 'User Initiated' }, AMTUserName, clientObj.ClientData.payload.password)
    } else if (!ciraConfig.policyRuleAlert) {
      ciraConfig.policyRuleAlert = true
      await this.amtwsman.delete(clientId, 'AMT_RemoteAccessPolicyRule', { PolicyRuleName: 'Alert' }, AMTUserName)
    } else if (!ciraConfig.policyRulePeriodic) {
      ciraConfig.policyRulePeriodic = true
      await this.amtwsman.delete(clientId, 'AMT_RemoteAccessPolicyRule', { PolicyRuleName: 'Periodic' }, AMTUserName)
    } else if (!ciraConfig.mpsRemoteSAPEnumerate) {
      this.logger.debug(`${clientObj.uuid}: All policies are removed successfully.`)
      ciraConfig.mpsRemoteSAPEnumerate = true
      await this.amtwsman.batchEnum(clientId, 'AMT_ManagementPresenceRemoteSAP')
    } else if (!ciraConfig.mpsRemoteSAPDelete && wsmanResponse?.AMT_ManagementPresenceRemoteSAP) {
      ciraConfig.mpsRemoteSAPDelete = true
      let selector: any
      if (wsmanResponse?.AMT_ManagementPresenceRemoteSAP.responses.length > 0) {
        const name = wsmanResponse.AMT_ManagementPresenceRemoteSAP.responses[0].Name
        selector = { Name: name }
        this.logger.debug(`MPS Name : ${name},  selector : ${JSON.stringify(selector, null, '\t')}`)
        await this.amtwsman.delete(clientId, 'AMT_ManagementPresenceRemoteSAP', selector, AMTUserName)
        return
      }
    }
    // Deletes all the public certificates if exists
    if (ciraConfig.mpsRemoteSAPDelete && !ciraConfig.mpsRemoteSAPGet) {
      ciraConfig.mpsRemoteSAPGet = true
      await this.amtwsman.batchEnum(clientId, 'AMT_PublicKeyCertificate')
    } else if (ciraConfig.mpsRemoteSAPGet && !ciraConfig.mpsPublicCertDelete) {
      if (ciraConfig.publicCerts == null) {
        ciraConfig.publicCerts = wsmanResponse?.AMT_PublicKeyCertificate.responses
      }
      if (ciraConfig.publicCerts?.length > 0) {
        const cert = ciraConfig.publicCerts[ciraConfig.publicCerts.length - 1]
        ciraConfig.publicCerts.pop()
        await this.amtwsman.delete(clientId, 'AMT_PublicKeyCertificate', cert, AMTUserName)
      } else {
        ciraConfig.mpsPublicCertDelete = true
      }
    }
    // Max five domain suffix can be added. Deletes all the domain suffixes for now.
    if (ciraConfig.mpsPublicCertDelete && !ciraConfig.getENVSettingData) {
      ciraConfig.getENVSettingData = true
      await this.amtwsman.batchEnum(clientId, '*AMT_EnvironmentDetectionSettingData', AMTUserName)
    } else if (ciraConfig.getENVSettingData && !ciraConfig.setENVSettingData) {
      if (wsmanResponse.AMT_EnvironmentDetectionSettingData?.response?.DetectionStrings != null) {
        const envSettings = wsmanResponse.AMT_EnvironmentDetectionSettingData.response
        envSettings.DetectionStrings = []
        await this.amtwsman.put(clientId, 'AMT_EnvironmentDetectionSettingData', envSettings, AMTUserName)
      } else {
        ciraConfig.setENVSettingData = true
        clientObj.status.CIRAConnection = 'Unconfigured'
        this.logger.debug(`${clientObj.uuid} Deleted existing CIRA Configuration.`)
      }
    }
  }

  /**
   * @description Set MPS password for the AMT
   * @param {ClientObject} clientObj
   */
  async setMPSPassword (clientId: string): Promise<void> {
    this.logger.debug('setting MPS password')
    const clientObj = devices[clientId]
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
      } catch (err) {
        this.logger.error('unable to register metadata with MPS', err)
      }
    } else {
      MqttProvider.publishEvent('fail', ['CIRAConfigurator'], 'mpsUsername or mpsPassword is null', clientObj.uuid)
      throw new RPSError('setMPSPassword: mpsUsername or mpsPassword is null')
    }
  }
}
