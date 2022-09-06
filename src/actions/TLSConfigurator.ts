/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { CertManager } from '../certManager'
import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { ClientMsg, ClientObject } from '../models/RCS.Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { EnvReader } from '../utils/EnvReader'
import { MqttProvider } from '../utils/MqttProvider'
import { RPSError } from '../utils/RPSError'
import { AMTConfiguration, AMTKeyUsage, CertAttributes, TLSCerts } from '../models'
import got, { Got } from 'got'
import * as forge from 'node-forge'
import { devices } from '../WebSocketListener'
import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { HttpHandler } from '../HttpHandler'
import { parseBody } from '../utils/parseWSManResponseBody'

export class TLSConfigurator implements IExecutor {
  gotClient: Got
  responseMsg: ClientResponseMsg
  amt: AMT.Messages
  httpHandler: HttpHandler
  constructor (
    private readonly logger: ILogger,
    private readonly certManager: CertManager,
    private readonly _responseMsg: ClientResponseMsg
  ) {
    this.responseMsg = _responseMsg
    this.amt = new AMT.Messages()
    this.httpHandler = new HttpHandler()
    this.gotClient = got
  }

  async execute (message: any, clientId: string): Promise<ClientMsg> {
    const clientObj = devices[clientId]
    try {
      let clientMessage: ClientMsg
      // Process response message if not null
      if (message != null) {
        const msg = await this.processWSManJsonResponses(message, clientId)
        if (msg) {
          return msg
        }
      }

      // Trusted Root Certificates
      clientMessage = this.trustedRootCertificates(clientId)
      if (clientMessage) {
        return clientMessage
      }
      // Generate Key Pair at Intel AMT
      clientMessage = this.generateKeyPair(clientId)
      if (clientMessage) {
        return clientMessage
      }
      // Create TLS Credential Context
      clientMessage = this.createTLSCredentialContext(clientId)
      if (clientMessage) {
        return clientMessage
      }
      // synchronize time
      clientMessage = this.synchronizeTime(clientId)
      if (clientMessage) {
        return clientMessage
      }
      // Set TLS data
      clientMessage = await this.setTLSData(clientId)
      if (clientMessage) {
        return clientMessage
      }
      // Update the TLS Configuration status and respond to AMT
      if (clientObj.tls.commitLocalTLS) {
        await this.updateDeviceVersion(clientObj)
        clientObj.status.TLSConfiguration = 'Configured'
        MqttProvider.publishEvent('success', ['TLSConfigurator'], 'TLS Configured', clientObj.uuid)
        return this.responseMsg.get(clientId, null, 'success', 'success', JSON.stringify(clientObj.status))
      }
      return clientMessage
    } catch (error) {
      this.logger.error(`${clientId} : Failed to configure TLS : ${error}`)
      if (error instanceof RPSError) {
        clientObj.status.TLSConfiguration = error.message
      } else {
        clientObj.status.TLSConfiguration = 'Failed'
      }
      MqttProvider.publishEvent('fail', ['TLSConfigurator'], 'Failed to configure TLS', clientObj.uuid)
      return this.responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify(clientObj.status))
    }
  }

  createTLSCredentialContext (clientId: string): ClientMsg {
    const clientObj = devices[clientId]
    if (clientObj.tls.getTLSCredentialContext && clientObj.tls.addCredentialContext) {
      return null
    }
    let xmlRequestBody = ''
    if (clientObj.tls.confirmPublicPrivateKeyPair && !clientObj.tls.getTLSCredentialContext) {
      xmlRequestBody = this.amt.TLSCredentialContext(AMT.Methods.ENUMERATE)
      clientObj.tls.getTLSCredentialContext = true
    } else if (clientObj.tls.TLSCredentialContext != null && !clientObj.tls.addCredentialContext) {
      const amtPrefix = 'http://intel.com/wbem/wscim/1/amt-schema/1/'
      // TBD: Need to pull certHandle from WSMan response object
      const certHandle = 'Intel(r) AMT Certificate: Handle: 1'
      const putObj = {
        ElementInContext: `<a:Address>/wsman</a:Address><a:ReferenceParameters><w:ResourceURI>${amtPrefix}AMT_PublicKeyCertificate</w:ResourceURI><w:SelectorSet><w:Selector Name="InstanceID">${certHandle}</w:Selector></w:SelectorSet></a:ReferenceParameters>`,
        ElementProvidingContext: `<a:Address>/wsman</a:Address><a:ReferenceParameters><w:ResourceURI>${amtPrefix}AMT_TLSProtocolEndpointCollection</w:ResourceURI><w:SelectorSet><w:Selector Name="ElementName">TLSProtocolEndpointInstances Collection</w:Selector></w:SelectorSet></a:ReferenceParameters>`
      }
      // TODO: TEST ME, LIKE FOR REAL
      xmlRequestBody = this.amt.TLSCredentialContext(AMT.Methods.CREATE, null, putObj as any)
      clientObj.tls.addCredentialContext = true
    }
    const wsmanRequest = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return this.responseMsg.get(clientId, wsmanRequest, 'wsman', 'ok')
  }

  trustedRootCertificates (clientId: string): ClientMsg {
    const clientObj = devices[clientId]
    if (clientObj.tls.getPublicKeyCertificate && clientObj.tls.createdTrustedRootCert && clientObj.tls.checkPublicKeyCertificate) {
      return null
    }
    const tlsCerts: TLSCerts = clientObj.ClientData.payload.profile.tlsCerts
    let xmlRequestBody = ''
    if (!clientObj.tls.getPublicKeyCertificate) {
      // Get existing Public Key Certificate, which are created using the AMT_PublicKeyManagementService AddCertificate and AddTrustedRootCertificate methods.
      xmlRequestBody = this.amt.PublicKeyCertificate(AMT.Methods.ENUMERATE)
      clientObj.tls.getPublicKeyCertificate = true
    } else if (clientObj.tls.PublicKeyCertificate?.length >= 0 && !clientObj.tls.addTrustedRootCert) {
      // Add Trusted Root Certificate to AMT
      xmlRequestBody = this.amt.PublicKeyManagementService(AMT.Methods.ADD_TRUSTED_ROOT_CERTIFICATE, { CertificateBlob: tlsCerts.ROOT_CERTIFICATE.certbin })
      clientObj.tls.addTrustedRootCert = true
    } else if (clientObj.tls.createdTrustedRootCert && !clientObj.tls.checkPublicKeyCertificate) {
      // Get Public Key Certificates, to make sure the cert added in the above is in AMT
      xmlRequestBody = this.amt.PublicKeyCertificate(AMT.Methods.ENUMERATE)
      clientObj.tls.checkPublicKeyCertificate = true
    }
    const wsmanRequest = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return this.responseMsg.get(clientId, wsmanRequest, 'wsman', 'ok')
  }

  generateKeyPair (clientId: string): ClientMsg {
    const clientObj = devices[clientId]
    if (clientObj.tls.getPublicPrivateKeyPair && clientObj.tls.generateKeyPair && clientObj.tls.checkPublicPrivateKeyPair) {
      return null
    }
    let xmlRequestBody = ''
    if (clientObj.tls.confirmPublicKeyCertificate && !clientObj.tls.getPublicPrivateKeyPair) {
      // Get existing key pairs
      xmlRequestBody = this.amt.PublicPrivateKeyPair(AMT.Methods.ENUMERATE)
      clientObj.tls.getPublicPrivateKeyPair = true
    } else if (clientObj.tls.PublicPrivateKeyPair?.length >= 0 && !clientObj.tls.generateKeyPair) {
      // generate a key pair
      xmlRequestBody = this.amt.PublicKeyManagementService(AMT.Methods.GENERATE_KEY_PAIR, { KeyAlgorithm: 0, KeyLength: 2048 })
      clientObj.tls.generateKeyPair = true
    } else if (clientObj.tls.addCert && !clientObj.tls.checkPublicPrivateKeyPair) {
      xmlRequestBody = this.amt.PublicPrivateKeyPair(AMT.Methods.ENUMERATE)
      clientObj.tls.checkPublicPrivateKeyPair = true
    }
    const wsmanRequest = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return this.responseMsg.get(clientId, wsmanRequest, 'wsman', 'ok')
  }

  /**
   * @description Synchronize time
   * @param {string} clientId Id to keep track of connections
   **/
  synchronizeTime (clientId: string): ClientMsg {
    const clientObj = devices[clientId]
    if (clientObj.tls.getTimeSynch) {
      return null
    }
    let xmlRequestBody = ''
    if (clientObj.tls.resCredentialContext && !clientObj.tls.getTimeSynch) {
      xmlRequestBody = this.amt.TimeSynchronizationService(AMT.Methods.GET_LOW_ACCURACY_TIME_SYNCH)
      clientObj.tls.getTimeSynch = true
    }
    const wsmanRequest = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return this.responseMsg.get(clientId, wsmanRequest, 'wsman', 'ok')
  }

  async setTLSData (clientId: string): Promise<ClientMsg> {
    const clientObj = devices[clientId]
    if (clientObj.tls.getTLSSettingData && clientObj.tls.putRemoteTLS && clientObj.tls.putLocalTLS) {
      return null
    }
    const profile: AMTConfiguration = clientObj.ClientData.payload.profile
    let xmlRequestBody = ''

    if (clientObj.tls.setTimeSynch && !clientObj.tls.getTLSSettingData) {
      // Get the existing TLS data from AMT
      xmlRequestBody = this.amt.TLSSettingData(AMT.Methods.ENUMERATE)
      clientObj.tls.getTLSSettingData = true
    } else if (clientObj.tls.TLSSettingData != null && !clientObj.tls.putRemoteTLS) {
      // Set remote TLS data on AMT
      clientObj.tls.TLSSettingData[0].Enabled = true
      clientObj.tls.TLSSettingData[0].AcceptNonSecureConnections = (profile.tlsMode !== 1 && profile.tlsMode !== 3) // TODO: check what these values should explicitly be
      clientObj.tls.TLSSettingData[0].MutualAuthentication = (profile.tlsMode === 3 || profile.tlsMode === 4)
      if (profile.tlsMode === 3 || profile.tlsMode === 4) {
        const certificate = forge.pki.certificateFromPem(profile.tlsCerts.ISSUED_CERTIFICATE.pem)
        const commonName = certificate.subject.getField('CN').value
        if (Array.isArray(clientObj.tls.TLSSettingData[0].TrustedCN) && clientObj.tls.TLSSettingData[0].TrustedCN.length > 0) {
          clientObj.tls.TLSSettingData[0].TrustedCN.push(commonName)
        } else {
          clientObj.tls.TLSSettingData[0].TrustedCN = [commonName]
        }
      }
      this.logger.debug(`Remote TLSSetting Data : ${JSON.stringify(clientObj.tls.TLSSettingData[0], null, '\t')}`)
      xmlRequestBody = this.amt.TLSSettingData(AMT.Methods.PUT, null, clientObj.tls.TLSSettingData[0])
      clientObj.tls.putRemoteTLS = true
    } else if (clientObj.tls.commitRemoteTLS && !clientObj.tls.putLocalTLS) {
      // Since committing changes may cause an internal restart sequence, remote applications should allow sufficient time for Intel AMT to reload before issuing the next command.
      await new Promise(resolve => setTimeout(resolve, 5000))
      // Set local TLS data on AMT
      clientObj.tls.TLSSettingData[1].Enabled = true
      if (profile.tlsMode === 3 || profile.tlsMode === 4) {
        const certificate = forge.pki.certificateFromPem(profile.tlsCerts.ISSUED_CERTIFICATE.pem)
        const commonName = certificate.subject.getField('CN').value

        if (Array.isArray(clientObj.tls.TLSSettingData[1].TrustedCN) && clientObj.tls.TLSSettingData[1].TrustedCN.length > 0) {
          clientObj.tls.TLSSettingData[1].TrustedCN.push(commonName)
        } else {
          clientObj.tls.TLSSettingData[1].TrustedCN = [commonName]
        }
      }
      this.logger.debug(`Local TLSSetting Data : ${JSON.stringify(clientObj.tls.TLSSettingData[1], null, '\t')}`)
      xmlRequestBody = this.amt.TLSSettingData(AMT.Methods.PUT, null, clientObj.tls.TLSSettingData[1])
      clientObj.tls.putLocalTLS = true
    }
    const wsmanRequest = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
    return this.responseMsg.get(clientId, wsmanRequest, 'wsman', 'ok')
  }

  /**
   * @description Parse the wsman response received from AMT
   * @param {string} clientId Id to keep track of connections
   * @param {string} message
   */
  processWSManJsonResponses (message: any, clientId: string): ClientMsg {
    const clientObj = devices[clientId]
    const wsmanResponse = message?.payload
    if (wsmanResponse == null) {
      return
    }
    switch (wsmanResponse.statusCode) {
      case 401: {
        const xmlRequestBody = this.amt.PublicKeyCertificate(AMT.Methods.ENUMERATE)
        const wsmanRequest = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
        return this.responseMsg.get(clientId, wsmanRequest, 'wsman', 'ok')
      }
      case 200: {
        const xmlBody = parseBody(wsmanResponse)
        // pares WSMan xml response to json
        const response = this.httpHandler.parseXML(xmlBody)
        const method = response.Envelope.Header.ResourceURI.split('/').pop()
        switch (method) {
          case 'AMT_PublicKeyCertificate': {
            return this.validateAMTPublicKeyCertificate(clientId, response)
          }
          case 'AMT_PublicKeyManagementService': {
            return this.validateAMTPublicKeyManagementService(clientId, response)
          }
          case 'AMT_PublicPrivateKeyPair': {
            return this.validatePublicPrivateKeyPair(clientId, response)
          }
          case 'AMT_TLSCredentialContext':
            return this.validateTLSCredentialContext(clientId, response)
          case 'AMT_TimeSynchronizationService':
            return this.validateTimeSynchronizationService(clientId, response)
          case 'AMT_TLSSettingData':
            return this.validateTLSSettingData(clientId, response)
          case 'AMT_SetupAndConfigurationService':
            return this.validateSetupAndConfigurationService(clientId, response)
        }
        break
      }
      default:
        return null
    }
  }

  validateSetupAndConfigurationService (clientId: string, response: any): ClientMsg {
    const clientObj = devices[clientId]
    if (clientObj.tls.setRemoteTLS && !clientObj.tls.commitRemoteTLS) {
      clientObj.tls.commitRemoteTLS = true
    } else if (clientObj.tls.commitRemoteTLS && clientObj.tls.setLocalTLS && !clientObj.tls.commitLocalTLS) {
      clientObj.tls.commitLocalTLS = true
    }
    return null
  }

  validateTLSSettingData (clientId: string, response: any): ClientMsg {
    const clientObj = devices[clientId]
    let xmlRequestBody = null
    const action = response.Envelope.Header.Action._.split('/').pop()
    switch (action) {
      case 'EnumerateResponse':
        xmlRequestBody = this.amt.TLSSettingData(AMT.Methods.PULL, response.Envelope.Body?.EnumerateResponse?.EnumerationContext)
        break
      case 'PullResponse':
        this.processAMTTLSSettingsData(response, clientId)
        return null
      case 'PutResponse': {
        const whatever: any = response.Envelope.Body.AMT_TLSSettingData
        if (whatever.ElementName === 'Intel(r) AMT 802.3 TLS Settings') {
          clientObj.tls.setRemoteTLS = true
        } else if (whatever.ElementName === 'Intel(r) AMT LMS TLS Settings') {
          clientObj.tls.setLocalTLS = true
        } else {
          throw new RPSError(`Failed to set TLS data: ${clientObj.uuid}`)
        }

        xmlRequestBody = this.amt.SetupAndConfigurationService(AMT.Methods.COMMIT_CHANGES)
      }
    }

    const data = this.httpHandler.wrapIt(xmlRequestBody, devices[clientId].connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  validateTimeSynchronizationService (clientId: string, response: any): ClientMsg {
    let xmlRequestBody = ''
    const action = response.Envelope.Header.Action._.split('/').pop()
    switch (action) {
      case 'GetLowAccuracyTimeSynchResponse': {
        const Tm1 = Math.round(new Date().getTime() / 1000)
        xmlRequestBody = this.amt.TimeSynchronizationService(AMT.Methods.SET_HIGH_ACCURACY_TIME_SYNCH, response.Envelope.Body.GetLowAccuracyTimeSynch_OUTPUT.Ta0, Tm1, Tm1)
        break
      }
      case 'SetHighAccuracyTimeSynchResponse':
        devices[clientId].tls.setTimeSynch = true
        return null
    }
    const data = this.httpHandler.wrapIt(xmlRequestBody, devices[clientId].connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  validateTLSCredentialContext (clientId: string, response: any): ClientMsg {
    let xmlRequestBody = ''
    const action = response.Envelope.Header.Action._.split('/').pop()
    switch (action) {
      case 'EnumerateResponse': {
        xmlRequestBody = this.amt.TLSCredentialContext(AMT.Methods.PULL, response.Envelope.Body.EnumerateResponse.EnumerationContext)
        break
      }
      case 'PullResponse': {
        this.processAMTTLSCredentialContext(response, clientId)
        return null
      }
      case 'CreateResponse': {
        devices[clientId].tls.resCredentialContext = true
        return null
      }
    }
    const data = this.httpHandler.wrapIt(xmlRequestBody, devices[clientId].connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  validatePublicPrivateKeyPair (clientId: string, response: any): ClientMsg {
    let xmlRequestBody = ''
    let data = null
    const action = response.Envelope.Header.Action._.split('/').pop()
    switch (action) {
      case 'EnumerateResponse': {
        xmlRequestBody = this.amt.PublicPrivateKeyPair(AMT.Methods.PULL, response.Envelope.Body.EnumerateResponse.EnumerationContext)
        break
      }
      case 'PullResponse': {
        return this.processAMTPublicPrivateKeyPair(response, clientId)
      }
    }
    data = this.httpHandler.wrapIt(xmlRequestBody, devices[clientId].connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  validateAMTPublicKeyManagementService (clientId: string, response: any): ClientMsg {
    const clientObj = devices[clientId]
    const action = response.Envelope.Header.Action._.split('/').pop()
    switch (action) {
      case 'AddCertificateResponse':
        clientObj.tls.addCert = true
        break
      case 'GenerateKeyPairResponse': {
        clientObj.tls.generatedPublicPrivateKeyPair = true
        const xmlRequestBody = this.amt.PublicPrivateKeyPair(AMT.Methods.ENUMERATE)
        const data = this.httpHandler.wrapIt(xmlRequestBody, devices[clientId].connectionParams)
        return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
      }
      case 'AddTrustedRootCertificateResponse':
        this.logger.info(`Created a Trusted Root Certificate: ${clientObj.uuid} : ${JSON.stringify(response.Envelope.Body)} `)
        clientObj.tls.createdTrustedRootCert = true
        break
    }
    return null
  }

  validateAMTPublicKeyCertificate (clientId: string, response: any): ClientMsg {
    let xmlRequestBody = null
    let data = null
    const action = response.Envelope.Header.Action._.split('/').pop()
    switch (action) {
      case 'EnumerateResponse': {
        xmlRequestBody = this.amt.PublicKeyCertificate(AMT.Methods.PULL, response.Envelope.Body.EnumerateResponse.EnumerationContext)
        break
      }
      case 'PullResponse': {
        this.processAMTPublicKeyCertificate(response, clientId)
        return null
      }
    }
    data = this.httpHandler.wrapIt(xmlRequestBody, devices[clientId].connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  processAMTTLSSettingsData (wsmanResponse: any, clientId: string): void {
    const clientObj = devices[clientId]
    clientObj.tls.TLSSettingData = wsmanResponse.Envelope.Body.PullResponse.Items.AMT_TLSSettingData
  }

  processAMTTLSCredentialContext (wsmanResponse: any, clientId: string): void {
    const clientObj = devices[clientId]

    clientObj.tls.TLSCredentialContext = wsmanResponse.Envelope.Body.PullResponse.Items
  }

  processAMTPublicPrivateKeyPair (wsmanResponse: any, clientId: string): ClientMsg {
    const clientObj = devices[clientId]
    let xmlRequestBody = ''
    if (wsmanResponse.Envelope.Body.PullResponse.Items === '') {
      clientObj.tls.PublicPrivateKeyPair = []
    } else {
      const potentialArray = wsmanResponse.Envelope.Body.PullResponse.Items.AMT_PublicPrivateKeyPair
      if (Array.isArray(potentialArray)) {
        clientObj.tls.PublicPrivateKeyPair = potentialArray
      } else {
        clientObj.tls.PublicPrivateKeyPair = [potentialArray]
      }
    }

    if (clientObj.tls.PublicPrivateKeyPair.length >= 1 && clientObj.tls.generatedPublicPrivateKeyPair && !clientObj.tls.addCert) {
      const DERKey = clientObj.tls.PublicPrivateKeyPair[0]?.DERKey
      const certAttributes: CertAttributes = { CN: 'AMT', O: 'None', ST: 'None', C: 'None' }
      const issuerAttributes: CertAttributes = { CN: clientObj.uuid ?? 'Untrusted Root Certificate' }

      const keyUsages: AMTKeyUsage = {
        name: 'extKeyUsage',
        '2.16.840.1.113741.1.2.1': false,
        '2.16.840.1.113741.1.2.2': false,
        '2.16.840.1.113741.1.2.3': false,
        serverAuth: true,
        clientAuth: false,
        emailProtection: false,
        codeSigning: false,
        timeStamping: false
      }

      const cert = this.certManager.amtCertSignWithCAKey(DERKey, null, certAttributes, issuerAttributes, keyUsages)
      xmlRequestBody = this.amt.PublicKeyManagementService(AMT.Methods.ADD_CERTIFICATE, { CertificateBlob: cert.pem.substring(27, cert.pem.length - 25) })
      clientObj.tls.createdPublicPrivateKeyPair = true

      const wsmanRequest = this.httpHandler.wrapIt(xmlRequestBody, clientObj.connectionParams)
      return this.responseMsg.get(clientId, wsmanRequest, 'wsman', 'ok')
    } else if (clientObj.tls.checkPublicPrivateKeyPair && !clientObj.tls.confirmPublicPrivateKeyPair) {
      clientObj.tls.confirmPublicPrivateKeyPair = true
    }
    return null
  }

  processAMTPublicKeyCertificate (wsmanResponse: any, clientId: string): void {
    const clientObj = devices[clientId]
    // Store Public Key Certificates
    if (wsmanResponse.Envelope.Body.PullResponse.Items === '') {
      clientObj.tls.PublicKeyCertificate = []
    } else {
      const potentialArray = wsmanResponse.Envelope.Body.PullResponse.Items.AMT_PublicKeyCertificate
      if (Array.isArray(potentialArray)) {
        clientObj.tls.PublicKeyCertificate = potentialArray
      } else {
        clientObj.tls.PublicKeyCertificate = [potentialArray]
      }
    }
    this.logger.debug(`Number of public key certs for device ${clientObj.uuid} : ${clientObj.tls.PublicKeyCertificate.length}`)
    if (clientObj.tls.checkPublicKeyCertificate) {
      const length = clientObj.tls.PublicKeyCertificate.length
      const tlsConfig: TLSCerts = clientObj.ClientData.payload.profile.tlsCerts
      // Make sure the Trusted root certificate added
      if (clientObj.tls.PublicKeyCertificate[length - 1].X509Certificate === tlsConfig.ROOT_CERTIFICATE.certbin) {
        clientObj.tls.confirmPublicKeyCertificate = true
      }
    }
  }

  async updateDeviceVersion (clientObj: ClientObject): Promise<void> {
    /* Register cert version with MPS */
    try {
      await this.gotClient.post(`${EnvReader.GlobalEnvConfig.mpsServer}/api/v1/devices`, {
        json: {
          guid: clientObj.uuid,
          tenantId: clientObj.ClientData.payload.profile.tenantId,
          tlsCertVersion: clientObj.ClientData.payload.profile.tlsCerts.version
        }
      })
    } catch (err) {
      MqttProvider.publishEvent('fail', ['TLSConfigurator'], 'unable to register metadata with MPS', clientObj.uuid)
      this.logger.error('unable to register metadata with MPS', err)
    }
  }
}
