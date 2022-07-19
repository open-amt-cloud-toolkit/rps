/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { Configurator } from '../Configurator'
import Logger from '../Logger'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { v4 as uuid } from 'uuid'
import { EnvReader } from '../utils/EnvReader'
import { config } from '../test/helper/Config'
import { devices } from '../WebSocketListener'
import { ClientAction, ClientMsg, FeaturesConfigFlow } from '../models/RCS.Config'
import { FeaturesConfigurator } from './FeaturesConfigurator'
import { AMTUserConsent } from '../models'
import { Common } from '@open-amt-cloud-toolkit/wsman-messages'
import { RPSError } from '../utils/RPSError'
EnvReader.GlobalEnvConfig = config
const configurator = new Configurator()
const responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
const feturesConfigurator = new FeaturesConfigurator(new Logger('NetworkConfig'), configurator, responseMsg, null, null)

let clientId
let activationMsg
let getRedirectionSvcMsg
let getIpsOptInSvcMsg
let getKvmRedirectionSvcMsg
let setRedirectionSvcMsg
let setKvmRedirectionSvcMsg
let putRedirectionSvcMsg
let putIpsOptInSvcMsg
let amtRedirectionSvcJson
let ipsOptInsSvcJson
let kvmRedirectionSvcJson
let profile

interface FeaturesTestMatrix {
  AMT_RedirectionService: boolean
  IPS_OptInService: boolean
  CIM_KVMRedirectionSAP: boolean
  transitionFromGetToSet: boolean
  setRedirectionServiceXml: boolean
  setKvmRedirectionSapXml: boolean
  putRedirectionServiceXml: boolean
  putIpsOptInServiceXml: boolean
}

function confirmFeaturesFlowState (features: FeaturesConfigFlow, testMatrix: FeaturesTestMatrix): void {
  testMatrix.AMT_RedirectionService
    ? expect(features.AMT_RedirectionService).toBeTruthy()
    : expect(features.AMT_RedirectionService).toBeFalsy()
  testMatrix.IPS_OptInService
    ? expect(features.IPS_OptInService).toBeTruthy()
    : expect(features.IPS_OptInService).toBeFalsy()
  testMatrix.CIM_KVMRedirectionSAP
    ? expect(features.CIM_KVMRedirectionSAP).toBeTruthy()
    : expect(features.CIM_KVMRedirectionSAP).toBeFalsy()
  testMatrix.transitionFromGetToSet
    ? expect(features.transitionFromGetToSet).toBeTruthy()
    : expect(features.transitionFromGetToSet).toBeFalsy()
  testMatrix.setRedirectionServiceXml
    ? expect(features.setRedirectionServiceXml).toBeTruthy()
    : expect(features.setRedirectionServiceXml).toBeFalsy()
  testMatrix.setKvmRedirectionSapXml
    ? expect(features.setKvmRedirectionSapXml).toBeTruthy()
    : expect(features.setKvmRedirectionSapXml).toBeFalsy()
  testMatrix.putRedirectionServiceXml
    ? expect(features.putRedirectionServiceXml).toBeTruthy()
    : expect(features.putRedirectionServiceXml).toBeFalsy()
  testMatrix.putIpsOptInServiceXml
    ? expect(features.putIpsOptInServiceXml).toBeTruthy()
    : expect(features.putIpsOptInServiceXml).toBeFalsy()
}

