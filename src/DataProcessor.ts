/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 * Description: Process client data and gets response for desired action
 **********************************************************************/
import * as WebSocket from 'ws'

import { ILogger } from './interfaces/ILogger'
import { IDataProcessor } from './interfaces/IDataProcessor'
import { IClientManager } from './interfaces/IClientManager'
import { ClientMsg, ClientAction, ClientMethods, ClientObject } from './RCS.Config'
import { ClientActions } from './ClientActions'
import { ICertManager } from './interfaces/ICertManager'
import { SignatureHelper } from './utils/SignatureHelper'
import Logger from './Logger'
import { IConfigurator } from './interfaces/IConfigurator'
import { RPSError } from './utils/RPSError'
import { WSManProcessor } from './WSManProcessor'
import { ClientResponseMsg } from './utils/ClientResponseMsg'
import { IValidator } from './interfaces/IValidator'
import { AMTDomain } from './models/Rcs'
// import { MqttProvider } from './utils/MqttProvider'

export class DataProcessor implements IDataProcessor {
  private readonly clientActions: ClientActions

  constructor (
    private readonly logger: ILogger,
    private readonly signatureHelper: SignatureHelper,
    private readonly configurator: IConfigurator,
    private readonly validator: IValidator,
    private readonly certManager: ICertManager,
    private readonly clientManager: IClientManager,
    private readonly responseMsg: ClientResponseMsg,
    private readonly amtwsman: WSManProcessor
  ) {
    this.clientActions = new ClientActions(new Logger('ClientActions'), configurator, certManager, signatureHelper, responseMsg, amtwsman, clientManager, validator)
  }

  /**
     * @description Process client data and gets response for desired action
     * @param {WebSocket.Data} message the message coming in over the websocket connection
     * @param {string} clientId Id to keep track of connections
     * @returns {RCSMessage} returns configuration message
     */
  async processData (message: WebSocket.Data, clientId: string): Promise<ClientMsg | null> {
    try {
      let clientMsg: ClientMsg = null

      try {
        clientMsg = this.validator.parseClientMsg(message, clientId)
      } catch (parseErr) {
        throw new RPSError(parseErr)
      }

      switch (clientMsg.method) {
        case ClientMethods.ACTIVATION: {
          return await this.checkSecuredHostBasedConfiguration(clientMsg, clientId)
        }
        case ClientMethods.SECURECONFIGRESPONSE: {
          return await this.activateDevice(clientMsg, clientId)
        }
        case ClientMethods.DEACTIVATION: {
          await this.deactivateDevice(clientMsg, clientId)
          return null
        }
        case ClientMethods.RESPONSE: {
          return await this.handleResponse(clientMsg, clientId)
        }
        case ClientMethods.HEARTBEAT: {
          return await this.heartbeat(clientMsg, clientId)
        }
        default: {
          const uuid = clientMsg.payload.uuid ? clientMsg.payload.uuid : this.clientManager.getClientObject(clientId).ClientData.payload.uuid
          throw new RPSError(`Device ${uuid} Not a supported method received from AMT device`)
        }
      }
    } catch (error) {
      this.logger.error(`${clientId} : Failed to process data - ${error.message}`)
      if (error instanceof RPSError) {
        return this.responseMsg.get(clientId, null, 'error', 'failed', error.message)
      } else {
        this.responseMsg.get(clientId, null, 'error', 'failed', 'request failed')
      }
    }
  }

  async checkSecuredHostBasedConfiguration (clientMsg: ClientMsg, clientId: string): Promise<ClientMsg> {
    this.logger.debug(`ProcessData: Parsed Message received from device ${clientMsg.payload.uuid}: ${JSON.stringify(clientMsg, null, '\t')}`)

    await this.validator.validateActivationMsg(clientMsg, clientId) // Validate the activation message payload
    const clientObj = this.clientManager.getClientObject(clientId)
    if (parseInt(clientObj.ClientData.payload.ver) >= 14) {
      return await this.getAcmCertChain(clientMsg, clientId)
    } else {
      return await this.activateDevice(clientMsg, clientId)
    }
  }

  async activateDevice (clientMsg: ClientMsg, clientId: string): Promise<ClientMsg> {
    const clientObj: ClientObject = this.clientManager.getClientObject(clientId)
    if (clientMsg.method === ClientMethods.SECURECONFIGRESPONSE && clientMsg.status === 'failed') {
      throw new RPSError(`Device ${clientObj.uuid} failed to establish a secured host based configuration`)
    } else if ((clientObj.action === ClientAction.ADMINCTLMODE || clientObj.action === ClientAction.CLIENTCTLMODE) && !clientObj.ClientData.payload.digestRealm) {
      // Makes the first wsman call
      await this.amtwsman.batchEnum(clientId, '*AMT_GeneralSettings')
    } else {
      const response = await this.clientActions.buildResponseMessage(clientMsg, clientId)
      return response
    }
  }

