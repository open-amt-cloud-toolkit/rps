/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { FeatureContext, FeaturesConfiguration } from './featuresConfiguration'
import { ClientAction } from '../models/RCS.Config'
import { AMTConfiguration, AMTRedirectionServiceEnabledStates, AMTUserConsent, AMTUserConsentValues } from '../models'
import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'
import { HttpHandler } from '../HttpHandler'
import { interpret } from 'xstate'
import { AMT, CIM, IPS } from '@open-amt-cloud-toolkit/wsman-messages'
import * as common from './common'
describe('Features State Machine', () => {
  let clientId: string
  let amtConfiguration: AMTConfiguration
  let featuresConfiguration: FeaturesConfiguration
  let amtRedirectionSvcJson
  let ipsOptInsSvcJson
  let kvmRedirectionSvcJson
  let currentStateIndex: number = 0
  let machineConfig
  let context: FeatureContext
  let invokeSpy: jest.SpyInstance
  beforeEach(() => {
    clientId = uuid()
    devices[clientId] = {
      unauthCount: 0,
      ClientId: clientId,
      ClientSocket: { send: jest.fn() } as any,
      ClientData: {},
      status: {},
      uuid: '4bac9510-04a6-4321-bae2-d45ddf07b684',
      activationStatus: false,
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
    const promise = new Promise((resolve, reject) => {
      devices[clientId].resolve = resolve
      devices[clientId].reject = reject
    })
    devices[clientId].pendingPromise = promise

    amtConfiguration = {
      profileName: 'test-',
      activation: ClientAction.ADMINCTLMODE,
      userConsent: AMTUserConsent.ALL,
      solEnabled: true,
      iderEnabled: true,
      kvmEnabled: true,
      generateRandomPassword: false,
      generateRandomMEBxPassword: false,
      ciraConfigName: 'config1',
      tenantId: ''
    }
    setDefaultResponses()
    context = {
      clientId,
      amtConfiguration: amtConfiguration,
      httpHandler: new HttpHandler(),
      statusMessage: '',
      xmlMessage: '',
      isOptInServiceChanged: false,
      isRedirectionChanged: false,
      amt: new AMT.Messages(),
      cim: new CIM.Messages(),
      ips: new IPS.Messages()
    }
    featuresConfiguration = new FeaturesConfiguration()
    invokeSpy = jest.spyOn(common, 'invokeWsmanCall').mockResolvedValue()
    currentStateIndex = 0
    machineConfig = {
      services: {
        'get-amt-redirection-service': Promise.resolve({ Envelope: { Body: { AMT_RedirectionService: amtRedirectionSvcJson } } }),
        'get-ips-opt-in-service': Promise.resolve({ Envelope: { Body: { IPS_OptInService: ipsOptInsSvcJson } } }),
        'get-cim-kvm-redirection-sap': Promise.resolve({ Envelope: { Body: { CIM_KVMRedirectionSAP: kvmRedirectionSvcJson } } }),
        'compute-updates': Promise.resolve({ clientId }),
        'set-redirection-service': Promise.resolve({ clientId }),
        'set-kvm-redirection-sap': Promise.resolve({ clientId }),
        'put-redirection-service': Promise.resolve({ clientId }),
        'put-ips-opt-in-service': Promise.resolve({ clientId })
      },
      actions: {}
    }
  })

  it('Should configure AMT features when default', (done) => {
    const mockFeaturesMachine = featuresConfiguration.machine.withConfig(machineConfig).withContext(context)
    const flowStates = [
      'DEFAULT_FEATURES',
      'GET_AMT_REDIRECTION_SERVICE',
      'GET_IPS_OPT_IN_SERVICE',
      'GET_CIM_KVM_REDIRECTION_SAP',
      'SET_REDIRECTION_SERVICE',
      'SET_KVM_REDIRECTION_SAP',
      'PUT_REDIRECTION_SERVICE',
      'PUT_IPS_OPT_IN_SERVICE',
      'SUCCESS'
    ]
    const featuresService = interpret(mockFeaturesMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    featuresService.start()
    featuresService.send({ type: 'CONFIGURE_FEATURES', clientId })
  })
  it('Should configure AMT features when ONLY_IDER', (done) => {
    amtRedirectionSvcJson.EnabledState = AMTRedirectionServiceEnabledStates.ONLY_IDER
    context.amtConfiguration.solEnabled = false

    const mockFeaturesMachine = featuresConfiguration.machine.withConfig(machineConfig).withContext(context)
    const flowStates = [
      'DEFAULT_FEATURES',
      'GET_AMT_REDIRECTION_SERVICE',
      'GET_IPS_OPT_IN_SERVICE',
      'GET_CIM_KVM_REDIRECTION_SAP',
      'SET_REDIRECTION_SERVICE',
      'SET_KVM_REDIRECTION_SAP',
      'PUT_REDIRECTION_SERVICE',
      'PUT_IPS_OPT_IN_SERVICE',
      'SUCCESS'
    ]
    const featuresService = interpret(mockFeaturesMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    featuresService.start()
    featuresService.send({ type: 'CONFIGURE_FEATURES', clientId })
  })
  it('Should configure AMT features when ONLY_SOL', (done) => {
    amtRedirectionSvcJson.EnabledState = AMTRedirectionServiceEnabledStates.ONLY_SOL
    context.amtConfiguration.iderEnabled = false
    const mockFeaturesMachine = featuresConfiguration.machine.withConfig(machineConfig).withContext(context)
    const flowStates = [
      'DEFAULT_FEATURES',
      'GET_AMT_REDIRECTION_SERVICE',
      'GET_IPS_OPT_IN_SERVICE',
      'GET_CIM_KVM_REDIRECTION_SAP',
      'SET_REDIRECTION_SERVICE',
      'SET_KVM_REDIRECTION_SAP',
      'PUT_REDIRECTION_SERVICE',
      'PUT_IPS_OPT_IN_SERVICE',
      'SUCCESS'
    ]
    const featuresService = interpret(mockFeaturesMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    featuresService.start()
    featuresService.send({ type: 'CONFIGURE_FEATURES', clientId })
  })

  it('Should NOT configure AMT features when failure', (done) => {
    machineConfig.services['get-amt-redirection-service'] = Promise.reject(new Error('FAILURE'))
    const mockFeaturesMachine = featuresConfiguration.machine.withConfig(machineConfig).withContext(context)
    const flowStates = [
      'DEFAULT_FEATURES',
      'GET_AMT_REDIRECTION_SERVICE',
      'FAILED'
    ]
    const featuresService = interpret(mockFeaturesMachine).onTransition((state) => {
      console.log(state.value)
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILED') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    featuresService.start()
    featuresService.send({ type: 'CONFIGURE_FEATURES', clientId })
  })
  it('getAmtRedirectionService', async () => {
    await featuresConfiguration.getAmtRedirectionService(context)
    expect(invokeSpy).toHaveBeenCalled()
  })
  it('getIpsOptInService', async () => {
    await featuresConfiguration.getIpsOptInService(context)
    expect(invokeSpy).toHaveBeenCalled()
  })
  it('getCimKvmRedirectionSAP', async () => {
    await featuresConfiguration.getCimKvmRedirectionSAP(context)
    expect(invokeSpy).toHaveBeenCalled()
  })
  it('setRedirectionService', async () => {
    context.AMT_RedirectionService = amtRedirectionSvcJson
    await featuresConfiguration.setRedirectionService(context)
    expect(invokeSpy).toHaveBeenCalled()
  })
  it('setKvmRedirectionSap', async () => {
    context.CIM_KVMRedirectionSAP = kvmRedirectionSvcJson
    await featuresConfiguration.setKvmRedirectionSap(context)
    expect(invokeSpy).toHaveBeenCalled()
  })
  it('putRedirectionService', async () => {
    context.AMT_RedirectionService = amtRedirectionSvcJson
    await featuresConfiguration.putRedirectionService(context)
    expect(invokeSpy).toHaveBeenCalled()
  })
  it('putIpsOptInService', async () => {
    context.IPS_OptInService = ipsOptInsSvcJson
    await featuresConfiguration.putIpsOptInService(context)
    expect(invokeSpy).toHaveBeenCalled()
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
})