beforeAll(() => {
  clientId = uuid()
  profile = {
    profileName: 'acm',
    generateRandomPassword: false,
    activation: ClientAction.ADMINCTLMODE,
    ciraConfigName: 'config1',
    generateRandomMEBxPassword: false,
    userConsent: AMTUserConsent.ALL,
    solEnabled: true,
    iderEnabled: false,
    kvmEnabled: true
  }
  activationMsg = {
    method: 'activation',
    apiKey: 'key',
    appVersion: '1.2.0',
    protocolVersion: '4.0.0',
    status: 'ok',
    message: "all's good!",
    payload: {
      ver: '11.8.50',
      build: '3425',
      fqdn: 'vprodemo.com',
      password: 'KQGnH+N5qJ8YLqjEFJMnGSgcnFLMv0Tk',
      currentMode: 0,
      certHashes: [
        'e7685634efacf69ace939a6b255b7b4fabef42935b50a265acb5cb6027e44e70',
        'eb04cf5eb1f39afa762f2bb120f296cba520c1b97db1589565b81cb9a17b7244',
        'c3846bf24b9e93ca64274c0ec67c1ecc5e024ffcacd2d74019350e81fe546ae4',
        'd7a7a0fb5d7e2731d771e9484ebcdef71d5f0c3e0a2948782bc83ee0ea699ef4',
        '1465fa205397b876faa6f0a9958e5590e40fcc7faa4fb7c2c8677521fb5fb658',
        '83ce3c1229688a593d485f81973c0f9195431eda37cc5e36430e79c7a888638b',
        'a4b6b3996fc2f306b3fd8681bd63413d8c5009cc4fa329c2ccf0e2fa1b140305',
        '9acfab7e43c8d880d06b262a94deeee4b4659989c3d0caf19baf6405e41ab7df',
        'a53125188d2110aa964b02c7b7c6da3203170894e5fb71fffb6667d5e6810a36',
        '16af57a9f676b0ab126095aa5ebadef22ab31119d644ac95cd4b93dbf3f26aeb',
        '960adf0063e96356750c2965dd0a0867da0b9cbd6e77714aeafb2349ab393da3',
        '68ad50909b04363c605ef13581a939ff2c96372e3f12325b0a6861e1d59f6603',
        '6dc47172e01cbcb0bf62580d895fe2b8ac9ad4f873801e0c10b9c837d21eb177',
        '73c176434f1bc6d5adf45b0e76e727287c8de57616c1e6e6141a2b2cbc7d8e4c',
        '2399561127a57125de8cefea610ddf2fa078b5c8067f4e828290bfb860e84b3c',
        '45140b3247eb9cc8c5b4f0d7b53091f73292089e6e5a63e2749dd3aca9198eda',
        '43df5774b03e7fef5fe40d931a7bedf1bb2e6b42738c4e6d3841103d3aa7f339',
        '2ce1cb0bf9d2f9e102993fbe215152c3b2dd0cabde1c68e5319b839154dbb7f5',
        '70a73f7f376b60074248904534b11482d5bf0e698ecc498df52577ebf2e93b9a'
      ],
      sku: '16392',
      uuid: '4bac9510-04a6-4321-bae2-d45ddf07b684',
      username: '$$OsAdmin',
      client: 'PPC',
      profile: profile,
      action: ClientAction.ADMINCTLMODE
    }
  }
  const digestChallenge = {
    realm: 'Digest:AF541D9BC94CFF7ADFA073F492F355E6',
    nonce: 'dxNzCQ9JBAAAAAAAd2N7c6tYmUl0FFzQ',
    stale: 'false',
    qop: 'auth'
  }
  devices[clientId] = {
    unauthCount: 0,
    ClientId: clientId,
    ClientSocket: null,
    ClientData: activationMsg,
    features: {},
    status: {},
    uuid: activationMsg.payload.uuid,
    activationStatus: {},
    connectionParams: {
      guid: '4c4c4544-004b-4210-8033-b6c04f504633',
      port: 16992,
      digestChallenge: digestChallenge,
      username: 'admin',
      password: 'P@ssw0rd'
    },
    messageId: 1
  }
})

