import { TLSConfigurator } from './TLSConfigurator'
import { AMTUserName } from '../utils/constants'
import Logger from '../Logger'
describe('TLS Configurator', () => {
  let tlsConfigurator: TLSConfigurator

  let amtwsmanBatchEnumSpy: jest.SpyInstance
  let amtwsmanExecuteSpy: jest.SpyInstance
  let amtwsmanCreateSpy: jest.SpyInstance
  let amtwsmanPutSpy: jest.SpyInstance
  let clientManagerSetSpy: jest.SpyInstance
  let clientManagerGetSpy: jest.SpyInstance
  let responseMsgSpy: jest.SpyInstance
  const clientId = '123'
  const clientObj = {
    ClientId: clientId,
    status: {},
    ClientData: {
      payload: {
        password: 'password'
      }
    },
    tls: {}
  }
  beforeEach(() => {
    tlsConfigurator = new TLSConfigurator(new Logger('TLS Configurator'), null, { get: () => {} } as any, { execute: () => {}, batchEnum: () => {}, create: () => {}, put: () => {} } as any, { setClientObject: () => {}, getClientObject: () => clientObj } as any)
    amtwsmanBatchEnumSpy = jest.spyOn(tlsConfigurator.amtwsman, 'batchEnum')
    amtwsmanExecuteSpy = jest.spyOn(tlsConfigurator.amtwsman, 'execute')
    amtwsmanCreateSpy = jest.spyOn(tlsConfigurator.amtwsman, 'create')
    amtwsmanPutSpy = jest.spyOn(tlsConfigurator.amtwsman, 'put')
    clientManagerSetSpy = jest.spyOn(tlsConfigurator.clientManager, 'setClientObject')
    clientManagerGetSpy = jest.spyOn(tlsConfigurator.clientManager, 'getClientObject')
    responseMsgSpy = jest.spyOn(tlsConfigurator.responseMsg, 'get')
    tlsConfigurator.clientObj = {
      ClientId: clientId,
      status: {},
      ClientData: {
        payload: {
          password: 'password'
        }
      },
      tls: {}
    }
  })
  jest.setTimeout(30000)

  test('should create TLS Configurator', () => {
    expect(tlsConfigurator).toBeDefined()
  })
  test('should execute', async () => {
    const processWSManJsonResponsesSpy = jest.spyOn(tlsConfigurator, 'processWSManJsonResponses').mockResolvedValue()
    const trustedRootCertificatesSpy = jest.spyOn(tlsConfigurator, 'trustedRootCertificates').mockResolvedValue()
    const generateKeyPairSpy = jest.spyOn(tlsConfigurator, 'generateKeyPair').mockResolvedValue()
    const createTLSCredentialContextSpy = jest.spyOn(tlsConfigurator, 'createTLSCredentialContext').mockResolvedValue()
    const synchronizeTimeSpy = jest.spyOn(tlsConfigurator, 'synchronizeTime').mockResolvedValue()
    const setTLSDataSpy = jest.spyOn(tlsConfigurator, 'setTLSData').mockResolvedValue()
    const result = await tlsConfigurator.execute('', clientId)
    expect(result).toBeNull()
    expect(clientManagerGetSpy).toHaveBeenCalledWith(clientId)
    expect(processWSManJsonResponsesSpy).toHaveBeenCalled()
    expect(trustedRootCertificatesSpy).toHaveBeenCalled()
    expect(generateKeyPairSpy).toHaveBeenCalled()
    expect(createTLSCredentialContextSpy).toHaveBeenCalled()
    expect(synchronizeTimeSpy).toHaveBeenCalled()
    expect(setTLSDataSpy).toHaveBeenCalled()
  })
  test('should execute when commitLocalTLS', async () => {
    const clientObj2 = clientObj;
    (clientObj2.tls as any).commitLocalTLS = true

    tlsConfigurator.clientManager.getClientObject = () => clientObj2
    const processWSManJsonResponsesSpy = jest.spyOn(tlsConfigurator, 'processWSManJsonResponses').mockResolvedValue()
    const trustedRootCertificatesSpy = jest.spyOn(tlsConfigurator, 'trustedRootCertificates').mockResolvedValue()
    const generateKeyPairSpy = jest.spyOn(tlsConfigurator, 'generateKeyPair').mockResolvedValue()
    const createTLSCredentialContextSpy = jest.spyOn(tlsConfigurator, 'createTLSCredentialContext').mockResolvedValue()
    const synchronizeTimeSpy = jest.spyOn(tlsConfigurator, 'synchronizeTime').mockResolvedValue()
    const setTLSDataSpy = jest.spyOn(tlsConfigurator, 'setTLSData').mockResolvedValue()
    const updateDeviceVersionSpy = jest.spyOn(tlsConfigurator, 'updateDeviceVersion').mockResolvedValue()
    const result = await tlsConfigurator.execute('', clientId)
    expect(result).not.toBeNull()

    expect(processWSManJsonResponsesSpy).toHaveBeenCalled()
    expect(trustedRootCertificatesSpy).toHaveBeenCalled()
    expect(generateKeyPairSpy).toHaveBeenCalled()
    expect(createTLSCredentialContextSpy).toHaveBeenCalled()
    expect(synchronizeTimeSpy).toHaveBeenCalled()
    expect(setTLSDataSpy).toHaveBeenCalled()
    expect(updateDeviceVersionSpy).toHaveBeenCalled()
    expect(responseMsgSpy).toHaveBeenCalled() // With(clientId, null, 'success', 'success', '{"TLSConfiguration": "Configured"}')
  })
  test('should synchronize time', async () => {
    tlsConfigurator.clientObj.tls = {
      resCredentialContext: true,
      getTimeSynch: false
    }
    await tlsConfigurator.synchronizeTime(clientId)
    expect(amtwsmanExecuteSpy).toHaveBeenCalledWith(clientId, 'AMT_TimeSynchronizationService', 'GetLowAccuracyTimeSynch', {}, null, AMTUserName, 'password')
    expect(tlsConfigurator.clientObj.tls.getTimeSynch).toBe(true)
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should create tls credential context when getTLSCredentialContext is falsy', async () => {
    tlsConfigurator.clientObj.tls.confirmPublicPrivateKeyPair = true
    expect(tlsConfigurator.clientObj.tls.getTLSCredentialContext).toBeFalsy()
    await tlsConfigurator.createTLSCredentialContext(clientId)
    expect(tlsConfigurator.clientObj.tls.getTLSCredentialContext).toBe(true)
  })
  test('should create tls credential context when addCredentialContext is falsy', async () => {
    tlsConfigurator.clientObj.tls.getTLSCredentialContext = true
    tlsConfigurator.clientObj.tls.TLSCredentialContext = {}
    const amtPrefix = 'http://intel.com/wbem/wscim/1/amt-schema/1/'
    const certHandle = 'Intel(r) AMT Certificate: Handle: 1'
    const putObj = {
      ElementInContext: `<a:Address>/wsman</a:Address><a:ReferenceParameters><w:ResourceURI>${amtPrefix}AMT_PublicKeyCertificate</w:ResourceURI><w:SelectorSet><w:Selector Name="InstanceID">${certHandle}</w:Selector></w:SelectorSet></a:ReferenceParameters>`,
      ElementProvidingContext: `<a:Address>/wsman</a:Address><a:ReferenceParameters><w:ResourceURI>${amtPrefix}AMT_TLSProtocolEndpointCollection</w:ResourceURI><w:SelectorSet><w:Selector Name="ElementName">TLSProtocolEndpointInstances Collection</w:Selector></w:SelectorSet></a:ReferenceParameters>`
    }
    expect(tlsConfigurator.clientObj.tls.addCredentialContext).toBeFalsy()
    await tlsConfigurator.createTLSCredentialContext(clientId)
    expect(amtwsmanCreateSpy).toHaveBeenCalledWith(clientId, 'AMT_TLSCredentialContext', putObj, null, AMTUserName, 'password')
    expect(tlsConfigurator.clientObj.tls.addCredentialContext).toBe(true)
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should add trusted root certificates when not getPublicKeyCertificate', async () => {
    tlsConfigurator.clientObj.ClientData.payload.profile = {
      tlsConfigObject: {

      }
    }
    expect(tlsConfigurator.clientObj.tls.getPublicKeyCertificate).toBeFalsy()
    await tlsConfigurator.trustedRootCertificates(clientId)
    expect(tlsConfigurator.clientObj.tls.getPublicKeyCertificate).toBe(true)
    expect(amtwsmanBatchEnumSpy).toHaveBeenCalledWith(clientId, 'AMT_PublicKeyCertificate', AMTUserName, 'password')
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should add trusted root certificates when not addTrustedRootCert', async () => {
    tlsConfigurator.clientObj.tls.getPublicKeyCertificate = true
    tlsConfigurator.clientObj.tls.PublicKeyCertificate = {
      responses: [{}]
    }
    const ROOT_CERTIFICATE = { certbin: '' }
    tlsConfigurator.clientObj.ClientData.payload.profile = {
      tlsCerts: {
        ROOT_CERTIFICATE
      }
    }
    expect(tlsConfigurator.clientObj.tls.getPublicKeyCertificate).toBeTruthy()
    expect(tlsConfigurator.clientObj.tls.addTrustedRootCert).toBeFalsy()
    await tlsConfigurator.trustedRootCertificates(clientId)
    expect(tlsConfigurator.clientObj.tls.addTrustedRootCert).toBe(true)

    expect(amtwsmanExecuteSpy).toHaveBeenCalledWith(clientId, 'AMT_PublicKeyManagementService', 'AddTrustedRootCertificate', { CertificateBlob: ROOT_CERTIFICATE.certbin }, null, AMTUserName, 'password')
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should add trusted root certificates when not checkPublicKeyCertificate ', async () => {
    tlsConfigurator.clientObj.tls.getPublicKeyCertificate = true
    tlsConfigurator.clientObj.tls.createdTrustedRootCert = true
    tlsConfigurator.clientObj.tls.addTrustedRootCert = true
    tlsConfigurator.clientObj.tls.PublicKeyCertificate = {
      responses: [{}]
    }
    tlsConfigurator.clientObj.ClientData.payload.profile = {
      tlsConfigObject: {

      }
    }

    expect(tlsConfigurator.clientObj.tls.checkPublicKeyCertificate).toBeFalsy()
    await tlsConfigurator.trustedRootCertificates(clientId)
    expect(tlsConfigurator.clientObj.tls.checkPublicKeyCertificate).toBe(true)
    expect(amtwsmanBatchEnumSpy).toHaveBeenCalledWith(clientId, 'AMT_PublicKeyCertificate', AMTUserName, 'password')
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should generate key pair when confirmPublicKeyCertificate', async () => {
    tlsConfigurator.clientObj.tls.confirmPublicKeyCertificate = true
    expect(tlsConfigurator.clientObj.tls.getPublicPrivateKeyPair).toBeFalsy()
    await tlsConfigurator.generateKeyPair(clientId)
    expect(tlsConfigurator.clientObj.tls.getPublicPrivateKeyPair).toBe(true)
    expect(amtwsmanBatchEnumSpy).toHaveBeenCalledWith(clientId, 'AMT_PublicPrivateKeyPair', AMTUserName, 'password')
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should generate key pair when PublicPrivateKeyPair', async () => {
    tlsConfigurator.clientObj.tls.PublicPrivateKeyPair = { responses: [{}] }
    expect(tlsConfigurator.clientObj.tls.generateKeyPair).toBeFalsy()
    await tlsConfigurator.generateKeyPair(clientId)
    expect(tlsConfigurator.clientObj.tls.generateKeyPair).toBe(true)
    expect(amtwsmanExecuteSpy).toHaveBeenCalledWith(clientId, 'AMT_PublicKeyManagementService', 'GenerateKeyPair', { KeyAlgorithm: 0, KeyLength: 2048 }, null, AMTUserName, 'password')
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })

  test('should generate key pair when addCert ', async () => {
    tlsConfigurator.clientObj.tls.addCert = true
    expect(tlsConfigurator.clientObj.tls.checkPublicPrivateKeyPair).toBeFalsy()
    await tlsConfigurator.generateKeyPair(clientId)
    expect(tlsConfigurator.clientObj.tls.checkPublicPrivateKeyPair).toBe(true)
    expect(amtwsmanBatchEnumSpy).toHaveBeenCalledWith(clientId, 'AMT_PublicPrivateKeyPair', AMTUserName, 'password')
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should set tls data when setTimeSync', async () => {
    tlsConfigurator.clientObj.tls.setTimeSynch = true
    tlsConfigurator.clientObj.ClientData.payload.profile = {
      tlsConfigObject: {

      }
    }
    expect(tlsConfigurator.clientObj.tls.getTLSSettingData).toBeFalsy()
    await tlsConfigurator.setTLSData(clientId)
    expect(tlsConfigurator.clientObj.tls.getTLSSettingData).toBe(true)
    expect(clientManagerSetSpy).toHaveBeenCalled()
    expect(amtwsmanBatchEnumSpy).toHaveBeenCalledWith(clientId, 'AMT_TLSSettingData', AMTUserName, 'password')
  })

  test('should set tls data when TLSSettingData ', async () => {
    tlsConfigurator.clientObj.ClientData.payload.profile = {
      tlsConfigObject: {

      }
    }
    tlsConfigurator.clientObj.tls.TLSSettingData = {
      responses: [{}]
    }
    expect(tlsConfigurator.clientObj.tls.putRemoteTLS).toBeFalsy()
    await tlsConfigurator.setTLSData(clientId)
    expect(tlsConfigurator.clientObj.tls.TLSSettingData.responses[0].Enabled).toBe(true)
    expect(tlsConfigurator.clientObj.tls.TLSSettingData.responses[0].AcceptNonSecureConnections).toBe(true)
    expect(tlsConfigurator.clientObj.tls.TLSSettingData.responses[0].MutualAuthentication).toBe(false)
    expect(tlsConfigurator.clientObj.tls.putRemoteTLS).toBe(true)
    expect(clientManagerSetSpy).toHaveBeenCalled()
    expect(amtwsmanPutSpy).toHaveBeenCalledWith(clientId, 'AMT_TLSSettingData', tlsConfigurator.clientObj.tls.TLSSettingData.responses[0], AMTUserName, 'password')
  })
  test('should set tls data when commitRemoteTLS  ', async () => {
    tlsConfigurator.clientObj.tls.commitRemoteTLS = true
    tlsConfigurator.clientObj.tls.putRemoteTLS = true
    tlsConfigurator.clientObj.ClientData.payload.profile = {
      tlsConfigObject: {

      }
    }
    tlsConfigurator.clientObj.tls.TLSSettingData = {
      responses: [{}, {}]
    }
    expect(tlsConfigurator.clientObj.tls.putLocalTLS).toBeFalsy()

    await tlsConfigurator.setTLSData(clientId)
    expect(tlsConfigurator.clientObj.tls.TLSSettingData.responses[1].Enabled).toBe(true)
    expect(tlsConfigurator.clientObj.tls.putLocalTLS).toBe(true)
    expect(amtwsmanPutSpy).toHaveBeenCalledWith(clientId, 'AMT_TLSSettingData', tlsConfigurator.clientObj.tls.TLSSettingData.responses[1], AMTUserName, 'password')
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })

  test('should process WSMan response when AMT_PublicKeyCertificate', async () => {
    tlsConfigurator.clientObj.tls.checkPublicKeyCertificate = true
    const message = {
      payload: {
        AMT_PublicKeyCertificate: { status: 200, responses: [{ X509Certificate: '' }] }
      }
    }
    const ROOT_CERTIFICATE = { certbin: '' }
    tlsConfigurator.clientObj.ClientData.payload.profile = {
      tlsCerts: {
        ROOT_CERTIFICATE
      }
    }
    const spy = jest.spyOn(tlsConfigurator, 'processAMTPublicKeyCertificate')
    await tlsConfigurator.processWSManJsonResponses(message, clientId)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(message.payload.AMT_PublicKeyCertificate)
    expect(tlsConfigurator.clientObj.tls.confirmPublicKeyCertificate).toBe(true)
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should process WSMan response when AMTPublicPrivateKeyPair', async () => {
    const message = {
      payload: {
        AMT_PublicPrivateKeyPair: { status: 200, responses: [] }
      }
    }
    const spy = jest.spyOn(tlsConfigurator, 'processAMTPublicPrivateKeyPair')
    await tlsConfigurator.processWSManJsonResponses(message, clientId)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(message.payload.AMT_PublicPrivateKeyPair, clientId)
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should process WSMan response when AMTTLSCredentialContext', async () => {
    const message = {
      payload: {
        AMT_TLSCredentialContext: { status: 200, responses: [] }
      }
    }
    const spy = jest.spyOn(tlsConfigurator, 'processAMTTLSCredentialContext')
    await tlsConfigurator.processWSManJsonResponses(message, clientId)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(message.payload.AMT_TLSCredentialContext)
  })
  test('should process WSMan response when AMTTLSSettingsData', async () => {
    const message = {
      payload: {
        AMT_TLSSettingData: { status: 200, responses: [] }
      }
    }
    const spy = jest.spyOn(tlsConfigurator, 'processAMTTLSSettingsData')
    await tlsConfigurator.processWSManJsonResponses(message, clientId)
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(message.payload.AMT_TLSSettingData)
  })
  test('should process WSMan response when header method AddTrustedRootCertificate', async () => {
    const message = {
      payload: {
        Header: {
          Method: 'AddTrustedRootCertificate'
        },
        Body: {
          ReturnValue: 0
        }
      }
    }
    await tlsConfigurator.processWSManJsonResponses(message, clientId)
    expect(tlsConfigurator.clientObj.tls.createdTrustedRootCert).toBe(true)
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should process WSMan response when header method GenerateKeyPair', async () => {
    const message = {
      payload: {
        Header: {
          Method: 'GenerateKeyPair'
        },
        Body: {
          ReturnValue: 0
        }
      }
    }
    await tlsConfigurator.processWSManJsonResponses(message, clientId)
    expect(tlsConfigurator.clientObj.tls.generatedPublicPrivateKeyPair).toBe(true)
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should process WSMan response when header method AddCertificate', async () => {
    const message = {
      payload: {
        Header: {
          Method: 'AddCertificate'
        },
        Body: {
          ReturnValue: 0
        }
      }
    }
    await tlsConfigurator.processWSManJsonResponses(message, clientId)
    expect(tlsConfigurator.clientObj.tls.addCert).toBe(true)
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should process WSMan response when header method ResourceCreated', async () => {
    const message = {
      payload: {
        Header: {
          Method: 'ResourceCreated'
        },
        Body: {
          ReturnValue: 0
        }
      }
    }
    await tlsConfigurator.processWSManJsonResponses(message, clientId)
    expect(tlsConfigurator.clientObj.tls.resCredentialContext).toBe(true)
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should process WSMan response when header method AMT_TLSSettingData and Intel(r) AMT 802.3 TLS Settings', async () => {
    const message = {
      payload: {
        Header: {
          Method: 'AMT_TLSSettingData'
        },
        Body: {
          ElementName: 'Intel(r) AMT 802.3 TLS Settings',
          ReturnValue: 0
        }
      }
    }
    await tlsConfigurator.processWSManJsonResponses(message, clientId)
    expect(tlsConfigurator.clientObj.tls.setRemoteTLS).toBe(true)
    expect(tlsConfigurator.clientObj.tls.setLocalTLS).toBeFalsy()

    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should process WSMan response when header method AMT_TLSSettingData and Intel(r) AMT LMS TLS Settings', async () => {
    const message = {
      payload: {
        Header: {
          Method: 'AMT_TLSSettingData'
        },
        Body: {
          ElementName: 'Intel(r) AMT LMS TLS Settings',
          ReturnValue: 0
        }
      }
    }
    await tlsConfigurator.processWSManJsonResponses(message, clientId)
    expect(tlsConfigurator.clientObj.tls.setRemoteTLS).toBeFalsy()
    expect(tlsConfigurator.clientObj.tls.setLocalTLS).toBe(true)
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should process WSMan response when header method CommitChanges and setRemoteTLS', async () => {
    tlsConfigurator.clientObj.tls.setRemoteTLS = true
    const message = {
      payload: {
        Header: {
          Method: 'CommitChanges'
        },
        Body: {
          ReturnValue: 0
        }
      }
    }
    expect(tlsConfigurator.clientObj.tls.commitRemoteTLS).toBeFalsy()
    await tlsConfigurator.processWSManJsonResponses(message, clientId)
    expect(tlsConfigurator.clientObj.tls.commitRemoteTLS).toBe(true)
    expect(tlsConfigurator.clientObj.tls.commitLocalTLS).toBeFalsy()
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should process WSMan response when header method CommitChanges and setLocalTLS', async () => {
    tlsConfigurator.clientObj.tls.setLocalTLS = true
    tlsConfigurator.clientObj.tls.commitRemoteTLS = true
    const message = {
      payload: {
        Header: {
          Method: 'CommitChanges'
        },
        Body: {
          ReturnValue: 0
        }
      }
    }
    expect(tlsConfigurator.clientObj.tls.commitLocalTLS).toBeFalsy()
    await tlsConfigurator.processWSManJsonResponses(message, clientId)
    expect(tlsConfigurator.clientObj.tls.commitRemoteTLS).toBe(true)
    expect(tlsConfigurator.clientObj.tls.commitLocalTLS).toBe(true)
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should process WSMan response when header method GetLowAccuracyTimeSynch', async () => {
    const message = {
      payload: {
        Header: {
          Method: 'GetLowAccuracyTimeSynch'
        },
        Body: {
          ReturnValue: 0
        }
      }
    }
    await tlsConfigurator.processWSManJsonResponses(message, clientId)
    // expect(tlsConfigurator.clientObj.tls.createdTrustedRootCert).toBe(true)
    // expect(clientManagerSetSpy).toHaveBeenCalled()
  })
  test('should process WSMan response when header method SetHighAccuracyTimeSynch', async () => {
    const message = {
      payload: {
        Header: {
          Method: 'SetHighAccuracyTimeSynch'
        },
        Body: {
          ReturnValue: 0
        }
      }
    }
    await tlsConfigurator.processWSManJsonResponses(message, clientId)
    expect(tlsConfigurator.clientObj.tls.setTimeSynch).toBe(true)
    expect(clientManagerSetSpy).toHaveBeenCalled()
  })
})
