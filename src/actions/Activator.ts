/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: Activate AMT in admin control mode
 * Author : Madhavi Losetty
 **********************************************************************/

import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { SignatureHelper } from '../utils/SignatureHelper'
import { PasswordHelper } from '../utils/PasswordHelper'
import { ClientMsg, ClientAction, ClientObject } from '../models/RCS.Config'
import { IConfigurator } from '../interfaces/IConfigurator'
import { AMTDeviceDTO } from '../repositories/dto/AmtDeviceDTO'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { WSManProcessor } from '../WSManProcessor'
import { IClientManager } from '../interfaces/IClientManager'
import { IValidator } from '../interfaces/IValidator'
import { RPSError } from '../utils/RPSError'
import { EnvReader } from '../utils/EnvReader'
import { NetworkConfigurator } from './NetworkConfigurator'
import { AMTUserName } from '../utils/constants'
import { AMTDomain } from '../models/Rcs'
import got from 'got'
import { MqttProvider } from '../utils/MqttProvider'
import { setMEBXPassword } from '../utils/maintenance/setMEBXPassword'
import { CertManager } from '../CertManager'
import { updateAMTAdminPassword } from '../utils/maintenance/updateAMTAdminPassword'

export class Activator implements IExecutor {
  constructor (
    private readonly logger: ILogger,
    private readonly configurator: IConfigurator,
    private readonly certManager: CertManager,
    private readonly signatureHelper: SignatureHelper,
    private readonly responseMsg: ClientResponseMsg,
    private readonly amtwsman: WSManProcessor,
    private readonly clientManager: IClientManager,
    private readonly validator: IValidator,
    private readonly networkConfigurator: NetworkConfigurator
  ) { }

