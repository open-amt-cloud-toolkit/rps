import { FeaturesConfiguration } from './featuresConfiguration'
import { ClientAction } from '../models/RCS.Config'
import { AMTRedirectionServiceEnabledStates, AMTUserConsent, AMTUserConsentValues } from '../models'
import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'
import { waitFor } from 'xstate/lib/waitFor'

let clientId
let amtCfgProfile
let featuresCfg
let deviceGetAmtRedirectionSvcRsp
let deviceGetIpsOptInSvcRsp
let deviceGetCimKvmRedirectionSapRsp
let deviceSetRedirectionSvcRsp
let deviceSetKvmRedirectionSvcRsp
let devicePutRedirectionSvcRsp
let devicePutIpsOptInSvcRsp
let amtRedirectionSvcJson
let ipsOptInsSvcJson
let kvmRedirectionSvcJson
let wrapItSpy
let sendSpy
let responseMessageSpy
let service

beforeEach(() => {
  clientId = uuid()
  devices[clientId] = {
    unauthCount: 0,
    ClientId: clientId,
    ClientSocket: { send: jest.fn() } as any,
    ClientData: {},
    status: {},
    uuid: '4bac9510-04a6-4321-bae2-d45ddf07b684',
    activationStatus: {},
    connectionParams: {
      guid: '4c4c4544-004b-4210-8033-b6c04f504633',
      port: 16992,
      digestChallenge: {
        realm: 'Digest:AF541D9BC94CFF7ADFA073F492F355E6',
        nonce: 'dxNzCQ9JBAAAAAAAd2N7c6tYmUl0FFzQ',
        stale: 'false',
        qop: 'auth'
      },
      username: 'admin',
      password: 'P@ssw0rd'
    },
    messageId: 1
  }
  amtCfgProfile = {
    profileName: 'test-',
    activation: ClientAction.ADMINCTLMODE,
    userConsent: AMTUserConsent.ALL,
    solEnabled: true,
    iderEnabled: true,
    kvmEnabled: true,
    generateRandomPassword: false,
    generateRandomMEBxPassword: false,
    ciraConfigName: 'config1'
  }
  setDefaultMessages()
  setDefaultResponses()
  featuresCfg = new FeaturesConfiguration(clientId, amtCfgProfile)
  wrapItSpy = jest.spyOn(featuresCfg.httpHandler, 'wrapIt')
  responseMessageSpy = jest.spyOn(featuresCfg.clientMsgBuilder, 'get')
  sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send').mockImplementation().mockReturnValue()
  service = featuresCfg.service
  // helpful for debugging
  // service.onTransition((state) => {
  //   console.log(`onTransition: state: ${JSON.stringify(state.value)}`)
  // }).onChange((data) => {
  //   console.log(`onChange: ${JSON.stringify(data, null, 2)}`)
  // }).onDone((data) => {
  //   console.log(`onDone: ${JSON.stringify(data, null, 2)}`)
  // }).onEvent((event) => {
  //   console.log(`onEvent: ${JSON.stringify(event, null, 2)}`)
  // })
})