  async deactivateDevice (clientMsg: ClientMsg, clientId: string): Promise<void> {
    this.logger.debug(`ProcessData: Parsed DEACTIVATION Message received from device ${clientMsg.payload.uuid}: ${JSON.stringify(clientMsg, null, '\t')}`)
    await this.validator.validateDeactivationMsg(clientMsg, clientId) // Validate the deactivation message payload
    await this.amtwsman.getWSManResponse(clientId, 'AMT_SetupAndConfigurationService', 'admin')
  }

  async handleResponse (clientMsg: ClientMsg, clientId: string): Promise<ClientMsg> {
    const clientObj = this.clientManager.getClientObject(clientId)
    const payload = clientObj.ClientData.payload
    // this.logger.debug(`ProcessData: Parsed Message received from device ${payload.uuid}, clientId: ${clientId}: ${JSON.stringify(clientMsg, null, "\t")}`);
    const msg = clientMsg.payload.split('\r\n')
    const statusCode = msg[0]?.substr(9, 3).trim()

    if (statusCode === '401') {
      return this.amtwsman.parseWsManResponseXML(clientMsg.payload, clientId, statusCode)
    } else if (statusCode === '200') {
      clientMsg.payload = this.amtwsman.parseWsManResponseXML(clientMsg.payload, clientId, statusCode)
      this.logger.debug(`Device ${payload.uuid} wsman response ${statusCode}: ${JSON.stringify(clientMsg.payload, null, '\t')}`)
    } else {
      clientMsg.payload = this.amtwsman.parseWsManResponseXML(clientMsg.payload, clientId, statusCode)
      this.logger.debug(`Device ${payload.uuid} wsman response ${statusCode}: ${JSON.stringify(clientMsg.payload, null, '\t')}`)
      // if (clientObj.action !== ClientAction.CIRACONFIG) {
      //   throw new RPSError(`Device ${payload.uuid} activation failed. Bad wsman response from AMT device`)
      // }
    }
    if (clientMsg.payload != null) {
      return await this.clientActions.buildResponseMessage(clientMsg, clientId)
    }
  }

  async heartbeat (clientMsg: ClientMsg, clientId: string): Promise<ClientMsg> {
    const clientObj = this.clientManager.getClientObject(clientId)
    const currentTime = new Date().getTime()
    if (currentTime >= clientObj.delayEndTime) {
      return await this.clientActions.buildResponseMessage(clientMsg, clientId)
    } else {
      await new Promise(resolve => setTimeout(resolve, 5000)) // TODO: make configurable rate if required by customers
      return this.responseMsg.get(clientId, null, 'heartbeat_request', 'heartbeat', '')
    }
  }

  async getAcmCertChain (clientMsg: ClientMsg, clientId: string): Promise<ClientMsg> {
    const payload = {
      algorithm: 'SHA256',
      hash: null
    }
    try {
      const clientObj = this.clientManager.getClientObject(clientId)
      const amtDomain: AMTDomain = await this.configurator.domainCredentialManager.getProvisioningCert(clientObj.ClientData.payload.fqdn)
      // this.logger.debug(`domain : ${JSON.stringify(amtDomain)}`)
      // Verify that the certificate path points to a file that exists
      // if (!amtDomain.provisioningCert) {
      //   // MqttProvider.publishEvent('fail', ['Activator'], 'Failed to activate. AMT provisioning certificate not found on server', clientObj.uuid)
      //   throw new RPSError(`Device ${clientObj.uuid} activation failed. AMT provisioning certificate not found on server`)
      // }
      // read in cert
      const pfxb64: string = Buffer.from(amtDomain.provisioningCert, 'base64').toString('base64')
      // convert the certificate pfx to an object
      const pfxobj = this.certManager.convertPfxToObject(pfxb64, amtDomain.provisioningCertPassword)
      if (pfxobj.errorText) {
        return pfxobj
      }
      // return the certificate chain pems and private key
      const certChainPfx = this.certManager.dumpPfx(pfxobj)
      this.logger.info('certChainPfx', certChainPfx)
      // check that provisioning certificate root matches one of the trusted roots from AMT
      for (const hash in clientMsg.payload.certHashes) {
        this.logger.info('Finger Print', clientMsg.payload.certHashes[hash]?.toLowerCase(), certChainPfx.fingerprint?.toLowerCase())
        if (clientMsg.payload.certHashes[hash]?.toLowerCase() === certChainPfx.fingerprint?.toLowerCase()) {
          this.logger.info('match')
          clientObj.certObj = certChainPfx.provisioningCertificateObj
          this.clientManager.setClientObject(clientObj)
        } else {
          this.logger.info('does not match')
        }
      }
      this.logger.info('certObject', clientObj.certObj)
      if (clientObj.certObj != null) {
        this.logger.info('certchain 0', clientObj.certObj.certChain[0])
        payload.hash = this.certManager.getCertHashSha256(clientObj.certObj.certChain[0])
      }
    } catch (error) {
      this.logger.error(`${clientId} : Failed to get provisioning certificate. Error: ${error}`)
      return null
    }
    return this.responseMsg.get(clientId, JSON.stringify(payload), 'secure_config_request', 'cool', 'hello')
  }
}