describe('testing execute', () => {
  let testMatrix: FeaturesTestMatrix
  let result: ClientMsg
  const onNextClientStateSpy: jest.SpyInstance = jest.spyOn(feturesConfigurator, 'onNextClientState')

  beforeEach(() => {
    setDefaultMessages()
    testMatrix = {
      AMT_RedirectionService: false,
      IPS_OptInService: false,
      CIM_KVMRedirectionSAP: false,
      transitionFromGetToSet: false,
      setRedirectionServiceXml: false,
      setKvmRedirectionSapXml: false,
      putRedirectionServiceXml: false,
      putIpsOptInServiceXml: false
    }
  })

  test('should complete happy path sequence', async () => {
    result = await feturesConfigurator.execute(null, clientId)
    confirmFeaturesFlowState(devices[clientId].features, testMatrix)
    expect(result.method).toBe('wsman')

    result = await feturesConfigurator.execute(getRedirectionSvcMsg, clientId)
    testMatrix.AMT_RedirectionService = true
    confirmFeaturesFlowState(devices[clientId].features, testMatrix)
    expect(result.method).toBe('wsman')

    result = await feturesConfigurator.execute(getIpsOptInSvcMsg, clientId)
    testMatrix.IPS_OptInService = true
    confirmFeaturesFlowState(devices[clientId].features, testMatrix)
    expect(result.method).toBe('wsman')

    result = await feturesConfigurator.execute(getKvmRedirectionSvcMsg, clientId)
    testMatrix.CIM_KVMRedirectionSAP = true
    testMatrix.setRedirectionServiceXml = true
    testMatrix.setKvmRedirectionSapXml = true
    testMatrix.putRedirectionServiceXml = true
    testMatrix.putIpsOptInServiceXml = true
    confirmFeaturesFlowState(devices[clientId].features, testMatrix)
    expect(result.method).toBe('wsman')

    result = await feturesConfigurator.execute(setRedirectionSvcMsg, clientId)
    testMatrix.setRedirectionServiceXml = false
    confirmFeaturesFlowState(devices[clientId].features, testMatrix)
    expect(result.method).toBe('wsman')

    result = await feturesConfigurator.execute(setKvmRedirectionSvcMsg, clientId)
    testMatrix.setKvmRedirectionSapXml = false
    confirmFeaturesFlowState(devices[clientId].features, testMatrix)
    expect(result.method).toBe('wsman')

    result = await feturesConfigurator.execute(putRedirectionSvcMsg, clientId)
    testMatrix.putRedirectionServiceXml = false
    confirmFeaturesFlowState(devices[clientId].features, testMatrix)
    expect(result.method).toBe('wsman')

    result = await feturesConfigurator.execute(putIpsOptInSvcMsg, clientId)
    testMatrix.putIpsOptInServiceXml = false
    confirmFeaturesFlowState(devices[clientId].features, testMatrix)
    expect(result).toBe(null)
    expect(onNextClientStateSpy).toHaveBeenCalled()
  })
  test('should call enterNextState early if no configuration changes', async () => {
    setDefaultResponses()
    amtRedirectionSvcJson.EnabledState = Common.Models.AMT_REDIRECTION_SERVICE_ENABLE_STATE.Enabled
    amtRedirectionSvcJson.ListenerEnabled = true
    ipsOptInsSvcJson.OptInRequired = 4294967295
    kvmRedirectionSvcJson.RequestedState = 2
    kvmRedirectionSvcJson.EnabledState = 2
    const features = devices[clientId].features
    features.AMT_RedirectionService = amtRedirectionSvcJson
    features.IPS_OptInService = ipsOptInsSvcJson
    features.CIM_KVMRedirectionSAP = kvmRedirectionSvcJson
    features.transitionFromGetToSet = true
    result = await feturesConfigurator.execute(null, clientId)
    testMatrix.AMT_RedirectionService = true
    testMatrix.IPS_OptInService = true
    testMatrix.CIM_KVMRedirectionSAP = true
    testMatrix.transitionFromGetToSet = false
    confirmFeaturesFlowState(devices[clientId].features, testMatrix)
    expect(result).toBeFalsy()
    expect(onNextClientStateSpy).toHaveBeenCalled()
  })
  test('should catch general and RPSErrors and return error message', async () => {
    jest
      .spyOn(feturesConfigurator, 'processWSManJsonResponse')
      .mockImplementation(() => {
        throw new Error('badness happened')
      })
    result = await feturesConfigurator.execute('XXuioEFOIn;lkjpio', clientId)
    expect(result.method).toBe('error')
    jest.clearAllMocks()
    jest
      .spyOn(feturesConfigurator, 'processWSManJsonResponse')
      .mockImplementation(() => {
        throw new RPSError('badness happened')
      })
    result = await feturesConfigurator.execute('XXuioEFOIn;lkjpio', clientId)
    expect(result.method).toBe('error')
    jest.clearAllMocks()
  })
})

