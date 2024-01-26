/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'
import { type CIRAConfigEvent, type CIRAConfiguration as CIRAConfigurationType } from './ciraConfiguration.js'
import { randomUUID } from 'node:crypto'
import { devices } from '../devices.js'
import { Environment } from '../utils/Environment.js'
import { config } from '../test/helper/Config.js'
import { type CIRAConfig } from '../models/RCS.Config.js'
import { HttpHandler } from '../HttpHandler.js'
import { interpret } from 'xstate'
import { UNEXPECTED_PARSE_ERROR } from '../utils/constants.js'
import { jest } from '@jest/globals'

const invokeWsmanCallSpy = jest.fn<any>()
jest.unstable_mockModule('./common.js', () => ({
  invokeWsmanCall: invokeWsmanCallSpy,
  invokeEnterpriseAssistantCall: jest.fn()
}))

const { CIRAConfiguration, MPSType } = await import ('./ciraConfiguration.js')

Environment.Config = config

describe('CIRA Configuration State Machine', () => {
  const clientId = randomUUID()
  const httpHandler = new HttpHandler()
  const initialEvent: CIRAConfigEvent = {
    type: 'CONFIGURE_CIRA',
    clientId,
    data: null,
    tenantId: ''
  }
  const wsmanEnumerationResponse = {
    Envelope: { Body: { EnumerateResponse: { EnumerationContext: 'abcd' } } }
  }
  let ciraStateMachineImpl: CIRAConfigurationType
  let machineConfig
  let machineContext
  let ciraConfig: CIRAConfig
  beforeEach(() => {
    jest.clearAllMocks()
    ciraStateMachineImpl = new CIRAConfiguration()
    devices[clientId] = {
      ClientId: clientId,
      unauthCount: 0,
      status: {
        CIRAConnection: 'should not need this'
      }
    } as any
    ciraConfig = {
      proxyDetails: '',
      tenantId: '',
      configName: 'config1',
      mpsServerAddress: '192.168.1.38',
      mpsPort: 4433,
      username: 'admin',
      password: null as any,
      commonName: '192.168.1.38',
      serverAddressFormat: 3,
      authMethod: 2,
      mpsRootCertificate: 'NotReallyACert'
    }
    machineConfig = {
      services: {
        'get-cira-config': Promise.resolve(ciraConfig),
        'set-mps-password': Promise.resolve({ whatever: false }),
        'add-trusted-root-certificate': Promise.resolve({}),
        'save-mps-password-to-secret-provider': Promise.resolve({}),
        'save-device-to-mps': Promise.resolve({}),
        'add-mps': Promise.resolve({}),
        'enumerate-management-presence-remote-sap': Promise.resolve(wsmanEnumerationResponse),
        'pull-management-presence-remote-sap': Promise.resolve({ clientId }),
        'add-remote-policy-access-rule': Promise.resolve({ clientId }),
        'enumerate-remote-access-policy-rule': Promise.resolve(wsmanEnumerationResponse),
        'pull-remote-access-policy-rule': Promise.resolve({}),
        'put-remote-access-policy-rule': Promise.resolve({}),
        'user-initiated-connection-service': Promise.resolve({ Envelope: { Body: { RequestStateChange_OUTPUT: { ReturnValue: 0 } } } }),
        'get-environment-detection-settings': Promise.resolve({}),
        'put-environment-detection-settings': Promise.resolve({})
      }
    }
    machineContext = {
      clientId,
      profile: null,
      httpHandler,
      amt: new AMT.Messages(),
      tenantId: '',
      status: 'success',
      errorMessage: '',
      xmlMessage: '',
      message: null,
      ciraConfig: null,
      statusMessage: '',
      privateCerts: []
    }
  })

  it('should succeed for happy path', (done) => {
    const mockCiraConfigurationMachine = ciraStateMachineImpl.machine.withConfig(machineConfig).withContext(machineContext)
    // TODO: [tech debt] most references to XState suggest unit testing internal implementation states is not BKM
    const flowStates = [
      'CIRACONFIGURED',
      'GET_CIRA_CONFIG',
      'SET_MPS_PASSWORD',
      'ADD_TRUSTED_ROOT_CERTIFICATE',
      'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER',
      'SAVE_DEVICE_TO_MPS',
      'ADD_MPS',
      'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'ADD_REMOTE_ACCESS_POLICY_RULE',
      'ENUMERATE_REMOTE_ACCESS_POLICY_RULE',
      'PULL_REMOTE_ACCESS_POLICY_RULE',
      'PUT_REMOTE_ACCESS_POLICY_RULE',
      'USER_INITIATED_CONNECTION_SERVICE',
      'GET_ENVIRONMENT_DETECTION_SETTINGS',
      'PUT_ENVIRONMENT_DETECTION_SETTINGS',
      'SUCCESS'
    ]
    let currentStateIndex = 0

    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      const expected = flowStates[currentStateIndex++]
      const actual = state.value as string
      expect(actual).toEqual(expected)
      // expect(state.matches(expected)).toBe(true)
      if (state.matches('SUCCESS') || state.matches('FAILURE') || currentStateIndex === flowStates.length) {
        const status = devices[clientId].status.CIRAConnection
        expect(status).toEqual('Configured')
        done()
      }
    })
    ciraConfigurationService.start()
    ciraConfigurationService.send(initialEvent)
  })

  it('should fail on error response for user-initiated-connection-service', (done) => {
    const failedResponse = { Envelope: { Body: { RequestStateChange_OUTPUT: { ReturnValue: 1 } } } }
    machineConfig.services['user-initiated-connection-service'] = Promise.resolve(failedResponse)
    const mockCiraConfigurationMachine = ciraStateMachineImpl.machine.withConfig(machineConfig).withContext(machineContext)

    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      if (state.matches('SUCCESS') || state.matches('FAILURE')) {
        expect(state.matches('FAILURE')).toBeTruthy()
        done()
      }
    })
    ciraConfigurationService.start()
    ciraConfigurationService.send(initialEvent)
  })

  interface FailureTestInput {
    stateValue: string
    service: string
  }

  test.each<FailureTestInput | any>([
    { stateValue: 'GET_CIRA_CONFIG', service: 'get-cira-config' },
    { stateValue: 'SET_MPS_PASSWORD', service: 'set-mps-password' },
    { stateValue: 'ADD_TRUSTED_ROOT_CERTIFICATE', service: 'add-trusted-root-certificate' },
    { stateValue: 'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER', service: 'save-mps-password-to-secret-provider' },
    { stateValue: 'SAVE_DEVICE_TO_MPS', service: 'save-device-to-mps' },
    { stateValue: 'ADD_MPS', service: 'add-mps' },
    { stateValue: 'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP', service: 'enumerate-management-presence-remote-sap' },
    { stateValue: 'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP', service: 'pull-management-presence-remote-sap' },
    { stateValue: 'ADD_REMOTE_ACCESS_POLICY_RULE', service: 'add-remote-policy-access-rule' },
    { stateValue: 'ENUMERATE_REMOTE_ACCESS_POLICY_RULE', service: 'enumerate-remote-access-policy-rule' },
    { stateValue: 'PULL_REMOTE_ACCESS_POLICY_RULE', service: 'pull-remote-access-policy-rule' },
    { stateValue: 'PUT_REMOTE_ACCESS_POLICY_RULE', service: 'put-remote-access-policy-rule' },
    { stateValue: 'USER_INITIATED_CONNECTION_SERVICE', service: 'user-initiated-connection-service' },
    { stateValue: 'GET_ENVIRONMENT_DETECTION_SETTINGS', service: 'get-environment-detection-settings' },
    { stateValue: 'PUT_ENVIRONMENT_DETECTION_SETTINGS', service: 'put-environment-detection-settings' }
  ])('should fail at state $stateValue', (ti: FailureTestInput, done: any) => {
    let previousState: any
    // exercise the UNEXPECTED_PARSE_ERROR retry in one of the pull calls
    let rejectionValue: any = new Error('expected test failure')
    if (ti.service.includes('pull')) {
      rejectionValue = new UNEXPECTED_PARSE_ERROR()
    }
    machineConfig.services[ti.service] = Promise.reject(rejectionValue)
    const machine = ciraStateMachineImpl.machine.withConfig(machineConfig).withContext(machineContext)
    const service = interpret(machine).onTransition((state) => {
      if (state.matches('SUCCESS') || state.matches('FAILURE')) {
        expect(state.matches('FAILURE')).toBe(true)
        expect(previousState.matches(ti.stateValue)).toBe(true)
        done()
      } else {
        previousState = state
      }
    })
    service.start()
    service.send(initialEvent)
  })

  describe('send wsman message with Management Presence Remote SAP', () => {
    it('should send wsman message to enumerate ManagementPresenceRemoteSAP', async () => {
      await ciraStateMachineImpl.enumerateManagementPresenceRemoteSAP(machineContext, null as any)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send wsman message to pull ManagementPresenceRemoteSAP', async () => {
      machineContext.message = {
        Envelope: { Body: { EnumerateResponse: { EnumerationContext: 'abcd' } } }
      }
      await ciraStateMachineImpl.pullManagementPresenceRemoteSAP(machineContext, null as any)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send to add RemoteAccessService', async () => {
      machineContext.message = {
        Envelope: { Body: { PullResponse: { Items: { AMT_ManagementPresenceRemoteSAP: { Name: 'abcd' } } } } }
      }
      await ciraStateMachineImpl.addRemoteAccessPolicyRule(machineContext, null as any)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should log error on call to enumerateManagementPresenceRemoteSAP', async () => {
      machineContext.amt = null as any
      const loggerSpy = jest.spyOn(ciraStateMachineImpl.logger, 'error')
      await ciraStateMachineImpl.enumerateManagementPresenceRemoteSAP(machineContext, null as any)
      expect(loggerSpy).toHaveBeenCalled()
    })
    it('should log error on call to pullManagementPresenceRemoteSAP', async () => {
      machineContext.amt = null as any
      const loggerSpy = jest.spyOn(ciraStateMachineImpl.logger, 'error')
      await ciraStateMachineImpl.pullManagementPresenceRemoteSAP(machineContext, null as any)
      expect(loggerSpy).toHaveBeenCalled()
    })
    it('should log error on call to addRemoteAccessPolicyRule', async () => {
      machineContext.amt = null as any
      const loggerSpy = jest.spyOn(ciraStateMachineImpl.logger, 'error')
      await ciraStateMachineImpl.addRemoteAccessPolicyRule(machineContext, null as any)
      expect(loggerSpy).toHaveBeenCalled()
    })
  })

  describe('send wsman message for Environment Detection Settings', () => {
    it('should send wsman message to get Environment Detection Settings', async () => {
      await ciraStateMachineImpl.getEnvironmentDetectionSettings(machineContext, null as any)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send wsman message to put Environment Detection Settings', async () => {
      expect(Environment.Config.disable_cira_domain_name).toBeFalsy()
      machineContext.message = {
        Envelope: { Body: { AMT_EnvironmentDetectionSettingData: { DetectionStrings: 'abcde' } } }
      }
      await ciraStateMachineImpl.putEnvironmentDetectionSettings(machineContext, null as any)
      Environment.Config.disable_cira_domain_name = 'disablethis.com'
      await ciraStateMachineImpl.putEnvironmentDetectionSettings(machineContext, null as any)
      expect(invokeWsmanCallSpy).toHaveBeenCalledTimes(2)
    })
    it('should log error on call to getEnvironmentDetectionSettings', async () => {
      machineContext.amt = null as any
      const loggerSpy = jest.spyOn(ciraStateMachineImpl.logger, 'error')
      await ciraStateMachineImpl.getEnvironmentDetectionSettings(machineContext, null as any)
      expect(loggerSpy).toHaveBeenCalled()
    })
    it('should log error on call to putEnvironmentDetectionSettings', async () => {
      machineContext.amt = null as any
      const loggerSpy = jest.spyOn(ciraStateMachineImpl.logger, 'error')
      await ciraStateMachineImpl.putEnvironmentDetectionSettings(machineContext, null as any)
      expect(loggerSpy).toHaveBeenCalled()
    })
  })

  describe('send wsman message for Remote Access Policy Applies To MPS', () => {
    it('should send wsman message to enumerate Remote Access Policy Applies To MPS', async () => {
      await ciraStateMachineImpl.enumerateRemoteAccessPolicyAppliesToMPS(machineContext, null as any)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send wsman message to pull Remote Access Policy Applies To MPS', async () => {
      machineContext.message = {
        Envelope: { Body: { EnumerateResponse: { EnumerationContext: 'abcde' } } }
      }
      await ciraStateMachineImpl.pullRemoteAccessPolicyAppliesToMPS(machineContext, null as any)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send wsman message to put Remote Access Policy Applies To MPS', async () => {
      machineContext.message = {
        Envelope: { Body: { PullResponse: { Items: { AMT_RemoteAccessPolicyAppliesToMPS: MPSType } } } }
      }
      await ciraStateMachineImpl.putRemoteAccessPolicyAppliesToMPS(machineContext, null as any)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })

    it('should send wsman message to User Initiated Connection Service', async () => {
      await ciraStateMachineImpl.userInitiatedConnectionService(machineContext, null as any)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should log error on call to enumerateRemoteAccessPolicyAppliesToMPS', async () => {
      machineContext.amt = null as any
      const loggerSpy = jest.spyOn(ciraStateMachineImpl.logger, 'error')
      await ciraStateMachineImpl.enumerateRemoteAccessPolicyAppliesToMPS(machineContext, null as any)
      expect(loggerSpy).toHaveBeenCalled()
    })
    it('should log error on call to pullRemoteAccessPolicyAppliesToMPS', async () => {
      machineContext.amt = null as any
      const loggerSpy = jest.spyOn(ciraStateMachineImpl.logger, 'error')
      await ciraStateMachineImpl.pullRemoteAccessPolicyAppliesToMPS(machineContext, null as any)
      expect(loggerSpy).toHaveBeenCalled()
    })
    it('should log error on call to putRemoteAccessPolicyAppliesToMPS', async () => {
      machineContext.amt = null as any
      const loggerSpy = jest.spyOn(ciraStateMachineImpl.logger, 'error')
      await ciraStateMachineImpl.putRemoteAccessPolicyAppliesToMPS(machineContext, null as any)
      expect(loggerSpy).toHaveBeenCalled()
    })
    it('should log error on call to userInitiatedConnectionService', async () => {
      machineContext.amt = null as any
      const loggerSpy = jest.spyOn(ciraStateMachineImpl.logger, 'error')
      await ciraStateMachineImpl.userInitiatedConnectionService(machineContext, null as any)
      expect(loggerSpy).toHaveBeenCalled()
    })
  })

  describe('send wsman message to add MPS server and certificate', () => {
    beforeEach(() => {
      // spoof getCiraConfiguration
      machineContext.ciraConfig = ciraConfig
    })
    it('should send wsman message to add Trusted Root Certificate', async () => {
      await ciraStateMachineImpl.addTrustedRootCertificate(machineContext, null as any)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send wsman message to add MPS server', async () => {
      await ciraStateMachineImpl.addMPS(machineContext, null as any)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should log error on call to addTrustedRootCertificate', async () => {
      machineContext.amt = null as any
      const loggerSpy = jest.spyOn(ciraStateMachineImpl.logger, 'error')
      await ciraStateMachineImpl.addTrustedRootCertificate(machineContext, null as any)
      expect(loggerSpy).toHaveBeenCalled()
    })
    it('should log error on call to addMPS', async () => {
      machineContext.amt = null as any
      const loggerSpy = jest.spyOn(ciraStateMachineImpl.logger, 'error')
      await ciraStateMachineImpl.addMPS(machineContext, null as any)
      expect(loggerSpy).toHaveBeenCalled()
    })
  })
})