  /**
   * @description Create configuration message to activate AMT in admin control mode
   * @param {any} message valid client message
   * @param {string} clientId Id to keep track of connections
   * @returns {RCSMessage} message to sent to client
   */
  async execute (message: any, clientId: string): Promise<ClientMsg> {
    let clientObj: ClientObject
    try {
      clientObj = this.clientManager.getClientObject(clientId)
      const wsmanResponse = message.payload
      if (!clientObj.activationStatus.activated && !wsmanResponse) {
        MqttProvider.publishEvent('fail', ['Activator', 'execute'], 'Missing/invalid WSMan response payload', clientObj.uuid)
        throw new RPSError(`Device ${clientObj.uuid} activation failed. Missing/invalid WSMan response payload.`)
      } else if (clientObj.activationStatus.activated && clientObj.activationStatus.changePassword) {
        const result = await updateAMTAdminPassword(clientId, wsmanResponse, this.amtwsman, this.clientManager, this.configurator, this.validator)
        if (result) {
          clientObj.activationStatus.changePassword = false
          if (clientObj.action === ClientAction.ADMINCTLMODE) {
            clientObj.activationStatus.missingMebxPassword = true
          }
          await this.waitAfterActivation(clientId, clientObj, wsmanResponse)
          this.clientManager.setClientObject(clientObj)
          this.logger.debug(`${clientId} : AMT admin password updated: ${clientObj.uuid}`)
        }
      } else if (clientObj.activationStatus.activated) {
        const msg = await this.waitAfterActivation(clientId, clientObj, wsmanResponse)
        return msg
      } else {
        const msg = await this.processWSManJsonResponse(message, clientId)
        if (msg) {
          return msg
        }
      }

      // clientObj = this.clientManager.getClientObject(clientId)
      if (clientObj.ClientData.payload.fwNonce && clientObj.action === ClientAction.ADMINCTLMODE) {
        await this.performACMSteps(clientId, clientObj)
      }
      if (((clientObj.action === ClientAction.ADMINCTLMODE && clientObj.certObj && clientObj.count > clientObj.certObj.certChain.length) || (clientObj.action === ClientAction.CLIENTCTLMODE)) && !clientObj.activationStatus.activated) {
        const amtPassword: string = await this.configurator.profileManager.getAmtPassword(clientObj.ClientData.payload.profile.profileName)
        clientObj.amtPassword = amtPassword
        this.clientManager.setClientObject(clientObj)

        const data: string = `admin:${clientObj.ClientData.payload.digestRealm}:${amtPassword}`
        const password = SignatureHelper.createMd5Hash(data)
        if (clientObj.action === ClientAction.ADMINCTLMODE) {
          // Activate in ACM
          await this.amtwsman.setupACM(clientId, password, clientObj.nonce.toString('base64'), clientObj.signature)
        } else {
        // Activate in CCM
          await this.amtwsman.setupCCM(clientId, password)
        }
      }
    } catch (error) {
      this.logger.error(`${clientId} : Failed to activate - ${error}`)
      MqttProvider.publishEvent('fail', ['Activator'], 'Failed to activate', clientObj.uuid)
      if (error instanceof RPSError) {
        clientObj.status.Status = error.message
      } else {
        clientObj.status.Status = 'Failed'
      }
      return this.responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify(clientObj.status))
    }
  }

  /**
   * @description check for the matching certificates
   * @param {string} clientId Id to keep track of connections
   * @param {string} cert
   * @param {string} password
   * @returns {any} returns cert object
   */
  GetProvisioningCertObj (clientMsg: ClientMsg, cert: string, password: string, clientId: string): any {
    // TODO: Look to change this to return a type
    try {
      // read in cert
      const pfxb64: string = Buffer.from(cert, 'base64').toString('base64')
      // convert the certificate pfx to an object
      const pfxobj = this.certManager.convertPfxToObject(pfxb64, password)
      if (pfxobj.errorText) {
        return pfxobj
      }
      // return the certificate chain pems and private key
      const certChainPfx = this.certManager.dumpPfx(pfxobj)
      // check that provisioning certificate root matches one of the trusted roots from AMT
      for (const hash in clientMsg.payload.certHashes) {
        if (clientMsg.payload.certHashes[hash]?.toLowerCase() === certChainPfx.fingerprint?.toLowerCase()) {
          return certChainPfx.provisioningCertificateObj
        }
      }
    } catch (error) {
      this.logger.error(`${clientId} : Failed to get provisioning certificate. Error: ${error}`)
      return null
    }
  }

  /**
   * @description Parse the wsman response received from AMT
   * @param {string} clientId Id to keep track of connections
   * @param {string} message
   */
  async processWSManJsonResponse (message: any, clientId: string): Promise<ClientMsg> {
    // TODO: Move Header Methods to a model and use as a constant
    // TODO: Centralize error handling that is repeated
    // TODO: break out decision content to separate functions
    const clientObj = this.clientManager.getClientObject(clientId)
    const wsmanResponse = message.payload
    // Process the next step in the activation flow based on the response from the client
    if (wsmanResponse.AMT_GeneralSettings) {
      // Response from GeneralSettings wsman call
      const digestRealm = wsmanResponse.AMT_GeneralSettings.response.DigestRealm
      // Validate Digest Realm
      if (!this.validator.isDigestRealmValid(digestRealm)) {
        throw new RPSError(`Device ${clientObj.uuid} activation failed. Not a valid digest realm.`)
      }
      clientObj.ClientData.payload.digestRealm = digestRealm
      clientObj.hostname = clientObj.ClientData.payload.hostname
      this.clientManager.setClientObject(clientObj)
      if (clientObj.ClientData.payload.fwNonce == null && clientObj.action === ClientAction.ADMINCTLMODE) {
        await this.amtwsman.batchEnum(clientId, '*IPS_HostBasedSetupService')
      }
    } else if (wsmanResponse.IPS_HostBasedSetupService) {
      // Response from IPS_HostBasedSetup wsman call
      const response = wsmanResponse.IPS_HostBasedSetupService.response
      clientObj.ClientData.payload.fwNonce = Buffer.from(response.ConfigurationNonce, 'base64')
      clientObj.ClientData.payload.modes = response.AllowedControlModes
      this.clientManager.setClientObject(clientObj)
    } else if (wsmanResponse.Header && wsmanResponse.Header.Method === 'AddNextCertInChain') {
      // Response from injectCertificate call
      if (wsmanResponse.Body.ReturnValue !== 0) {
        throw new RPSError(`Device ${clientObj.uuid} activation failed. Error while adding the certificates to AMT.`)
      } else {
        this.logger.debug(`cert added to AMT device ${clientObj.uuid}`)
      }
    } else if (wsmanResponse.Header && wsmanResponse.Header.Method === 'AdminSetup') {
      // Response from setupACM call
      if (wsmanResponse.Body.ReturnValue !== 0) {
        throw new RPSError(`Device ${clientObj.uuid} activation failed. Error while activating the AMT device in admin mode.`)
      } else {
        this.logger.debug(`Device ${clientObj.uuid} activated in admin mode.`)
        clientObj.status.Status = 'Admin control mode'
        clientObj.activationStatus.activated = true
        this.clientManager.setClientObject(clientObj)
        await this.saveDeviceInfo(clientObj)
        const msg = await this.waitAfterActivation(clientId, clientObj)
        MqttProvider.publishEvent('success', ['Activator', 'execute'], 'Device activated in admin control mode', clientObj.uuid)
        return msg
      }
    } else if (wsmanResponse.Header.Method === 'Setup') {
      // Response from setupCCM call
      if (wsmanResponse.Body.ReturnValue !== 0) {
        throw new RPSError(`Device ${clientObj.uuid} activation failed. Error while activating the AMT device in client mode.`)
      } else {
        this.logger.debug(`Device ${clientObj.uuid} activated in client mode.`)
        clientObj.status.Status = 'Client control mode'
        clientObj.activationStatus.activated = true
        this.clientManager.setClientObject(clientObj)
        await this.saveDeviceInfo(clientObj)
        const msg = await this.waitAfterActivation(clientId, clientObj)
        MqttProvider.publishEvent('success', ['Activator', 'execute'], 'Device activated in client control mode', clientObj.uuid)
        return msg
      }
    } else {
      throw new RPSError(`Device ${clientObj.uuid} sent an invalid response.`)
    }
  }

  /**
   * @description Waiting for few seconds after activation as required by AMT
   * @param {string} clientId Id to keep track of connections
   * @param {ClientObject} clientObj
   * @returns {ClientMsg} returns message to client
   */
  async waitAfterActivation (clientId: string, clientObj: ClientObject, wsmanResponse: any = null): Promise<ClientMsg> {
    if (clientObj.delayEndTime == null) {
      this.logger.debug(`waiting for ${EnvReader.GlobalEnvConfig.delayTimer} seconds after activation`)
      const endTime: Date = new Date()
      clientObj.delayEndTime = endTime.setSeconds(endTime.getSeconds() + EnvReader.GlobalEnvConfig.delayTimer)
      this.clientManager.setClientObject(clientObj)
      this.logger.debug(`Delay end time : ${clientObj.delayEndTime}`)
    }
    const currentTime = new Date().getTime()
    if (currentTime >= clientObj.delayEndTime || clientObj.activationStatus.missingMebxPassword) {
      this.logger.debug(`Delay ${EnvReader.GlobalEnvConfig.delayTimer} seconds after activation completed`)
      /* Update the wsman stack username and password */
      if (this.amtwsman.cache[clientId]) {
        this.amtwsman.cache[clientId].wsman.comm.setupCommunication.getUsername = (): string => { return AMTUserName }
        this.amtwsman.cache[clientId].wsman.comm.setupCommunication.getPassword = (): string => { return clientObj.amtPassword }
      }
      if (clientObj.action === ClientAction.ADMINCTLMODE && clientObj.mebxPassword == null) {
      /* Set MEBx password called after the activation as the API is accessible only with admin user */
        await setMEBXPassword(clientId, null, this.amtwsman, this.clientManager, this.configurator)
      } else if (clientObj.action === ClientAction.ADMINCTLMODE && clientObj.mebxPassword != null) {
        const result = await setMEBXPassword(clientId, wsmanResponse, this.amtwsman, this.clientManager, this.configurator)
        // Response from setMEBxPassword call
        if (result) {
          this.logger.debug(`Device ${clientObj.uuid} MEBx password updated.`)
        } else {
          this.logger.debug(`Device ${clientObj.uuid} failed to update MEBx password.`)
        }
        clientObj.action = ClientAction.NETWORKCONFIG
        this.clientManager.setClientObject(clientObj)
        await this.networkConfigurator.execute(null, clientId)
      } else if (clientObj.action === ClientAction.CLIENTCTLMODE) {
        clientObj.action = ClientAction.NETWORKCONFIG
        this.clientManager.setClientObject(clientObj)
        await this.networkConfigurator.execute(null, clientId)
      }
    } else {
      this.logger.debug(`Current Time: ${currentTime} Delay end time : ${clientObj.delayEndTime}`)
      return this.responseMsg.get(clientId, null, 'heartbeat_request', 'heartbeat', '')
    }
  }

  /**
   * @description Performs the ACM specific steps
   * @param {string} clientId Id to keep track of connections
   * @param {ClientObject} clientObj
   */
  async performACMSteps (clientId: string, clientObj: ClientObject): Promise<void> {
    if (!clientObj.count) {
      clientObj.count = 0
      const amtDomain: AMTDomain = await this.configurator.domainCredentialManager.getProvisioningCert(clientObj.ClientData.payload.fqdn)
      this.logger.debug(`domain : ${JSON.stringify(amtDomain)}`)
      // Verify that the certificate path points to a file that exists
      if (!amtDomain.provisioningCert) {
        MqttProvider.publishEvent('fail', ['Activator'], 'Failed to activate. AMT provisioning certificate not found on server', clientObj.uuid)
        throw new RPSError(`Device ${clientObj.uuid} activation failed. AMT provisioning certificate not found on server`)
      }
      clientObj.certObj = this.GetProvisioningCertObj(clientObj.ClientData, amtDomain.provisioningCert, amtDomain.provisioningCertPassword, clientId)
      if (clientObj.certObj) {
        // Check if we got an error while getting the provisioning cert object
        if (clientObj.certObj.errorText) {
          MqttProvider.publishEvent('fail', ['Activator'], 'Failed to activate', clientObj.uuid)
          throw new RPSError(clientObj.certObj.errorText)
        }
      } else {
        MqttProvider.publishEvent('fail', ['Activator'], 'Failed to activate. Provisioning certificate doesn\'t match any trusted certificates from AMT', clientObj.uuid)
        throw new RPSError(`Device ${clientObj.uuid} activation failed. Provisioning certificate doesn't match any trusted certificates from AMT`)
      }
    }
    await this.injectCertificate(clientId, clientObj)
    if (clientObj.count > clientObj.certObj.certChain.length && !clientObj.activationStatus.activated) {
      await this.createSignedString(clientObj)
    }
  }

  /**
  * @description Injects provisoining certificate into AMT
  * @param {string} clientId Id to keep track of connections
  * @param {ClientObject} clientObj
  */
  async injectCertificate (clientId: string, clientObj: ClientObject): Promise<void> {
    if (clientObj.count === clientObj.certObj.certChain.length) {
      ++clientObj.count
      this.clientManager.setClientObject(clientObj)
    }
    // inject certificates in proper order with proper flags
    if (clientObj.count <= clientObj.certObj.certChain.length - 1) {
      if (clientObj.count === 0) {
        await this.amtwsman.getCertChainWSManResponse(clientObj.certObj.certChain[clientObj.count], true, false, clientId)
      } else if (clientObj.count > 0 && clientObj.count < clientObj.certObj.certChain.length - 1) {
        await this.amtwsman.getCertChainWSManResponse(clientObj.certObj.certChain[clientObj.count], false, false, clientId)
      } else if (clientObj.count === clientObj.certObj.certChain.length - 1) {
        await this.amtwsman.getCertChainWSManResponse(clientObj.certObj.certChain[clientObj.count], false, true, clientId)
      }
      ++clientObj.count
      this.clientManager.setClientObject(clientObj)
    }
  }

  /**
   * @description Creates the signed string required by AMT
   * @param {ClientObject} clientObj
   */
  async createSignedString (clientObj: ClientObject): Promise<void> {
    clientObj.nonce = PasswordHelper.generateNonce()
    const arr: Buffer[] = [clientObj.ClientData.payload.fwNonce, clientObj.nonce]
    clientObj.signature = this.signatureHelper.signString(Buffer.concat(arr), clientObj.certObj.privateKey)
    this.clientManager.setClientObject(clientObj)
    if (clientObj.signature.errorText) {
      MqttProvider.publishEvent('fail', ['Activator'], 'Failed to activate', clientObj.uuid)
      throw new RPSError(clientObj.signature.errorText)
    }
  }

  /**
   * @description Saves the AMT device information to the database
   * @param {ClientObject} clientObj
   * @param {string} amtPassword
   */
  async saveDeviceInfo (clientObj: ClientObject): Promise<void> {
    if (this.configurator?.amtDeviceRepository) {
      if (clientObj.action === ClientAction.ADMINCTLMODE) {
        await this.configurator.amtDeviceRepository.insert(new AMTDeviceDTO(clientObj.uuid,
          clientObj.hostname,
          clientObj.mpsUsername,
          clientObj.mpsPassword,
          EnvReader.GlobalEnvConfig.amtusername,
          clientObj.amtPassword,
          clientObj.mebxPassword
        ))
      } else {
        await this.configurator.amtDeviceRepository.insert(new AMTDeviceDTO(clientObj.uuid,
          clientObj.hostname,
          clientObj.mpsUsername,
          clientObj.mpsPassword,
          EnvReader.GlobalEnvConfig.amtusername,
          clientObj.amtPassword,
          null))
      }
    } else {
      MqttProvider.publishEvent('fail', ['Activator'], 'Unable to write device', clientObj.uuid)
      this.logger.error('unable to write device')
    }
    /* Register device metadata with MPS */
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
      MqttProvider.publishEvent('fail', ['Activator'], 'unable to register metadata with MPS', clientObj.uuid)
      this.logger.error('unable to register metadata with MPS', err)
    }
  }
}