describe('testing processWSManJsonResponse', () => {
  test('should throw error on status other than 200', async () => {
    const message = {
      payload: {
        statusCode: 400,
        body: {
          text: ''
        }
      }
    }
    expect(() => feturesConfigurator.processWSManJsonResponse(message, clientId)).toThrow()
  })
})

describe('testing enterNextClientState', () => {
  test('should get a good message and action', async () => {
    setDefaultResponses()
    const testString = 'this is the text string'
    const mockExecutor = {
      execute: jest.fn().mockResolvedValue({ message: testString })
    }
    Reflect.set(feturesConfigurator, 'nextClientAction', ClientAction.NETWORKCONFIG)
    Reflect.set(feturesConfigurator, 'nextClientExecutor', mockExecutor)
    devices[clientId].features.AMT_RedirectionService = amtRedirectionSvcJson
    devices[clientId].features.IPS_OptInService = ipsOptInsSvcJson
    devices[clientId].features.CIM_KVMRedirectionSAP = kvmRedirectionSvcJson
    const result = await feturesConfigurator.onNextClientState(clientId)
    expect(result.message).toEqual(testString)
  })
})

describe('testing onTransitionFromGetToSet', () => {
  let testMatrix: FeaturesTestMatrix
  let localProfile: any
  let features: FeaturesConfigFlow
  let xmlMsg: string

  beforeEach(() => {
    setDefaultResponses()
    amtRedirectionSvcJson.EnabledState = Common.Models.AMT_REDIRECTION_SERVICE_ENABLE_STATE.Enabled
    amtRedirectionSvcJson.ListenerEnabled = true
    ipsOptInsSvcJson.OptInRequired = 4294967295
    kvmRedirectionSvcJson.RequestedState = 2
    kvmRedirectionSvcJson.EnabledState = 2

    features = {
      AMT_RedirectionService: amtRedirectionSvcJson,
      IPS_OptInService: ipsOptInsSvcJson,
      CIM_KVMRedirectionSAP: kvmRedirectionSvcJson
    }
    // this is a simple object so spread syntax to copy is OK
    localProfile = { ...profile }
    testMatrix = {
      AMT_RedirectionService: true,
      IPS_OptInService: true,
      CIM_KVMRedirectionSAP: true,
      transitionFromGetToSet: false,
      setRedirectionServiceXml: false,
      setKvmRedirectionSapXml: false,
      putRedirectionServiceXml: false,
      putIpsOptInServiceXml: false
    }
  })

  test('should set amt features - no change', async () => {
    xmlMsg = feturesConfigurator.onTransitionFromGetToSet(features, localProfile)
    expect(xmlMsg).toBeFalsy()
    confirmFeaturesFlowState(features, testMatrix)
  })
  test('should set amt features - change user consent from all to kvm', async () => {
    localProfile.userConsent = AMTUserConsent.KVM
    xmlMsg = feturesConfigurator.onTransitionFromGetToSet(features, localProfile)
    expect(xmlMsg).toBeTruthy()
    testMatrix.putIpsOptInServiceXml = true
    confirmFeaturesFlowState(features, testMatrix)
  })
  test('should set amt features - disable SOL', async () => {
    localProfile.solEnabled = false
    xmlMsg = feturesConfigurator.onTransitionFromGetToSet(features, localProfile)
    expect(xmlMsg).toBeTruthy()
    testMatrix.setRedirectionServiceXml = true
    testMatrix.setKvmRedirectionSapXml = true
    testMatrix.putRedirectionServiceXml = true
    confirmFeaturesFlowState(features, testMatrix)
  })
  test('should set amt features - enable IDER', async () => {
    localProfile.iderEnabled = true
    xmlMsg = feturesConfigurator.onTransitionFromGetToSet(features, localProfile)
    expect(xmlMsg).toBeTruthy()
    testMatrix.setRedirectionServiceXml = true
    testMatrix.setKvmRedirectionSapXml = true
    testMatrix.putRedirectionServiceXml = true
    confirmFeaturesFlowState(features, testMatrix)
  })
  test('should set amt features - disable IDER', async () => {
    features.AMT_RedirectionService.EnabledState = Common.Models.AMT_REDIRECTION_SERVICE_ENABLE_STATE.Other
    features.AMT_RedirectionService.ListenerEnabled = false
    xmlMsg = feturesConfigurator.onTransitionFromGetToSet(features, localProfile)
    expect(xmlMsg).toBeTruthy()
    testMatrix.setRedirectionServiceXml = true
    testMatrix.setKvmRedirectionSapXml = true
    testMatrix.putRedirectionServiceXml = true
    confirmFeaturesFlowState(features, testMatrix)
  })
  test('should set amt features - disable KVM', async () => {
    localProfile.kvmEnabled = false
    xmlMsg = feturesConfigurator.onTransitionFromGetToSet(features, localProfile)
    expect(xmlMsg).toBeTruthy()
    testMatrix.setRedirectionServiceXml = true
    testMatrix.setKvmRedirectionSapXml = true
    testMatrix.putRedirectionServiceXml = true
    confirmFeaturesFlowState(features, testMatrix)
  })
  test('should set amt features - disable all', async () => {
    features.AMT_RedirectionService.EnabledState = Common.Models.AMT_REDIRECTION_SERVICE_ENABLE_STATE.Disabled
    features.AMT_RedirectionService.ListenerEnabled = false
    localProfile.solEnabled = false
    localProfile.iderEnabled = false
    localProfile.kvmEnabled = false
    xmlMsg = feturesConfigurator.onTransitionFromGetToSet(features, localProfile)
    expect(xmlMsg).toBeTruthy()
    testMatrix.setRedirectionServiceXml = true
    testMatrix.setKvmRedirectionSapXml = true
    testMatrix.putRedirectionServiceXml = true
    confirmFeaturesFlowState(features, testMatrix)
  })
  test('should set amt features - enable SOL and IDER', async () => {
    amtRedirectionSvcJson.ListenerEnabled = false
    localProfile.iderEnabled = true
    xmlMsg = feturesConfigurator.onTransitionFromGetToSet(features, localProfile)
    expect(xmlMsg).toBeTruthy()
    testMatrix.setRedirectionServiceXml = true
    testMatrix.setKvmRedirectionSapXml = true
    testMatrix.putRedirectionServiceXml = true
    confirmFeaturesFlowState(features, testMatrix)
  })

  // it('should set amt features - and fail', async () => {
  //   redirectionSpy.mockRejectedValue({})
  //   await setAMTFeatures(req, resSpy)
  //   expect(resSpy.status).toHaveBeenCalledWith(500)
  //   expect(resSpy.json).toHaveBeenCalled()
  //   expect(mqttSpy).toHaveBeenCalled()
  // })
})

