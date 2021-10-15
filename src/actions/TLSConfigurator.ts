import { CertManager } from '../CertManager'
import { IClientManager } from '../interfaces/IClientManager'
import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { ClientMsg, ClientObject, TlsConfigs } from '../models/RCS.Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { AMTUserName } from '../utils/constants'
import { EnvReader } from '../utils/EnvReader'
import { MqttProvider } from '../utils/MqttProvider'
import { RPSError } from '../utils/RPSError'
import { WSManProcessor } from '../WSManProcessor'
import { AMTKeyUsage, CertAttributes } from '../models/Rcs'
import got from 'got'

export class TLSConfigurator implements IExecutor {
  clientObj: ClientObject
  clientManager: IClientManager
  amtwsman: WSManProcessor
  responseMsg: ClientResponseMsg
  constructor (
    private readonly logger: ILogger,
    private readonly certManager: CertManager,
    private readonly _responseMsg: ClientResponseMsg,
    private readonly _amtwsman: WSManProcessor,
    private readonly _clientManager: IClientManager
  ) {
    this.responseMsg = _responseMsg
    this.amtwsman = _amtwsman
    this.clientManager = _clientManager
  }

  async execute (message: any, clientId: string): Promise<ClientMsg> {
    try {
      this.clientObj = this.clientManager.getClientObject(clientId)

      await this.processWSManJsonResponses(message, clientId)
      // Trusted Root Certificates
      await this.trustedRootCertificates(clientId)
      // Generate Key Pair at Intel AMT
      await this.generateKeyPair(clientId)
      // Create TLS Credential Context
      await this.createTLSCredentialContext(clientId)
      // synchronize time
      await this.synchronizeTime(clientId)
      // Set TLS data
      await this.setTLSData(clientId)
      // Update the TLS Configuration status and responsed to AMT
      if (this.clientObj.tls.commitLocalTLS) {
        await this.updateDeviceVersion(this.clientObj)
        this.clientObj.status.TLSConfiguration = 'Configured'
        MqttProvider.publishEvent('success', ['TLSConfigurator'], 'TLS Configured', this.clientObj.uuid)
        return this.responseMsg.get(clientId, null, 'success', 'success', JSON.stringify(this.clientObj.status))
      }
    } catch (error) {
      this.logger.error(`${clientId} : Failed to configure TLS : ${error}`)
      if (error instanceof RPSError) {
        this.clientObj.status.TLSConfiguration = error.message
      } else {
        this.clientObj.status.TLSConfiguration = 'Failed'
      }
      MqttProvider.publishEvent('fail', ['TLSConfigurator'], 'Failed to configure TLS', this.clientObj.uuid)
      return this.responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify(this.clientObj.status))
    }
    return null
  }

  async createTLSCredentialContext (clientId: string): Promise<void> {
    if (this.clientObj.tls.confirmPublicPrivateKeyPair && !this.clientObj.tls.getTLSCredentialContext) {
      await this.amtwsman.batchEnum(clientId, 'AMT_TLSCredentialContext', AMTUserName, this.clientObj.ClientData.payload.password)
      this.clientObj.tls.getTLSCredentialContext = true
    } else if (this.clientObj.tls.TLSCredentialContext != null && !this.clientObj.tls.addCredentialContext) {
      const amtPrefix = 'http://intel.com/wbem/wscim/1/amt-schema/1/'
      // TBD: Need to pull certHandle from WSMan response object
      const certHandle = 'Intel(r) AMT Certificate: Handle: 1'
      const putObj = {
        ElementInContext: `<a:Address>/wsman</a:Address><a:ReferenceParameters><w:ResourceURI>${amtPrefix}AMT_PublicKeyCertificate</w:ResourceURI><w:SelectorSet><w:Selector Name="InstanceID">${certHandle}</w:Selector></w:SelectorSet></a:ReferenceParameters>`,
        ElementProvidingContext: `<a:Address>/wsman</a:Address><a:ReferenceParameters><w:ResourceURI>${amtPrefix}AMT_TLSProtocolEndpointCollection</w:ResourceURI><w:SelectorSet><w:Selector Name="ElementName">TLSProtocolEndpointInstances Collection</w:Selector></w:SelectorSet></a:ReferenceParameters>`
      }
      await this.amtwsman.create(clientId, 'AMT_TLSCredentialContext', putObj, null, AMTUserName, this.clientObj.ClientData.payload.password)
      this.clientObj.tls.addCredentialContext = true
    }
    this.clientManager.setClientObject(this.clientObj)
  }

  async trustedRootCertificates (clientId: string): Promise<void> {
    const tlsConfig: TlsConfigs = this.clientObj.ClientData.payload.profile.tlsConfigObject
    if (!this.clientObj.tls.getPublicKeyCertificate) {
      // Get existing Public Key Certificate, which are created using the AMT_PublicKeyManagementService AddCertificate and AddTrustedRootCertificate methods.
      await this.amtwsman.batchEnum(clientId, 'AMT_PublicKeyCertificate', AMTUserName, this.clientObj.ClientData.payload.password)
      this.clientObj.tls.getPublicKeyCertificate = true
    } else if (this.clientObj.tls.PublicKeyCertificate?.responses?.length >= 0 && !this.clientObj.tls.addTrustedRootCert) {
      // Add Trusted Root Certificate to AMT
      await this.amtwsman.execute(clientId, 'AMT_PublicKeyManagementService', 'AddTrustedRootCertificate', { CertificateBlob: tlsConfig.certs.ROOT_CERTIFICATE.certbin }, null, AMTUserName, this.clientObj.ClientData.payload.password)
      this.clientObj.tls.addTrustedRootCert = true
    } else if (this.clientObj.tls.createdTrustedRootCert && !this.clientObj.tls.checkPublicKeyCertificate) {
      // Get Public Key Certificates, to make sure the cert added in the above is in AMT
      await this.amtwsman.batchEnum(clientId, 'AMT_PublicKeyCertificate', AMTUserName, this.clientObj.ClientData.payload.password)
      this.clientObj.tls.checkPublicKeyCertificate = true
    }
    this.clientManager.setClientObject(this.clientObj)
  }

  async generateKeyPair (clientId: string): Promise<void> {
    if (this.clientObj.tls.confirmPublicKeyCertificate && !this.clientObj.tls.getPublicPrivateKeyPair) {
      // Get existing key pairs
      await this.amtwsman.batchEnum(clientId, 'AMT_PublicPrivateKeyPair', AMTUserName, this.clientObj.ClientData.payload.password)
      this.clientObj.tls.getPublicPrivateKeyPair = true
    } else if (this.clientObj.tls.PublicPrivateKeyPair?.responses?.length >= 0 && !this.clientObj.tls.generateKeyPair) {
      // generate a key pair
      await this.amtwsman.execute(clientId, 'AMT_PublicKeyManagementService', 'GenerateKeyPair', { KeyAlgorithm: 0, KeyLength: 2048 }, null, AMTUserName, this.clientObj.ClientData.payload.password)
      this.clientObj.tls.generateKeyPair = true
    } else if (this.clientObj.tls.addCert && !this.clientObj.tls.checkPublicPrivateKeyPair) {
      await this.amtwsman.batchEnum(clientId, 'AMT_PublicPrivateKeyPair', AMTUserName, this.clientObj.ClientData.payload.password)
      this.clientObj.tls.checkPublicPrivateKeyPair = true
    }
    this.clientManager.setClientObject(this.clientObj)
  }

  /**
   * @description Synchronize time
   * @param {string} clientId Id to keep track of connections
   **/
  async synchronizeTime (clientId: string): Promise<void> {
    if (this.clientObj.tls.resCredentialContext && !this.clientObj.tls.getTimeSynch) {
      await this.amtwsman.execute(clientId, 'AMT_TimeSynchronizationService', 'GetLowAccuracyTimeSynch', {}, null, AMTUserName, this.clientObj.ClientData.payload.password)
      this.clientObj.tls.getTimeSynch = true
      this.clientManager.setClientObject(this.clientObj)
    }
  }

  async setTLSData (clientId: string): Promise<void> {
    const tlsConfig: TlsConfigs = this.clientObj.ClientData.payload.profile.tlsConfigObject

    if (this.clientObj.tls.setTimeSynch && !this.clientObj.tls.getTLSSettingData) {
      // Get the existing TLS data from AMT
      await this.amtwsman.batchEnum(clientId, 'AMT_TLSSettingData', AMTUserName, this.clientObj.ClientData.payload.password)
      this.clientObj.tls.getTLSSettingData = true
    } else if (this.clientObj.tls.TLSSettingData != null && !this.clientObj.tls.putRemoteTLS) {
      // Set remote TLS data on AMT
      this.clientObj.tls.TLSSettingData.responses[0].Enabled = true
      this.clientObj.tls.TLSSettingData.responses[0].AcceptNonSecureConnections = (tlsConfig.tlsMode !== 1 && tlsConfig.tlsMode !== 3) // TODO: check what these values should explicitly be
      this.clientObj.tls.TLSSettingData.responses[0].MutualAuthentication = (tlsConfig.tlsMode === 3 || tlsConfig.tlsMode === 4)
      if (tlsConfig.tlsMode === 3 || tlsConfig.tlsMode === 4) {
        if (Array.isArray(this.clientObj.tls.TLSSettingData.responses[0].TrustedCN) && this.clientObj.tls.TLSSettingData.responses[0].TrustedCN.length > 0) {
          this.clientObj.tls.TLSSettingData.responses[0].TrustedCN.push(`${tlsConfig.issuedCommonName}`)
        } else {
          this.clientObj.tls.TLSSettingData.responses[0].TrustedCN = [`${tlsConfig.issuedCommonName}`]
        }
      }
      this.logger.debug(`Remote TLSSetting Data : ${JSON.stringify(this.clientObj.tls.TLSSettingData.responses[0], null, '\t')}`)
      await this.amtwsman.put(clientId, 'AMT_TLSSettingData', this.clientObj.tls.TLSSettingData.responses[0], AMTUserName, this.clientObj.ClientData.payload.password)
      this.clientObj.tls.putRemoteTLS = true
    } else if (this.clientObj.tls.commitRemoteTLS && !this.clientObj.tls.putLocalTLS) {
      // Since committing changes may cause an internal restart sequence, remote applications should allow sufficient time for Intel AMT to reload before issuing the next command.
      await new Promise(resolve => setTimeout(resolve, 5000))
      // Set local TLS data on AMT
      this.clientObj.tls.TLSSettingData.responses[1].Enabled = true
      if (tlsConfig.tlsMode === 3 || tlsConfig.tlsMode === 4) {
        if (Array.isArray(this.clientObj.tls.TLSSettingData.responses[1].TrustedCN) && this.clientObj.tls.TLSSettingData.responses[1].TrustedCN.length > 0) {
          this.clientObj.tls.TLSSettingData.responses[1].TrustedCN.push(`${tlsConfig.issuedCommonName}`)
        } else {
          this.clientObj.tls.TLSSettingData.responses[1].TrustedCN = [`${tlsConfig.issuedCommonName}`]
        }
      }
      this.logger.debug(`Local TLSSetting Data : ${JSON.stringify(this.clientObj.tls.TLSSettingData.responses[1], null, '\t')}`)
      await this.amtwsman.put(clientId, 'AMT_TLSSettingData', this.clientObj.tls.TLSSettingData.responses[1], AMTUserName, this.clientObj.ClientData.payload.password)
      this.clientObj.tls.putLocalTLS = true
    }
    this.clientManager.setClientObject(this.clientObj)
  }

  /**
   * @description Parse the wsman response received from AMT
   * @param {string} clientId Id to keep track of connections
   * @param {string} message
   */
  async processWSManJsonResponses (message: any, clientId: string): Promise<void> {
    const wsmanResponse = message?.payload
    if (wsmanResponse == null) {
      return
    }
    if (wsmanResponse.AMT_PublicKeyCertificate != null) {
      this.processAMTPublicKeyCertificate(wsmanResponse.AMT_PublicKeyCertificate)
    } else if (wsmanResponse.AMT_PublicPrivateKeyPair != null) {
      await this.processAMTPublicPrivateKeyPair(wsmanResponse.AMT_PublicPrivateKeyPair, clientId)
    } else if (wsmanResponse.AMT_TLSCredentialContext != null) {
      this.processAMTTLSCredentialContext(wsmanResponse.AMT_TLSCredentialContext)
    } else if (wsmanResponse.AMT_TLSSettingData != null) {
      this.processAMTTLSSettingsData(wsmanResponse.AMT_TLSSettingData)
    } else if (wsmanResponse.Header?.Method) {
      if (wsmanResponse.Body?.ReturnValue !== 0 && wsmanResponse.Header.Method !== 'ResourceCreated' && wsmanResponse.Header.Method !== 'AMT_TLSSettingData') {
        throw new RPSError(`${wsmanResponse.Header.Method} failed for ${this.clientObj.uuid}`)
      }
      switch (wsmanResponse.Header.Method) {
        case 'AddTrustedRootCertificate':
          this.logger.info(`Created a Trusted Root Certificate: ${this.clientObj.uuid} : ${JSON.stringify(wsmanResponse?.Body?.CreatedCertificate)} `)
          this.clientObj.tls.createdTrustedRootCert = true
          break
        case 'GenerateKeyPair':
          this.clientObj.tls.generatedPublicPrivateKeyPair = true
          await this.amtwsman.batchEnum(clientId, 'AMT_PublicPrivateKeyPair', AMTUserName, this.clientObj.ClientData.payload.password,
        `${wsmanResponse.Body.KeyPair}${wsmanResponse.Body.ReferenceParameters}${wsmanResponse.Body.SelectorSet}${wsmanResponse.Body.Selector}${wsmanResponse.Body.Value}`)
          break
        case 'AddCertificate':
          this.clientObj.tls.addCert = true
          break
        case 'ResourceCreated':
          this.clientObj.tls.resCredentialContext = true
          break
        case 'AMT_TLSSettingData':
          if (wsmanResponse.Body.ElementName === 'Intel(r) AMT 802.3 TLS Settings') {
            this.clientObj.tls.setRemoteTLS = true
            await this.amtwsman.execute(clientId, 'AMT_SetupAndConfigurationService', 'CommitChanges', { _method_dummy: null }, null, AMTUserName, this.clientObj.ClientData.payload.password)
          } else if (wsmanResponse.Body.ElementName === 'Intel(r) AMT LMS TLS Settings') {
            this.clientObj.tls.setLocalTLS = true
            await this.amtwsman.execute(clientId, 'AMT_SetupAndConfigurationService', 'CommitChanges', { _method_dummy: null }, null, AMTUserName, this.clientObj.ClientData.payload.password)
          } else {
            throw new RPSError(`Failed to set TLS data: ${this.clientObj.uuid}`)
          }
          break
        case 'CommitChanges':
          if (this.clientObj.tls.setRemoteTLS && !this.clientObj.tls.commitRemoteTLS) {
            this.clientObj.tls.commitRemoteTLS = true
          } else if (this.clientObj.tls.commitRemoteTLS && this.clientObj.tls.setLocalTLS && !this.clientObj.tls.commitLocalTLS) {
            this.clientObj.tls.commitLocalTLS = true
          }
          break
        case 'GetLowAccuracyTimeSynch': {
          const Tm1 = Math.round(new Date().getTime() / 1000)
          await this.amtwsman.execute(clientId, 'AMT_TimeSynchronizationService', 'SetHighAccuracyTimeSynch', { Ta0: wsmanResponse?.Body?.Ta0, Tm1: Tm1, Tm2: Tm1 }, null, AMTUserName, this.clientObj.ClientData.payload.password)
          break
        }
        case 'SetHighAccuracyTimeSynch':
          this.clientObj.tls.setTimeSynch = true
          break
      }
      this.clientManager.setClientObject(this.clientObj)
    }
  }

  processAMTTLSSettingsData (wsmanResponse: any): void {
    if (wsmanResponse.status !== 200) {
      throw new RPSError(`Failed to get AMT TLS Data: ${this.clientObj.uuid}`)
    }
    this.clientObj.tls.TLSSettingData = wsmanResponse
    this.clientManager.setClientObject(this.clientObj)
  }

  processAMTTLSCredentialContext (wsmanResponse: any): void {
    if (wsmanResponse.status !== 200) {
      throw new RPSError(`Failed to get TLS Credential Context: ${this.clientObj.uuid}`)
    }
    this.clientObj.tls.TLSCredentialContext = wsmanResponse
    this.clientManager.setClientObject(this.clientObj)
  }

  async processAMTPublicPrivateKeyPair (wsmanResponse: any, clientId: string): Promise<void> {
    if (wsmanResponse.status !== 200) {
      throw new RPSError(`Failed to get AMT Public Private KeyPair: ${this.clientObj.uuid}`)
    }
    this.clientObj.tls.PublicPrivateKeyPair = wsmanResponse
    if (this.clientObj.tls.PublicPrivateKeyPair.responses.length >= 1 && this.clientObj.tls.generatedPublicPrivateKeyPair && !this.clientObj.tls.addCert) {
      const DERKey = this.clientObj.tls.PublicPrivateKeyPair.responses[0]?.DERKey
      const certAttributes: CertAttributes = { CN: 'AMT', O: 'None', ST: 'None', C: 'None' }
      const issuerAttributes: CertAttributes = { CN: this.clientObj.uuid ?? 'Untrusted Root Certificate' }

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
      await this.amtwsman.execute(clientId, 'AMT_PublicKeyManagementService', 'AddCertificate', { CertificateBlob: cert.pem.substring(27, cert.pem.length - 25) }, null, AMTUserName, this.clientObj.ClientData.payload.password)
      this.clientObj.tls.createdPublicPrivateKeyPair = true
    } else if (this.clientObj.tls.checkPublicPrivateKeyPair && !this.clientObj.tls.confirmPublicPrivateKeyPair) {
      this.clientObj.tls.confirmPublicPrivateKeyPair = true
    }
    this.clientManager.setClientObject(this.clientObj)
  }

  processAMTPublicKeyCertificate (wsmanResponse: any): void {
    if (wsmanResponse.status !== 200) {
      throw new RPSError(`Failed to get AMT Public Key Certificate: ${this.clientObj.uuid}`)
    }
    this.logger.debug(`Number of public key certs for device ${this.clientObj.uuid} : ${wsmanResponse.responses.length}`)
    // Store Public Key Certificates
    this.clientObj.tls.PublicKeyCertificate = wsmanResponse
    if (this.clientObj.tls.checkPublicKeyCertificate) {
      const length = wsmanResponse.responses?.length
      const tlsConfig: TlsConfigs = this.clientObj.ClientData.payload.profile.tlsConfigObject
      // Make sure the Trusted root certificate added
      if (wsmanResponse.responses[length - 1].X509Certificate === tlsConfig.certs.ROOT_CERTIFICATE.certbin) {
        this.clientObj.tls.confirmPublicKeyCertificate = true
      }
    }
    this.clientManager.setClientObject(this.clientObj)
  }

  async updateDeviceVersion (clientObj: ClientObject): Promise<void> {
    /* Register cert version with MPS */
    try {
      await got(`${EnvReader.GlobalEnvConfig.mpsServer}/api/v1/devices`, {
        method: 'POST',
        json: {
          guid: this.clientObj.uuid,
          tenantId: this.clientObj.ClientData.payload.profile.tenantId,
          tlsCertVersion: this.clientObj.ClientData.payload.profile.tlsConfigObject.certVersion
        }
      })
    } catch (err) {
      MqttProvider.publishEvent('fail', ['TLSConfigurator'], 'unable to register metadata with MPS', this.clientObj.uuid)
      this.logger.error('unable to register metadata with MPS', err)
    }
  }
}