it('should work for the happy path', async () => {
  expect(featuresCfg.machine.id).toEqual('features-configuration-fsm')
  service.start()
  const clientObj = devices[clientId]
  await waitFor(service, (state) => state.matches('GET_AMT_REDIRECTION_SERVICE'))
  expect(wrapItSpy).toHaveBeenCalled()
  expect(responseMessageSpy).toHaveBeenCalled()
  expect(sendSpy).toHaveBeenCalled()
  expect(clientObj.pendingPromise).toBeDefined()
  clientObj.resolve(deviceGetAmtRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_IPS_OPT_IN_SERVICE'))
  clientObj.resolve(deviceGetIpsOptInSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_CIM_KVM_REDIRECTION_SAP'))
  clientObj.resolve(deviceGetCimKvmRedirectionSapRsp.payload)
  await waitFor(service, (state) => state.matches('SET_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceSetRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('SET_KVM_REDIRECTION_SAP'))
  clientObj.resolve(deviceSetKvmRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('PUT_REDIRECTION_SERVICE'))
  clientObj.resolve(devicePutRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('PUT_IPS_OPT_IN_SERVICE'))
  clientObj.resolve(devicePutIpsOptInSvcRsp.payload)
  await waitFor(service, (state) => state.matches('SUCCESS'))
})

it('should set redirection - enable the listener', async () => {
  amtRedirectionSvcJson.ListenerEnabled = false
  jest.spyOn(featuresCfg.httpHandler, 'parseXML')
    .mockReturnValueOnce({ Envelope: { Body: { AMT_RedirectionService: amtRedirectionSvcJson } } })
    .mockReturnValueOnce({ Envelope: { Body: { IPS_OptInService: ipsOptInsSvcJson } } })
    .mockReturnValueOnce({ Envelope: { Body: { CIM_KVMRedirectionSAP: kvmRedirectionSvcJson } } })
  service.start()
  const clientObj = devices[clientId]
  await waitFor(service, (state) => state.matches('GET_AMT_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceGetAmtRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_IPS_OPT_IN_SERVICE'))
  clientObj.resolve(deviceGetIpsOptInSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_CIM_KVM_REDIRECTION_SAP'))
  clientObj.resolve(deviceGetCimKvmRedirectionSapRsp.payload)
  await waitFor(service, (state) => state.matches('SET_REDIRECTION_SERVICE'))
  // just error out now to finish the state machine
  clientObj.reject('some fake error for test coverage')
  await waitFor(service, (state) => state.matches('FAILED'))
})

it('should set redirection - ONLY_IDER', async () => {
  amtCfgProfile.solEnabled = false
  amtRedirectionSvcJson.EnabledState = AMTRedirectionServiceEnabledStates.ONLY_IDER
  jest.spyOn(featuresCfg.httpHandler, 'parseXML')
    .mockReturnValueOnce({ Envelope: { Body: { AMT_RedirectionService: amtRedirectionSvcJson } } })
    .mockReturnValueOnce({ Envelope: { Body: { IPS_OptInService: ipsOptInsSvcJson } } })
    .mockReturnValueOnce({ Envelope: { Body: { CIM_KVMRedirectionSAP: kvmRedirectionSvcJson } } })
  service.start()
  const clientObj = devices[clientId]
  await waitFor(service, (state) => state.matches('GET_AMT_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceGetAmtRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_IPS_OPT_IN_SERVICE'))
  clientObj.resolve(deviceGetIpsOptInSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_CIM_KVM_REDIRECTION_SAP'))
  clientObj.resolve(deviceGetCimKvmRedirectionSapRsp.payload)
  await waitFor(service, (state) => state.matches('SET_REDIRECTION_SERVICE'))
  // just error out now to finish the state machine
  clientObj.reject('some fake error for test coverage')
  await waitFor(service, (state) => state.matches('FAILED'))
})

it('should set redirection - ONLY_SOL', async () => {
  amtCfgProfile.iderEnabled = false
  amtRedirectionSvcJson.EnabledState = AMTRedirectionServiceEnabledStates.ONLY_SOL
  jest.spyOn(featuresCfg.httpHandler, 'parseXML')
    .mockReturnValueOnce({ Envelope: { Body: { AMT_RedirectionService: amtRedirectionSvcJson } } })
    .mockReturnValueOnce({ Envelope: { Body: { IPS_OptInService: ipsOptInsSvcJson } } })
    .mockReturnValueOnce({ Envelope: { Body: { CIM_KVMRedirectionSAP: kvmRedirectionSvcJson } } })
  service.start()
  const clientObj = devices[clientId]
  await waitFor(service, (state) => state.matches('GET_AMT_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceGetAmtRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_IPS_OPT_IN_SERVICE'))
  clientObj.resolve(deviceGetIpsOptInSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_CIM_KVM_REDIRECTION_SAP'))
  clientObj.resolve(deviceGetCimKvmRedirectionSapRsp.payload)
  await waitFor(service, (state) => state.matches('SET_REDIRECTION_SERVICE'))
  // just error out now to finish the state machine
  clientObj.reject('some fake error for test coverage')
  await waitFor(service, (state) => state.matches('FAILED'))
})

it('should skip redirect and update opt in', async () => {
  amtRedirectionSvcJson.EnabledState = AMTRedirectionServiceEnabledStates.BOTH_IDER_SOL
  amtRedirectionSvcJson.ListenerEnabled = true
  kvmRedirectionSvcJson.RequestedState = 2
  kvmRedirectionSvcJson.EnabledState = 2
  // ipsOptInsSvcJson.OptInRequired = AMTUserConsentValues.NONE
  jest.spyOn(featuresCfg.httpHandler, 'parseXML')
    .mockReturnValueOnce({ Envelope: { Body: { AMT_RedirectionService: amtRedirectionSvcJson } } })
    .mockReturnValueOnce({ Envelope: { Body: { IPS_OptInService: ipsOptInsSvcJson } } })
    .mockReturnValueOnce({ Envelope: { Body: { CIM_KVMRedirectionSAP: kvmRedirectionSvcJson } } })
  expect(featuresCfg.machine.id).toEqual('features-configuration-fsm')
  service.start()
  const clientObj = devices[clientId]
  await waitFor(service, (state) => state.matches('GET_AMT_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceGetAmtRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_IPS_OPT_IN_SERVICE'))
  clientObj.resolve(deviceGetIpsOptInSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_CIM_KVM_REDIRECTION_SAP'))
  clientObj.resolve(deviceGetCimKvmRedirectionSapRsp.payload)
  await waitFor(service, (state) => state.matches('PUT_IPS_OPT_IN_SERVICE'))
  clientObj.resolve(devicePutIpsOptInSvcRsp.payload)
  await waitFor(service, (state) => state.matches('SUCCESS'))
})

it('should not update features and skip to success', async () => {
  amtRedirectionSvcJson.EnabledState = AMTRedirectionServiceEnabledStates.BOTH_IDER_SOL
  amtRedirectionSvcJson.ListenerEnabled = true
  ipsOptInsSvcJson.OptInRequired = AMTUserConsentValues.ALL
  kvmRedirectionSvcJson.RequestedState = 2
  kvmRedirectionSvcJson.EnabledState = 2
  jest.spyOn(featuresCfg.httpHandler, 'parseXML')
    .mockReturnValueOnce({ Envelope: { Body: { AMT_RedirectionService: amtRedirectionSvcJson } } })
    .mockReturnValueOnce({ Envelope: { Body: { IPS_OptInService: ipsOptInsSvcJson } } })
    .mockReturnValueOnce({ Envelope: { Body: { CIM_KVMRedirectionSAP: kvmRedirectionSvcJson } } })
  expect(featuresCfg.machine.id).toEqual('features-configuration-fsm')
  service.start()
  const clientObj = devices[clientId]
  await waitFor(service, (state) => state.matches('GET_AMT_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceGetAmtRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_IPS_OPT_IN_SERVICE'))
  clientObj.resolve(deviceGetIpsOptInSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_CIM_KVM_REDIRECTION_SAP'))
  clientObj.resolve(deviceGetCimKvmRedirectionSapRsp.payload)
  await waitFor(service, (state) => state.matches('SUCCESS'))
})

it('should fail GET_AMT_REDIRECTION_SERVICE', async () => {
  expect(featuresCfg.machine.id).toEqual('features-configuration-fsm')
  service.start()
  const clientObj = devices[clientId]
  await waitFor(service, (state) => state.matches('GET_AMT_REDIRECTION_SERVICE'))
  clientObj.reject('some fake error for test coverage')
  await waitFor(service, (state) => state.matches('FAILED'))
})

it('should fail GET_IPS_OPT_IN_SERVICE', async () => {
  expect(featuresCfg.machine.id).toEqual('features-configuration-fsm')
  service.start()
  const clientObj = devices[clientId]
  await waitFor(service, (state) => state.matches('GET_AMT_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceGetAmtRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_IPS_OPT_IN_SERVICE'))
  clientObj.reject('some fake error for test coverage')
  await waitFor(service, (state) => state.matches('FAILED'))
})

it('should fail GET_CIM_KVM_REDIRECTION_SAP', async () => {
  expect(featuresCfg.machine.id).toEqual('features-configuration-fsm')
  service.start()
  const clientObj = devices[clientId]
  await waitFor(service, (state) => state.matches('GET_AMT_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceGetAmtRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_IPS_OPT_IN_SERVICE'))
  clientObj.resolve(deviceGetIpsOptInSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_CIM_KVM_REDIRECTION_SAP'))
  clientObj.reject('some fake error for test coverage')
  await waitFor(service, (state) => state.matches('FAILED'))
})

it('should fail SET_REDIRECTION_SERVICE', async () => {
  expect(featuresCfg.machine.id).toEqual('features-configuration-fsm')
  service.start()
  const clientObj = devices[clientId]
  await waitFor(service, (state) => state.matches('GET_AMT_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceGetAmtRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_IPS_OPT_IN_SERVICE'))
  clientObj.resolve(deviceGetIpsOptInSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_CIM_KVM_REDIRECTION_SAP'))
  clientObj.resolve(deviceGetCimKvmRedirectionSapRsp.payload)
  await waitFor(service, (state) => state.matches('SET_REDIRECTION_SERVICE'))
  clientObj.reject('some fake error for test coverage')
  await waitFor(service, (state) => state.matches('FAILED'))
})

it('should fail SET_KVM_REDIRECTION_SAP', async () => {
  expect(featuresCfg.machine.id).toEqual('features-configuration-fsm')
  service.start()
  const clientObj = devices[clientId]
  await waitFor(service, (state) => state.matches('GET_AMT_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceGetAmtRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_IPS_OPT_IN_SERVICE'))
  clientObj.resolve(deviceGetIpsOptInSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_CIM_KVM_REDIRECTION_SAP'))
  clientObj.resolve(deviceGetCimKvmRedirectionSapRsp.payload)
  await waitFor(service, (state) => state.matches('SET_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceSetRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('SET_KVM_REDIRECTION_SAP'))
  clientObj.reject('some fake error for test coverage')
  await waitFor(service, (state) => state.matches('FAILED'))
})

it('should fail PUT_REDIRECTION_SERVICE', async () => {
  expect(featuresCfg.machine.id).toEqual('features-configuration-fsm')
  service.start()
  const clientObj = devices[clientId]
  await waitFor(service, (state) => state.matches('GET_AMT_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceGetAmtRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_IPS_OPT_IN_SERVICE'))
  clientObj.resolve(deviceGetIpsOptInSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_CIM_KVM_REDIRECTION_SAP'))
  clientObj.resolve(deviceGetCimKvmRedirectionSapRsp.payload)
  await waitFor(service, (state) => state.matches('SET_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceSetRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('SET_KVM_REDIRECTION_SAP'))
  clientObj.resolve(deviceSetKvmRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('PUT_REDIRECTION_SERVICE'))
  clientObj.reject('some fake error for test coverage')
  await waitFor(service, (state) => state.matches('FAILED'))
})

it('should fail PUT_IPS_OPT_IN_SERVICE', async () => {
  expect(featuresCfg.machine.id).toEqual('features-configuration-fsm')
  service.start()
  const clientObj = devices[clientId]
  await waitFor(service, (state) => state.matches('GET_AMT_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceGetAmtRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_IPS_OPT_IN_SERVICE'))
  clientObj.resolve(deviceGetIpsOptInSvcRsp.payload)
  await waitFor(service, (state) => state.matches('GET_CIM_KVM_REDIRECTION_SAP'))
  clientObj.resolve(deviceGetCimKvmRedirectionSapRsp.payload)
  await waitFor(service, (state) => state.matches('SET_REDIRECTION_SERVICE'))
  clientObj.resolve(deviceSetRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('SET_KVM_REDIRECTION_SAP'))
  clientObj.resolve(deviceSetKvmRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('PUT_REDIRECTION_SERVICE'))
  clientObj.resolve(devicePutRedirectionSvcRsp.payload)
  await waitFor(service, (state) => state.matches('PUT_IPS_OPT_IN_SERVICE'))
  clientObj.reject('some fake error for test coverage')
  await waitFor(service, (state) => state.matches('FAILED'))
})

function setDefaultResponses (): void {
  amtRedirectionSvcJson = {
    CreationClassName: 'AMT_RedirectionService',
    ElementName: 'Intel(r) AMT Redirection Service',
    EnabledState: AMTRedirectionServiceEnabledStates.BOTH_IDER_SOL,
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
    OptInRequired: AMTUserConsentValues.KVM,
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
  deviceGetAmtRedirectionSvcRsp = {
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
          `<g:EnabledState>${AMTRedirectionServiceEnabledStates.DISABLED}</g:EnabledState>` +
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
  deviceGetIpsOptInSvcRsp = {
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
          `<g:OptInRequired>${AMTUserConsentValues.KVM}</g:OptInRequired>` +
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
  deviceGetCimKvmRedirectionSapRsp = {
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
          '<g:EnabledState>3</g:EnabledState>' +
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
  deviceSetRedirectionSvcRsp = {
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
  deviceSetKvmRedirectionSvcRsp = {
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
  devicePutRedirectionSvcRsp = {
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
          `<g:EnabledState>${AMTRedirectionServiceEnabledStates.BOTH_IDER_SOL}</g:EnabledState>` +
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
  devicePutIpsOptInSvcRsp = {
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
          `<g:OptInRequired>${AMTUserConsentValues.ALL}</g:OptInRequired>` +
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