function setDefaultResponses (): void {
  amtRedirectionSvcJson = {
    CreationClassName: 'AMT_RedirectionService',
    ElementName: 'Intel(r) AMT Redirection Service',
    EnabledState: 32771,
    ListenerEnabled: false,
    Name: 'Intel(r) AMT Redirection Service',
    SystemCreationClassName: 'CIM_ComputerSystem',
    SystemName: 'Intel(r) AMT'
  }
  ipsOptInsSvcJson = {
    CanModifyOptInPolicy: 1,
    CreationClassName: 'IPS_OptInService',
    ElementName: 'Intel(r) AMT OptIn Service',
    Name: 'Intel(r) AMT OptIn Service',
    OptInCodeTimeout: 120,
    OptInDisplayTimeout: 300,
    OptInRequired: 1,
    OptInState: 0,
    SystemCreationClassName: 'CIM_ComputerSystem',
    SystemName: 'Intel(r) AMT'
  }
  kvmRedirectionSvcJson = {
    CreationClassName: 'CIM_KVMRedirectionSAP',
    ElementName: 'KVM Redirection Service Access Point',
    EnabledState: 3,
    KVMProtocol: 4,
    Name: 'KVM Redirection Service Access Point',
    RequestedState: 5,
    SystemCreationClassName: 'CIM_ComputerSystem',
    SystemName: 'ManagedSystem'
  }
}

