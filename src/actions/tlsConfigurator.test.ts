// /*********************************************************************
//  * Copyright (c) Intel Corporation 2022
//  * SPDX-License-Identifier: Apache-2.0
//  **********************************************************************/

import { TLSConfigurator } from './TLSConfigurator'
import Logger from '../Logger'
import { devices } from '../WebSocketListener'
import { EnvReader } from '../utils/EnvReader'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
describe('TLS Configurator', () => {
  let tlsConfigurator: TLSConfigurator
  const wsmanResponse = {
    Envelope: {
      Body: {

      },
      Header: {
        Action: '',
        ResourceURI: ''
      }
    }
  }
  // let responseMsgSpy: jest.SpyInstance
  const clientId = '123'
  jest.setTimeout(6000)

  beforeEach(() => {
    jest.mock('../utils/parseWSManResponseBody', () => {
      return {
        __esModule: true,
        parseBody: jest.fn(() => '')
      }
    })
    tlsConfigurator = new TLSConfigurator(new Logger('TLS Configurator'), null, new ClientResponseMsg(new Logger('ClientResponseMsg')))
    devices[clientId] = {
      unauthCount: 0,
      connectionParams: {

      } as any,
      ClientId: clientId,
      status: {},
      ClientData: {
        payload: {
          profile: {
            tlsMode: 2,
            tenantId: '',
            tlsCerts: {
              ROOT_CERTIFICATE: {
                certbin: ''
              }
            }
          },
          password: 'password'
        }
      },
      tls: {}
    }
  })
  //   jest.setTimeout(30000)

  test('should create TLS Configurator', () => {
    expect(tlsConfigurator).not.toBeNull()
  })

  test('should execute', async () => {
    const processWSManJsonResponsesSpy = jest.spyOn(tlsConfigurator, 'processWSManJsonResponses').mockReturnValue(null)
    const trustedRootCertificatesSpy = jest.spyOn(tlsConfigurator, 'trustedRootCertificates').mockReturnValue(null)
    const generateKeyPairSpy = jest.spyOn(tlsConfigurator, 'generateKeyPair').mockReturnValue(null)
    const createTLSCredentialContextSpy = jest.spyOn(tlsConfigurator, 'createTLSCredentialContext').mockReturnValue(null)
    const synchronizeTimeSpy = jest.spyOn(tlsConfigurator, 'synchronizeTime').mockReturnValue(null)
    const setTLSDataSpy = jest.spyOn(tlsConfigurator, 'setTLSData').mockResolvedValue(null)
    const result = await tlsConfigurator.execute(null, clientId)
    expect(result).toBeNull()
    expect(processWSManJsonResponsesSpy).not.toHaveBeenCalled()
    expect(trustedRootCertificatesSpy).toHaveBeenCalled()
    expect(generateKeyPairSpy).toHaveBeenCalled()
    expect(createTLSCredentialContextSpy).toHaveBeenCalled()
    expect(synchronizeTimeSpy).toHaveBeenCalled()
    expect(setTLSDataSpy).toHaveBeenCalled()
  })
  it('should synchronize time', () => {
    devices[clientId].tls.resCredentialContext = true
    const result = tlsConfigurator.synchronizeTime(clientId)
    expect(devices[clientId].tls.getTimeSynch).toBe(true)
    expect(result).not.toBeNull()
  })
  it('should enumerate TLS Credential Context', () => {
    devices[clientId].tls.confirmPublicPrivateKeyPair = true
    const result = tlsConfigurator.createTLSCredentialContext(clientId)
    expect(devices[clientId].tls.getTLSCredentialContext).toBe(true)
    expect(result).not.toBeNull()
  })
  it('should create TLS Credential Context', () => {
    devices[clientId].tls.getTLSCredentialContext = true
    devices[clientId].tls.TLSCredentialContext = {}
    const result = tlsConfigurator.createTLSCredentialContext(clientId)
    expect(devices[clientId].tls.addCredentialContext).toBe(true)
    expect(result).not.toBeNull()
  })
  it('should get TLS Setting Data', () => {
    devices[clientId].tls.setTimeSynch = true
    const result = tlsConfigurator.setTLSData(clientId)
    expect(devices[clientId].tls.getTLSSettingData).toBe(true)
    expect(result).not.toBeNull()
  })
  it('should store TLS Setting Data when tlsMode is 2', () => {
    devices[clientId].tls.getTLSSettingData = true
    devices[clientId].tls.TLSSettingData = [
      {}
    ]
    const result = tlsConfigurator.setTLSData(clientId)
    expect(devices[clientId].tls.putRemoteTLS).toBe(true)
    expect(devices[clientId].tls.TLSSettingData[0].Enabled).toBe(true)
    expect(devices[clientId].tls.TLSSettingData[0].AcceptNonSecureConnections).toBe(true)
    expect(devices[clientId].tls.TLSSettingData[0].MutualAuthentication).toBe(false)
    expect(result).not.toBeNull()
  })
  it('should enable local TLS when setting TLSSettingData', async () => {
    devices[clientId].tls.putRemoteTLS = true
    devices[clientId].tls.commitRemoteTLS = true
    devices[clientId].tls.TLSSettingData = [
      {}, {}
    ]
    const result = await tlsConfigurator.setTLSData(clientId)
    expect(devices[clientId].tls.putRemoteTLS).toBe(true)
    expect(devices[clientId].tls.TLSSettingData[1].Enabled).toBe(true)
    expect(result).not.toBeNull()
  })
  it('should get existing public key certificates', () => {
    const result = tlsConfigurator.trustedRootCertificates(clientId)
    expect(devices[clientId].tls.getPublicKeyCertificate).toBe(true)
    expect(result).not.toBeNull()
  })
  it('should add trusted root cert', () => {
    devices[clientId].tls.getPublicKeyCertificate = true
    devices[clientId].tls.PublicKeyCertificate = []
    const result = tlsConfigurator.trustedRootCertificates(clientId)
    expect(devices[clientId].tls.addTrustedRootCert).toBe(true)
    expect(result).not.toBeNull()
  })
  it('should ensure that trusted root cert is added in AMT', () => {
    devices[clientId].tls.getPublicKeyCertificate = true
    devices[clientId].tls.addTrustedRootCert = true
    devices[clientId].tls.PublicKeyCertificate = []
    devices[clientId].tls.createdTrustedRootCert = true
    const result = tlsConfigurator.trustedRootCertificates(clientId)
    expect(result).not.toBeNull()
  })
  it('should ensure public certificate before generating public private keypair', () => {
    devices[clientId].tls.confirmPublicKeyCertificate = true
    const result = tlsConfigurator.generateKeyPair(clientId)
    expect(devices[clientId].tls.getPublicPrivateKeyPair).toBe(true)
    expect(result).not.toBeNull()
  })
  it('should generatePublicPrivateKeyPair ', () => {
    devices[clientId].tls.getPublicPrivateKeyPair = true
    devices[clientId].tls.PublicPrivateKeyPair = []
    const result = tlsConfigurator.generateKeyPair(clientId)
    expect(devices[clientId].tls.generateKeyPair).toBe(true)
    expect(result).not.toBeNull()
  })
  it('should generateKeyPair ', () => {
    devices[clientId].tls.addCert = true
    const result = tlsConfigurator.generateKeyPair(clientId)
    expect(devices[clientId].tls.checkPublicPrivateKeyPair).toBe(true)
    expect(result).not.toBeNull()
  })
  it('should processWSManJsonResponses receives 200 when AMT_PublicKeyCertificate', () => {
    wsmanResponse.Envelope.Header.ResourceURI = '/AMT_PublicKeyCertificate'
    jest.spyOn(tlsConfigurator.httpHandler, 'parseXML').mockReturnValue(wsmanResponse)
    const result = tlsConfigurator.processWSManJsonResponses({ payload: { statusCode: 200, body: { text: '' } } }, clientId)
    expect(result).not.toBeNull()
  })
  it('should processWSManJsonResponses receives 200 when AMT_PublicKeyManagementService', () => {
    wsmanResponse.Envelope.Header.ResourceURI = '/AMT_PublicKeyManagementService'
    jest.spyOn(tlsConfigurator.httpHandler, 'parseXML').mockReturnValue(wsmanResponse)
    const result = tlsConfigurator.processWSManJsonResponses({ payload: { statusCode: 200, body: { text: '' } } }, clientId)
    expect(result).toBeNull()
  })
  it('should processWSManJsonResponses receives 200 when AMT_PublicPrivateKeyPair', () => {
    wsmanResponse.Envelope.Header.ResourceURI = '/AMT_PublicPrivateKeyPair'
    jest.spyOn(tlsConfigurator.httpHandler, 'parseXML').mockReturnValue(wsmanResponse)
    const result = tlsConfigurator.processWSManJsonResponses({ payload: { statusCode: 200, body: { text: '' } } }, clientId)
    expect(result).not.toBeNull()
  })
  it('should processWSManJsonResponses receives 200 when AMT_TLSCredentialContext', () => {
    wsmanResponse.Envelope.Header.ResourceURI = '/AMT_TLSCredentialContext'
    jest.spyOn(tlsConfigurator.httpHandler, 'parseXML').mockReturnValue(wsmanResponse)
    const result = tlsConfigurator.processWSManJsonResponses({ payload: { statusCode: 200, body: { text: '' } } }, clientId)
    expect(result).not.toBeNull()
  })
  it('should processWSManJsonResponses receives 200 when AMT_TimeSynchronizationService', () => {
    wsmanResponse.Envelope.Header.ResourceURI = '/AMT_TimeSynchronizationService'
    jest.spyOn(tlsConfigurator.httpHandler, 'parseXML').mockReturnValue(wsmanResponse)
    const result = tlsConfigurator.processWSManJsonResponses({ payload: { statusCode: 200, body: { text: '' } } }, clientId)
    expect(result).not.toBeNull()
  })
  it('should processWSManJsonResponses receives 200 when AMT_TLSSettingData', () => {
    wsmanResponse.Envelope.Header.ResourceURI = '/AMT_TLSSettingData'
    jest.spyOn(tlsConfigurator.httpHandler, 'parseXML').mockReturnValue(wsmanResponse)
    const result = tlsConfigurator.processWSManJsonResponses({ payload: { statusCode: 200, body: { text: '' } } }, clientId)
    expect(result).not.toBeNull()
  })
  it('should processWSManJsonResponses receives 200 when AMT_SetupAndConfigurationService', () => {
    wsmanResponse.Envelope.Header.ResourceURI = '/AMT_SetupAndConfigurationService'
    jest.spyOn(tlsConfigurator.httpHandler, 'parseXML').mockReturnValue(wsmanResponse)
    const result = tlsConfigurator.processWSManJsonResponses({ payload: { statusCode: 200, body: { text: '' } } }, clientId)
    expect(result).toBeNull()
  })

  it('should enumerate public key cert when processWSManJsonResponses receives 401', () => {
    const result = tlsConfigurator.processWSManJsonResponses({ payload: { statusCode: 401 } }, clientId)
    expect(result).not.toBeNull()
  })

  it('should validateSetupAndConfigurationService when setRemote', () => {
    devices[clientId].tls.setRemoteTLS = true
    const result = tlsConfigurator.validateSetupAndConfigurationService(clientId, wsmanResponse)
    expect(result).toBeNull()
    expect(devices[clientId].tls.commitRemoteTLS).toBe(true)
  })

  it('should validateSetupAndConfigurationService when setLocal', () => {
    devices[clientId].tls.setLocalTLS = true
    devices[clientId].tls.commitRemoteTLS = true
    const result = tlsConfigurator.validateSetupAndConfigurationService(clientId, wsmanResponse)
    expect(result).toBeNull()
    expect(devices[clientId].tls.commitLocalTLS).toBe(true)
  })

  it('should validateTLSSettingData when Enumerate', () => {
    wsmanResponse.Envelope.Header.Action = '/EnumerateResponse'
    wsmanResponse.Envelope.Body = { EnumerateResponse: { EnumerationContext: '' } }
    const result = tlsConfigurator.validateTLSSettingData(clientId, wsmanResponse)
    expect(result).not.toBeNull()
  })
  it('should validateTLSSettingData when Put when remote', () => {
    wsmanResponse.Envelope.Header.Action = '/PutResponse'
    wsmanResponse.Envelope.Body = { AMT_TLSSettingData: { ElementName: 'Intel(r) AMT 802.3 TLS Settings' } }
    const result = tlsConfigurator.validateTLSSettingData(clientId, wsmanResponse)
    expect(result).not.toBeNull()
    expect(devices[clientId].tls.setRemoteTLS).toBe(true)
  })
  it('should validateTLSSettingData when Put when local', () => {
    wsmanResponse.Envelope.Header.Action = '/PutResponse'
    wsmanResponse.Envelope.Body = { AMT_TLSSettingData: { ElementName: 'Intel(r) AMT LMS TLS Settings' } }
    const result = tlsConfigurator.validateTLSSettingData(clientId, wsmanResponse)
    expect(result).not.toBeNull()
    expect(devices[clientId].tls.setLocalTLS).toBe(true)
  })
  it('should validateTLSSettingData when Pull', () => {
    wsmanResponse.Envelope.Header.Action = '/PullResponse'
    const processSpy = jest.spyOn(tlsConfigurator, 'processAMTTLSSettingsData').mockImplementation(() => { return {} as any })
    const result = tlsConfigurator.validateTLSSettingData(clientId, wsmanResponse)
    expect(result).toBeNull()
    expect(processSpy).toHaveBeenCalled()
  })

  it('should validateTimeSynchronizationService when GetLowAccuracyTimeSynchResponse', () => {
    wsmanResponse.Envelope.Header.Action = '/GetLowAccuracyTimeSynchResponse'
    wsmanResponse.Envelope.Body = { GetLowAccuracyTimeSynch_OUTPUT: { Ta0: 123456789 } }
    const message = tlsConfigurator.validateTimeSynchronizationService(clientId, wsmanResponse)
    expect(message).not.toBeNull()
  })

  it('should validateTimeSynchronizationService when GetLowAccuracyTimeSynchResponse', () => {
    wsmanResponse.Envelope.Header.Action = '/SetHighAccuracyTimeSynchResponse'
    const message = tlsConfigurator.validateTimeSynchronizationService(clientId, wsmanResponse)
    expect(devices[clientId].tls.setTimeSynch).toBe(true)
    expect(message).toBeNull()
  })

  it('should validateTLSCredentialContext when Enumerate', () => {
    wsmanResponse.Envelope.Header.Action = '/EnumerateResponse'
    wsmanResponse.Envelope.Body = { EnumerateResponse: { EnumerationContext: '' } }
    const result = tlsConfigurator.validateTLSCredentialContext(clientId, wsmanResponse)
    expect(result).not.toBeNull()
  })

  it('should validateTLSCredentialContext when Pull', () => {
    wsmanResponse.Envelope.Header.Action = '/PullResponse'
    const processSpy = jest.spyOn(tlsConfigurator, 'processAMTTLSCredentialContext').mockImplementation(() => { return {} as any })
    const result = tlsConfigurator.validateTLSCredentialContext(clientId, wsmanResponse)
    expect(result).toBeNull()
    expect(processSpy).toHaveBeenCalled()
  })

  it('should validateTLSCredentialContext when Create', () => {
    wsmanResponse.Envelope.Header.Action = '/CreateResponse'
    const result = tlsConfigurator.validateTLSCredentialContext(clientId, wsmanResponse)
    expect(result).toBeNull()
  })

  it('should validatePublicPrivateKeyPair when Enumerate', () => {
    wsmanResponse.Envelope.Header.Action = '/EnumerateResponse'
    wsmanResponse.Envelope.Body = { EnumerateResponse: { EnumerationContext: '' } }
    const result = tlsConfigurator.validatePublicPrivateKeyPair(clientId, wsmanResponse)
    expect(result).not.toBeNull()
  })

  it('should validatePublicPrivateKeyPair when pull', () => {
    wsmanResponse.Envelope.Header.Action = '/PullResponse'
    const processSpy = jest.spyOn(tlsConfigurator, 'processAMTPublicPrivateKeyPair').mockImplementation(() => { return {} as any })
    const result = tlsConfigurator.validatePublicPrivateKeyPair(clientId, wsmanResponse)
    expect(result).not.toBeNull()
    expect(processSpy).toHaveBeenCalled()
  })

  it('should validateAMTPublicKeyManagementService', () => {
    wsmanResponse.Envelope.Header.Action = '/AddCertificateResponse'
    const result = tlsConfigurator.validateAMTPublicKeyManagementService(clientId, wsmanResponse)
    expect(result).toBeNull()
    expect(devices[clientId].tls.addCert).toBe(true)
  })
  it('should validateAMTPublicKeyManagementService when GenerateKeyPairResponse', () => {
    wsmanResponse.Envelope.Header.Action = '/GenerateKeyPairResponse'
    const result = tlsConfigurator.validateAMTPublicKeyManagementService(clientId, wsmanResponse)
    expect(result).not.toBeNull()
  })
  it('should validateAMTPublicKeyManagementService when AddTrustedRootCertificateResponse', () => {
    wsmanResponse.Envelope.Header.Action = '/AddTrustedRootCertificateResponse'
    const result = tlsConfigurator.validateAMTPublicKeyManagementService(clientId, wsmanResponse)
    expect(result).toBeNull()
    expect(devices[clientId].tls.createdTrustedRootCert).toBe(true)
  })
  it('should validateAMTPublicKeyCertificate when enumerate', () => {
    wsmanResponse.Envelope.Header.Action = '/EnumerateResponse'
    wsmanResponse.Envelope.Body = { EnumerateResponse: { EnumerationContext: '' } }
    const result = tlsConfigurator.validateAMTPublicKeyCertificate(clientId, wsmanResponse)
    expect(result).not.toBeNull()
  })
  it('should validateAMTPublicKeyCertificate when pull', () => {
    const processSpy = jest.spyOn(tlsConfigurator, 'processAMTPublicKeyCertificate').mockImplementation(() => {})
    wsmanResponse.Envelope.Header.Action = '/PullResponse'
    const result = tlsConfigurator.validateAMTPublicKeyCertificate(clientId, wsmanResponse)
    expect(result).toBeNull()
    expect(processSpy).toHaveBeenCalled()
  })

  it('should process AMT TLS Setting Data', () => {
    wsmanResponse.Envelope.Body = { PullResponse: { Items: { AMT_TLSSettingData: {} } } }
    tlsConfigurator.processAMTTLSSettingsData(wsmanResponse, clientId)
    expect(devices[clientId].tls.TLSSettingData).toEqual({})
  })

  it('should process AMT TLS Credential Context', () => {
    wsmanResponse.Envelope.Body = { PullResponse: { Items: '' } }
    tlsConfigurator.processAMTTLSCredentialContext(wsmanResponse, clientId)
    expect(devices[clientId].tls.TLSCredentialContext).toEqual('')
  })

  it('should process AMT Public Private Key Pair when no Items', () => {
    wsmanResponse.Envelope.Body = {
      PullResponse: {
        Items: ''
      }
    }
    tlsConfigurator.processAMTPublicPrivateKeyPair(wsmanResponse, clientId)
    expect(devices[clientId].tls.PublicPrivateKeyPair).toEqual([])
  })
  it('should process AMT Public Private Key Pair when single item', () => {
    wsmanResponse.Envelope.Body = {
      PullResponse: {
        Items: { AMT_PublicPrivateKeyPair: {} }
      }
    }
    tlsConfigurator.processAMTPublicPrivateKeyPair(wsmanResponse, clientId)
    expect(devices[clientId].tls.PublicPrivateKeyPair).toEqual([{}])
  })
  it('should process AMT Public Private Key Pair when single item', () => {
    wsmanResponse.Envelope.Body = {
      PullResponse: {
        Items: { AMT_PublicPrivateKeyPair: [{}, {}] }
      }
    }
    tlsConfigurator.processAMTPublicPrivateKeyPair(wsmanResponse, clientId)
    expect(devices[clientId].tls.PublicPrivateKeyPair).toEqual([{}, {}])
  })
  it('should process AMT Public Key Certificate when no Items', () => {
    wsmanResponse.Envelope.Body = {
      PullResponse: {
        Items: ''
      }
    }
    tlsConfigurator.processAMTPublicKeyCertificate(wsmanResponse, clientId)
    expect(devices[clientId].tls.PublicKeyCertificate).toEqual([])
  })
  it('should process AMT Public Key Certificate when single item', () => {
    wsmanResponse.Envelope.Body = {
      PullResponse: {
        Items: { AMT_PublicKeyCertificate: {} }
      }
    }
    tlsConfigurator.processAMTPublicKeyCertificate(wsmanResponse, clientId)
    expect(devices[clientId].tls.PublicKeyCertificate).toEqual([{}])
  })
  it('should process AMT Public Key Certificate when single item', () => {
    wsmanResponse.Envelope.Body = {
      PullResponse: {
        Items: { AMT_PublicKeyCertificate: [{}, {}] }
      }
    }
    tlsConfigurator.processAMTPublicKeyCertificate(wsmanResponse, clientId)
    expect(devices[clientId].tls.PublicKeyCertificate).toEqual([{}, {}])
  })
  it('should update device version', async () => {
    EnvReader.GlobalEnvConfig = { mpsServer: 'http://localhost' } as any
    const gotSpy = jest.spyOn(tlsConfigurator.gotClient, 'post').mockResolvedValue(null)
    await tlsConfigurator.updateDeviceVersion(devices[clientId])
    expect(gotSpy).toHaveBeenCalled()
  })
})
