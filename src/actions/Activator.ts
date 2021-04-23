/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description: Activate AMT in admin control mode
 * Author : Madhavi Losetty
 **********************************************************************/

import { IExecutor } from '../interfaces/IExecutor'
import { ICertManager } from '../interfaces/ICertManager'
import { ILogger } from '../interfaces/ILogger'
import { SignatureHelper } from '../utils/SignatureHelper'
import { PasswordHelper } from '../utils/PasswordHelper'
import { ClientMsg, ClientAction, ClientObject } from '../RCS.Config'
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

export class Activator implements IExecutor {
  constructor (
    private readonly logger: ILogger,
    private readonly configurator: IConfigurator,
    private readonly certManager: ICertManager,
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
    try {
      const clientObj = this.clientManager.getClientObject(clientId)
      const wsmanResponse = message.payload
      if (!clientObj.activationStatus && !wsmanResponse) {
        throw new RPSError(`Device ${clientObj.uuid} activation failed. Missing/invalid WSMan response payload.`)
      } else if (clientObj.activationStatus) {
        const msg = await this.waitAfterActivation(clientId, clientObj)
        return msg
      }
      const msg = await this.processWSManJsonResponse(message, clientId)
      if (msg) {
        return msg
      }

      // clientObj = this.clientManager.getClientObject(clientId)
      if (clientObj.ClientData.payload.fwNonce && clientObj.action === ClientAction.ADMINCTLMODE) {
        await this.performACMSteps(clientId, clientObj)
      }
      if (((clientObj.action === ClientAction.ADMINCTLMODE && clientObj.certObj && clientObj.count > clientObj.certObj.certChain.length) || (clientObj.action === ClientAction.CLIENTCTLMODE)) && !clientObj.activationStatus) {
        const amtPassword: string = await this.configurator.profileManager.getAmtPassword(clientObj.ClientData.payload.profile.profileName)
        clientObj.amtPassword = amtPassword
        this.clientManager.setClientObject(clientObj)
        // await this.saveDeviceInfo(clientObj, amtPassword)
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
      this.logger.error(`${clientId} : Failed to activate in admin control mode.`)
      if (error instanceof RPSError) {
        return this.responseMsg.get(clientId, null, 'error', 'failed', error.message)
      } else {
        return this.responseMsg.get(clientId, null, 'error', 'failed', 'failed to activate in admin control mode')
      }
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
        if (clientMsg.payload.certHashes[hash].toLowerCase() === certChainPfx.fingerprint.toLowerCase()) {
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
      if (clientObj.ClientData.payload.fwNonce === undefined && clientObj.action === ClientAction.ADMINCTLMODE) {
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
        clientObj.ciraconfig.status = 'activated in admin mode.'
        clientObj.activationStatus = true
        this.clientManager.setClientObject(clientObj)
        await this.saveDeviceInfo(clientObj, clientObj.amtPassword)
        const msg = await this.waitAfterActivation(clientId, clientObj)
        return msg
      }
    } else if (wsmanResponse.Header.Method === 'Setup') {
      // Response from setupCCM call
      if (wsmanResponse.Body.ReturnValue !== 0) {
        throw new RPSError(`Device ${clientObj.uuid} activation failed. Error while activating the AMT device in client mode.`)
      } else {
        this.logger.debug(`Device ${clientObj.uuid} activated in client mode.`)
        clientObj.ciraconfig.status = 'activated in client mode.'
        clientObj.activationStatus = true
        this.clientManager.setClientObject(clientObj)
        await this.saveDeviceInfo(clientObj, clientObj.amtPassword)
        const msg = await this.waitAfterActivation(clientId, clientObj)
        return msg
      }
    } else if (wsmanResponse.Header && wsmanResponse.Header.Method === 'SetMEBxPassword') {
      // Response from setMEBxPassword call
      if (wsmanResponse.Body.ReturnValue !== 0) {
        throw new RPSError(`Device ${clientObj.uuid} failed to set MEBx password.`)
      } else {
        this.logger.debug(`Device ${clientObj.uuid} MEBx password updated.`)
        /* Update a device in the repository. */
        await this.saveDeviceInfo(clientObj, clientObj.amtPassword)
        const msg = await this.waitAfterActivation(clientId, clientObj)
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
  async waitAfterActivation (clientId: string, clientObj: ClientObject): Promise<ClientMsg> {
    if (clientObj.delayEndTime == null) {
      this.logger.info(`waiting for ${EnvReader.GlobalEnvConfig.delayTimer} seconds after activation`)
      const endTime: Date = new Date()
      clientObj.delayEndTime = endTime.setSeconds(endTime.getSeconds() + EnvReader.GlobalEnvConfig.delayTimer)
      this.clientManager.setClientObject(clientObj)
      this.logger.info(`Delay end time : ${clientObj.delayEndTime}`)
    }
    const currentTime = new Date().getTime()
    if (currentTime >= clientObj.delayEndTime) {
      this.logger.info(`Delay ${EnvReader.GlobalEnvConfig.delayTimer} seconds after activation completed`)
      /* Update the wsman stack username and password */
      if (this.amtwsman.cache[clientId]) {
        this.amtwsman.cache[clientId].wsman.comm.setupCommunication.getUsername = (): string => { return AMTUserName }
        this.amtwsman.cache[clientId].wsman.comm.setupCommunication.getPassword = (): string => { return clientObj.amtPassword }
      }
      if (clientObj.action === ClientAction.ADMINCTLMODE && clientObj.mebxPassword == null) {
      /* Set MEBx password called after the activation as the API is accessible only with admin user */
        await this.setMEBxPassword(clientId, clientObj)
      }
      clientObj.action = ClientAction.NETWORKCONFIG
      this.clientManager.setClientObject(clientObj)
      await this.networkConfigurator.execute(null, clientId)
    } else {
      this.logger.info(`Current Time: ${currentTime} Delay end time : ${clientObj.delayEndTime}`)
      return this.responseMsg.get(clientId, null, 'heartbeat_request', 'heartbeat', '')
    }
  }

  /**
   * @description Set MEBx password for the AMT
   * @param {string} clientId Id to keep track of connections
   * @param {ClientObject} clientObj
   */
  async setMEBxPassword (clientId: string, clientObj: ClientObject): Promise<void> {
    if (clientObj.action === ClientAction.ADMINCTLMODE) {
      this.logger.info('setting MEBx password')

      /* Get the MEBx password */
      const mebxPassword: string = await this.configurator.profileManager.getMEBxPassword(clientObj.ClientData.payload.profile.profileName)

      clientObj.mebxPassword = mebxPassword
      this.clientManager.setClientObject(clientObj)
      /*  API is only for Admin control mode */
      await this.amtwsman.execute(clientId, 'AMT_SetupAndConfigurationService', 'SetMEBxPassword', { Password: mebxPassword }, null)
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
      this.logger.info(`domain : ${JSON.stringify(amtDomain)}`)
      // Verify that the certificate path points to a file that exists
      if (!amtDomain.provisioningCert) {
        throw new RPSError(`Device ${clientObj.uuid} activation failed. AMT provisioning certificate not found on server`)
      }
      clientObj.certObj = this.GetProvisioningCertObj(clientObj.ClientData, amtDomain.provisioningCert, amtDomain.provisioningCertPassword, clientId)
      if (clientObj.certObj) {
        // Check if we got an error while getting the provisioning cert object
        if (clientObj.certObj.errorText) {
          throw new RPSError(clientObj.certObj.errorText)
        }
      } else {
        throw new RPSError(`Device ${clientObj.uuid} activation failed. Provisioning certificate doesn't match any trusted certificates from AMT`)
      }
    }
    await this.injectCertificate(clientId, clientObj)
    if (clientObj.count > clientObj.certObj.certChain.length && !clientObj.activationStatus) {
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
  async createSignedString (clientObj: ClientObject): Promise<any> {
    clientObj.nonce = PasswordHelper.generateNonce()
    const arr: Buffer[] = [clientObj.ClientData.payload.fwNonce, clientObj.nonce]
    clientObj.signature = this.signatureHelper.signString(Buffer.concat(arr), clientObj.certObj.privateKey)
    this.clientManager.setClientObject(clientObj)
    if (clientObj.signature.errorText) {
      throw new RPSError(clientObj.signature.errorText)
    }
  }

  /**
   * @description Saves the AMT device information to the database
   * @param {ClientObject} clientObj
   * @param {string} amtPassword
   */
  async saveDeviceInfo (clientObj: ClientObject, amtPassword: string): Promise<any> {
    if (this.configurator?.amtDeviceRepository) {
      if (clientObj.action === ClientAction.ADMINCTLMODE) {
        await this.configurator.amtDeviceRepository.insert(new AMTDeviceDTO(clientObj.uuid,
          clientObj.hostname,
          EnvReader.GlobalEnvConfig.mpsusername,
          EnvReader.GlobalEnvConfig.mpspass,
          EnvReader.GlobalEnvConfig.amtusername,
          clientObj.amtPassword,
          clientObj.mebxPassword
        ))
      } else {
        await this.configurator.amtDeviceRepository.insert(new AMTDeviceDTO(clientObj.uuid,
          clientObj.hostname,
          EnvReader.GlobalEnvConfig.mpsusername,
          EnvReader.GlobalEnvConfig.mpspass,
          EnvReader.GlobalEnvConfig.amtusername,
          amtPassword,
          null))
      }
    } else {
      this.logger.error('unable to write device')
    }
    /* Register device metadata with MPS */
    try {
      const profile = await this.configurator.profileManager.getAmtProfile(clientObj.ClientData.payload.profile.profileName)
      let tags = []
      if (profile?.tags != null) {
        tags = profile.tags
      }
      await got(`${EnvReader.GlobalEnvConfig.mpsServer}/api/v1/metadata`, {
        method: 'POST',
        json: {
          guid: clientObj.uuid,
          hostname: clientObj.hostname,
          tags: tags
        }
      })
    } catch (err) {
      this.logger.warn('unable to register metadata with MPS', err)
    }
  }
}