function setDefaultMessages (): void {
  getRedirectionSvcMsg = {
    payload: {
      statusCode: 200,
      body: {
        text: '0220\r\n' +
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<a:Envelope ' +
          'xmlns:a="http://www.w3.org/2003/05/soap-envelope" ' +
          'xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" ' +
          'xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" ' +
          'xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" ' +
          'xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" ' +
          'xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" ' +
          'xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RedirectionService" ' +
          'xmlns:h="http://schemas.dmtf.org/wbem/wscim/\r\n' + '02FA\r\n' + '1/common" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
          '<a:Header>' +
          '<b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To>' +
          '<b:RelatesTo>0</b:RelatesTo>' +
          '<b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse</b:Action>' +
          '<b:MessageID>uuid:00000000-8086-8086-8086-000000022877</b:MessageID>' +
          '<c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RedirectionService</c:ResourceURI>' +
          '</a:Header>' +
          '<a:Body>' +
          '<g:AMT_RedirectionService>' +
          '<g:CreationClassName>AMT_RedirectionService</g:CreationClassName>' +
          '<g:ElementName>Intel(r) AMT Redirection Service</g:ElementName>' +
          '<g:EnabledState>32771</g:EnabledState>' +
          '<g:ListenerEnabled>true</g:ListenerEnabled>' +
          '<g:Name>Intel(r) AMT Redirection Service</g:Name>' +
          '<g:SystemCreat\r\n' + '0095\r\n' + 'ionClassName>CIM_ComputerSystem</g:SystemCreationClassName>' +
          '<g:SystemName>Intel(r) AMT</g:SystemName>' +
          '</g:AMT_RedirectionService>' +
          '</a:Body>' +
          '</a:Envelope>\r\n' +
          '0\r\n'
      }
    }
  }
  getIpsOptInSvcMsg = {
    payload: {
      statusCode: 200,
      body: {
        text: '0220\r\n' +
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<a:Envelope ' +
          'xmlns:a="http://www.w3.org/2003/05/soap-envelope"  ' +
          'xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" ' +
          'xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" ' +
          'xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" ' +
          'xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" ' +
          'xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" ' +
          'xmlns:g="http://intel.com/wbem/wscim/1/ips-schema/1/IPS_OptInService" ' +
          'xmlns:h="http://schemas.dmtf.org/wbem/wscim/1/comm\r\n' + '02FA\r\n' + 'on" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
          '<a:Header>' +
          '<b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To>' +
          '<b:RelatesTo>0</b:RelatesTo>' +
          '<b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse</b:Action>' +
          '<b:MessageID>uuid:00000000-8086-8086-8086-000000023706</b:MessageID>' +
          '<c:ResourceURI>http://intel.com/wbem/wscim/1/ips-schema/1/IPS_OptInService</c:ResourceURI>' +
          '</a:Header>' +
          '<a:Body>' +
          '<g:IPS_OptInService>' +
          '<g:CanModifyOptInPolicy>1</g:CanModifyOptInPolicy>' +
          '<g:CreationClassName>IPS_OptInService</g:CreationClassName>' +
          '<g:ElementName>Intel(r) AMT OptIn Service</g:ElementName>' +
          '<g:Name>Intel(r) AMT OptIn Service</g:Name>' +
          '<g:OptInCodeTimeout>120</g:OptInCodeTimeout>' +
          '<g:OptInDisplayTimeout>300' +
          '</g:OptInDi\r\n' + '00EC\r\n' + 'splayTimeout>' +
          '<g:OptInRequired>1</g:OptInRequired><g:OptInState>0</g:OptInState>' +
          '<g:SystemCreationClassName>CIM_ComputerSystem</g:SystemCreationClassName>' +
          '<g:SystemName>Intel(r) AMT</g:SystemName>' +
          '</g:IPS_OptInService>' +
          '</a:Body>' +
          '</a:Envelope>\r\n' +
          '0'
      }
    }
  }
  getKvmRedirectionSvcMsg = {
    payload: {
      statusCode: 200,
      body: {
        text: '0220\r\n' +
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<a:Envelope ' +
          'xmlns:a="http://www.w3.org/2003/05/soap-envelope" ' +
          'xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" ' +
          'xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" ' +
          'xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" ' +
          'xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" ' +
          'xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" ' +
          'xmlns:g="http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_KVMRedirectionSAP" ' +
          'xmlns:h="http://schemas.dmtf.org/wbem/\r\n' +
          '02FA\r\n' +
          'wscim/1/common" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
          '<a:Header>' +
          '<b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To>' +
          '<b:RelatesTo>0</b:RelatesTo>' +
          '<b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse</b:Action>' +
          '<b:MessageID>uuid:00000000-8086-8086-8086-000000023709</b:MessageID>' +
          '<c:ResourceURI>http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_KVMRedirectionSAP</c:ResourceURI>' +
          '</a:Header>' +
          '<a:Body>' +
          '<g:CIM_KVMRedirectionSAP>' +
          '<g:CreationClassName>CIM_KVMRedirectionSAP</g:CreationClassName>' +
          '<g:ElementName>KVM Redirection Service Access Point</g:ElementName>' +
          '<g:EnabledState>6</g:EnabledState>' +
          '<g:KVMProtocol>4</g:KVMProtocol>' +
          '<g:Name>KVM Redirection Service Access Point</g:Name>' +
          '<g:Requeste\r\n' +
          '00BE\r\n' +
          'dState>2</g:RequestedState>' +
          '<g:SystemCreationClassName>CIM_ComputerSystem</g:SystemCreationClassName>' +
          '<g:SystemName>ManagedSystem</g:SystemName>' +
          '</g:CIM_KVMRedirectionSAP>' +
          '</a:Body>' +
          '</a:Envelope>\r\n' +
          '0'
      }
    }
  }
  setRedirectionSvcMsg = {
    payload: {
      statusCode: 200,
      body: {
        text: '0220\r\n' +
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<a:Envelope ' +
          'xmlns:a="http://www.w3.org/2003/05/soap-envelope" ' +
          'xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" ' +
          'xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" ' +
          'xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" ' +
          'xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" ' +
          'xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" ' +
          'xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RedirectionService" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-\r\n' + '022D\r\n' + 'instance">' +
          '<a:Header>' +
          '<b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To>' +
          '<b:RelatesTo>1</b:RelatesTo>' +
          '<b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RedirectionService/RequestStateChangeResponse</b:Action>' +
          '<b:MessageID>uuid:00000000-8086-8086-8086-000000023CA2</b:MessageID>' +
          '<c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RedirectionService</c:ResourceURI>' +
          '</a:Header>' +
          '<a:Body>' +
          '<g:RequestStateChange_OUTPUT>' +
          '<g:ReturnValue>0</g:ReturnValue>' +
          '</g:RequestStateChange_OUTPUT>' +
          '</a:Body>' +
          '</a:Envelope>\r\n' +
          '0'
      }
    }
  }
  setKvmRedirectionSvcMsg = {
    payload: {
      statusCode: 200,
      body: {
        text: '0220\r\n' +
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<a:Envelope ' +
          'xmlns:a="http://www.w3.org/2003/05/soap-envelope" ' +
          'xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" ' +
          'xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" ' +
          'xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" ' +
          'xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" ' +
          'xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" ' +
          'xmlns:g="http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_KVMRedirectionSAP" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLS\r\n' + '023F\r\n' + 'chema-instance">' +
          '<a:Header>' +
          '<b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To>' +
          '<b:RelatesTo>1</b:RelatesTo>' +
          '<b:Action a:mustUnderstand="true">http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_KVMRedirectionSAP/RequestStateChangeResponse</b:Action>' +
          '<b:MessageID>uuid:00000000-8086-8086-8086-000000023CA4</b:MessageID>' +
          '<c:ResourceURI>http://schemas.dmtf.org/wbem/wscim/1/cim-schema/2/CIM_KVMRedirectionSAP</c:ResourceURI>' +
          '</a:Header>' +
          '<a:Body>' +
          '<g:RequestStateChange_OUTPUT>' +
          '<g:ReturnValue>0</g:ReturnValue>' +
          '</g:RequestStateChange_OUTPUT>' +
          '</a:Body>' +
          '</a:Envelope>\r\n' +
          '0'
      }
    }
  }
  putRedirectionSvcMsg = {
    payload: {
      statusCode: 200,
      body: {
        text: '0220\r\n' +
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<a:Envelope ' +
          'xmlns:a="http://www.w3.org/2003/05/soap-envelope" ' +
          'xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" ' +
          'xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" ' +
          'xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" ' +
          'xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" ' +
          'xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" ' +
          'xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RedirectionService" ' +
          'xmlns:h="http://schemas.dmtf.org/wbem/wscim/\r\n' + '02FA\r\n' + '1/common" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
          '<a:Header>' +
          '<b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To>' +
          '<b:RelatesTo>2</b:RelatesTo>' +
          '<b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/09/transfer/PutResponse</b:Action>' +
          '<b:MessageID>uuid:00000000-8086-8086-8086-000000023CA5</b:MessageID>' +
          '<c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RedirectionService</c:ResourceURI>' +
          '</a:Header>' +
          '<a:Body>' +
          '<g:AMT_RedirectionService>' +
          '<g:CreationClassName>AMT_RedirectionService</g:CreationClassName>' +
          '<g:ElementName>Intel(r) AMT Redirection Service</g:ElementName>' +
          '<g:EnabledState>32770</g:EnabledState>' +
          '<g:ListenerEnabled>true</g:ListenerEnabled>' +
          '<g:Name>Intel(r) AMT Redirection Service</g:Name>' +
          '<g:SystemCreat\r\n' + '0095\r\n' + 'ionClassName>CIM_ComputerSystem</g:SystemCreationClassName>' +
          '<g:SystemName>Intel(r) AMT</g:SystemName>' +
          '</g:AMT_RedirectionService>' +
          '</a:Body>' +
          '</a:Envelope>\r\n' +
          '0'
      }
    }
  }
  putIpsOptInSvcMsg = {
    payload: {
      statusCode: 200,
      body: {
        text: '0220\r\n' +
          '<?xml version="1.0" encoding="UTF-8"?>' +
          '<a:Envelope ' +
          'xmlns:a="http://www.w3.org/2003/05/soap-envelope" ' +
          'xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" ' +
          'xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" ' +
          'xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" ' +
          'xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" ' +
          'xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" ' +
          'xmlns:g="http://intel.com/wbem/wscim/1/ips-schema/1/IPS_OptInService" ' +
          'xmlns:h="http://schemas.dmtf.org/wbem/wscim/1/comm\r\n' + '02FA\r\n' + 'on" ' +
          'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">' +
          '<a:Header>' +
          '<b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To>' +
          '<b:RelatesTo>1</b:RelatesTo>' +
          '<b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/09/transfer/PutResponse</b:Action>' +
          '<b:MessageID>uuid:00000000-8086-8086-8086-000000023C0C</b:MessageID>' +
          '<c:ResourceURI>http://intel.com/wbem/wscim/1/ips-schema/1/IPS_OptInService</c:ResourceURI>' +
          '</a:Header>' +
          '<a:Body>' +
          '<g:IPS_OptInService>' +
          '<g:CanModifyOptInPolicy>1</g:CanModifyOptInPolicy>' +
          '<g:CreationClassName>IPS_OptInService</g:CreationClassName>' +
          '<g:ElementName>Intel(r) AMT OptIn Service</g:ElementName>' +
          '<g:Name>Intel(r) AMT OptIn Service</g:Name>' +
          '<g:OptInCodeTimeout>120</g:OptInCodeTimeout>' +
          '<g:OptInDisplayTimeout>300</g:OptInDi\r\n' + '00F5\r\n' + 'splayTimeout>' +
          '<g:OptInRequired>4294967295</g:OptInRequired>' +
          '<g:OptInState>0</g:OptInState>' +
          '<g:SystemCreationClassName>CIM_ComputerSystem</g:SystemCreationClassName>' +
          '<g:SystemName>Intel(r) AMT</g:SystemName>' +
          '</g:IPS_OptInService>' +
          '</a:Body>' +
          '</a:Envelope>\r\n' +
          '0'
      }
    }
  }
}
