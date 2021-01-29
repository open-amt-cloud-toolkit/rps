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
import { AMTUserName } from './../utils/constants'
import { AMTDomain } from '../models/Rcs'

export class ACMActivator implements IExecutor {
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
      let clientObj = this.clientManager.getClientObject(clientId)
      if (!message.payload) {
        throw new RPSError(`Device ${clientObj.uuid} activation failed. Missing/invalid WSMan response payload.`)
      }

      await this.processWSManJsonResponse(message, clientId)

      clientObj = this.clientManager.getClientObject(clientId)
      if (clientObj.ClientData.payload.fwNonce && clientObj.action === ClientAction.ADMINCTLMODE) {
        if (!clientObj.count) {
          clientObj.count = 0
          const amtDomain: AMTDomain = await this.configurator.domainCredentialManager.getProvisioningCert(clientObj.ClientData.payload.fqdn)
          this.logger.info(`domain : ${JSON.stringify(amtDomain)}`)
          // Verify that the certificate path points to a file that exists
          if (!amtDomain.ProvisioningCert) {
            throw new RPSError(`Device ${clientObj.uuid} activation failed. AMT provisioning certificate not found on server`)
          }
          clientObj.certObj = this.GetProvisioningCertObj(clientObj.ClientData, amtDomain.ProvisioningCert, amtDomain.ProvisioningCertPassword, clientId)
          if (clientObj.certObj) {
            // Check if we got an error while getting the provisioning cert object
            if (clientObj.certObj.errorText) {
              throw new RPSError(clientObj.certObj.errorText)
            }
          } else {
            throw new RPSError(`Device ${clientObj.uuid} activation failed. Provisioning certificate doesn't match any trusted certificates from AMT`)
          }
        }

        if (clientObj.count === clientObj.certObj.certChain.length) {
          ++clientObj.count
          this.clientManager.setClientObject(clientObj)
        }

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

        if (clientObj.count > clientObj.certObj.certChain.length) {
          // Create a one time nonce that allows AMT to verify the digital signature of the management console performing the provisioning
          const nonce = PasswordHelper.generateNonce()
          // Need to create a new array so we can concatinate both nonces (fwNonce first, Nonce second)
          const arr: Buffer[] = [clientObj.ClientData.payload.fwNonce, nonce]
          // Then we need to sign the concatinated nonce with the private key of the provisioning certificate and encode as base64.
          const signature = this.signatureHelper.signString(Buffer.concat(arr), clientObj.certObj.privateKey)
          if (signature.errorText) {
            throw new RPSError(signature.errorText)
          }

          const amtPassword: string = await this.configurator.profileManager.getAmtPassword(clientObj.ClientData.payload.profile.ProfileName)
          clientObj.amtPassword = amtPassword
          this.clientManager.setClientObject(clientObj)

          const data: string = `admin:${clientObj.ClientData.payload.digestRealm}:${amtPassword}`
          const password = SignatureHelper.createMd5Hash(data)

          await this.amtwsman.setupACM(clientId, password, nonce.toString('base64'), signature)
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
      // this.logger.info(`certChainPfx : ${certChainPfx}`);
      // Check that provisioning certificate root matches one of the trusted roots from AMT
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
  async processWSManJsonResponse (message: any, clientId: string): Promise<void> {
    const clientObj = this.clientManager.getClientObject(clientId)
    const wsmanResponse = message.payload

    if (wsmanResponse.AMT_GeneralSettings) {
      const digestRealm = wsmanResponse.AMT_GeneralSettings.response.DigestRealm
      // Validate Digest Realm
      if (!this.validator.isDigestRealmValid(digestRealm)) {
        throw new RPSError(`Device ${clientObj.uuid} activation failed. Not a valid digest realm.`)
      }
      clientObj.ClientData.payload.digestRealm = digestRealm
      this.clientManager.setClientObject(clientObj)
      if (clientObj.ClientData.payload.fwNonce === undefined) {
        await this.amtwsman.batchEnum(clientId, '*IPS_HostBasedSetupService')
      }
    } else if (wsmanResponse.IPS_HostBasedSetupService) {
      const response = wsmanResponse.IPS_HostBasedSetupService.response
      clientObj.ClientData.payload.fwNonce = Buffer.from(response.ConfigurationNonce, 'base64')
      clientObj.ClientData.payload.modes = response.AllowedControlModes
      this.clientManager.setClientObject(clientObj)
    } else if (wsmanResponse.Header && wsmanResponse.Header.Method === 'AddNextCertInChain') {
      if (wsmanResponse.Body.ReturnValue !== 0) {
        throw new RPSError(`Device ${clientObj.uuid} activation failed. Error while adding the certificates to AMT.`)
      } else {
        this.logger.debug(`cert added to AMT device ${clientObj.uuid}`)
      }
    } else if (wsmanResponse.Header && wsmanResponse.Header.Method === 'AdminSetup') {
      if (wsmanResponse.Body.ReturnValue !== 0) {
        throw new RPSError(`Device ${clientObj.uuid} activation failed. Error while activating the AMT in admin mode.`)
      } else {
        this.logger.debug(`Device ${clientObj.uuid} activated in admin mode.`)
        clientObj.ciraconfig.status = 'activated in admin mode.'
        this.clientManager.setClientObject(clientObj)

        /* Set MEBx password called after the activation as the API is accessible only with admin user */
        await this.setMEBxPassword(clientId, clientObj)

        /* After the activation, control goes to Network configuration */
        clientObj.action = ClientAction.NETWORKCONFIG
        await this.networkConfigurator.execute(message, clientId)
      }
    } else {
      throw new RPSError(`Device ${clientObj.uuid} sent an invalid response.`)
    }
  }

  /**
   * @description Set MEBx password for the AMT
   * @param {string} clientId Id to keep track of connections
   * @param {ClientObject} clientObj
   */
  async setMEBxPassword (clientId: string, clientObj: ClientObject): Promise<void> {
    this.logger.info('setting MEBx password')
    /* Update the wsman stack username and password */
    if (this.amtwsman.cache[clientId]) {
      this.amtwsman.cache[clientId].wsman.comm.setupCommunication.getUsername = (): string => { return AMTUserName }
      this.amtwsman.cache[clientId].wsman.comm.setupCommunication.getPassword = (): string => { return clientObj.amtPassword }
    }
    /* Get the MEBx password */
    const mebxPassword: string = await this.configurator.profileManager.getMEBxPassword(clientObj.ClientData.payload.profile.ProfileName)

    /* Create a device in the repository. */
    if (this.configurator?.amtDeviceRepository) {
      await this.configurator.amtDeviceRepository.insert(new AMTDeviceDTO(clientObj.uuid,
        clientObj.uuid,
        EnvReader.GlobalEnvConfig.mpsusername,
        EnvReader.GlobalEnvConfig.mpspass,
        EnvReader.GlobalEnvConfig.amtusername,
        clientObj.amtPassword,
        mebxPassword))
    } else {
      this.logger.error('unable to write device')
    }

    /*  API is only for Admin control mode */
    await this.amtwsman.execute(clientId, 'AMT_SetupAndConfigurationService', 'SetMEBxPassword', { Password: mebxPassword }, null)
  }
}
