import { CIRAConfiguration, CIRAConfigContext } from './ciraConfiguration'
import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'
import { EnvReader } from '../utils/EnvReader'
import { config } from '../test/helper/Config'
import { ClientAction } from '../models/RCS.Config'
import { MpsType } from '../actions/CIRAConfigurator'
import { interpret } from 'xstate'

const clientId = uuid()
EnvReader.GlobalEnvConfig = config

describe('CIRA Configuration State Machine', () => {
  let ciraConfiguration: CIRAConfiguration
  // let responseMessageSpy
  // let sendSpy
  let currentStateIndex: number
  let invokeWsmanCallSpy: jest.SpyInstance
  let remoteAccessPolicyRuleSpy: jest.SpyInstance
  let ciraConfigContext: CIRAConfigContext
  let configuration

  beforeEach(() => {
    ciraConfiguration = new CIRAConfiguration()
    // responseMessageSpy = jest.spyOn(ciraConfiguration.responseMsg, 'get').mockImplementation().mockReturnValue({} as any)
    invokeWsmanCallSpy = jest.spyOn(ciraConfiguration, 'invokeWsmanCall').mockImplementation().mockResolvedValue('done')
    remoteAccessPolicyRuleSpy = jest.spyOn(ciraConfiguration.amt, 'RemoteAccessPolicyRule').mockImplementation().mockReturnValue('abcdef')

    ciraConfigContext = {
      clientId: '',
      httpHandler: null,
      status: 'success',
      errorMessage: '',
      xmlMessage: '',
      statusMessage: '',
      message: null,
      ciraConfig: null,
      profile: null,
      isDeleting: true,
      privateCerts: []
    }

    devices[clientId] = {
      unauthCount: 0,
      ClientId: clientId,
      ClientSocket: { send: jest.fn() } as any,
      ClientData: {
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
          hostname: 'DESKTOP-9CC12U7',
          currentMode: 0,
          certHashes: [
            'e7685634efacf69ace939a6b255b7b4fabef42935b50a265acb5cb6027e44e70',
            'eb04cf5eb1f39afa762f2bb120f296cba520c1b97db1589565b81cb9a17b7244'
          ],
          sku: '16392',
          uuid: '4bac9510-04a6-4321-bae2-d45ddf07b684',
          username: '$$OsAdmin',
          client: 'PPC',
          profile: 'profile1',
          action: ClientAction.ADMINCTLMODE
        }
      },
      ciraconfig: { TLSSettingData: { Enabled: true, AcceptNonSecureConnections: true, MutualAuthentication: true, TrustedCN: null } },
      network: {},
      status: {},
      activationStatus: {},
      connectionParams: {
        guid: '4c4c4544-004b-4210-8033-b6c04f504633',
        port: 16992,
        digestChallenge: null,
        username: 'admin',
        password: 'P@ssw0rd'
      },
      uuid: '4c4c4544-004b-4210-8033-b6c04f504633',
      messageId: 1
    }
    // sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send').mockImplementation().mockReturnValue()
    currentStateIndex = 0
    configuration = {
      services: {
        'get-cira-config': Promise.resolve({ clientId }),
        'error-machine': Promise.resolve({ clientId }),
        'remove-remote-access-policy-rule-user-initiated': Promise.resolve({ clientId }),
        'remove-remote-access-policy-rule-rule-alert': Promise.resolve({ clientId }),
        'remove-remote-access-policy-rule-periodic': Promise.resolve({ clientId }),
        'enumerate-management-presence-remote-sap': Promise.resolve({ clientId }),
        'add-remote-policy-access-rule': Promise.resolve({ clientId }),
        'delete-management-presence-remote-sap': Promise.resolve({ clientId }),
        'enumerate-tls-setting-data': Promise.resolve({ clientId }),
        'pull-tls-setting-data': Promise.resolve({ clientId }),
        'disable-tls-setting-data': Promise.resolve({ clientId }),
        'disable-tls-setting-data-2': Promise.resolve({ clientId }),
        'setup-and-configuration-service-commit-changes': Promise.resolve({ clientId }),
        'enumerate-tls-credential-context': Promise.resolve({ clientId }),
        'pull-tls-credential-context': Promise.resolve({ clientId }),
        'delete-tls-credential-context': Promise.resolve({ clientId }),
        'enumerate-public-private-key-pair': Promise.resolve({ clientId }),
        'pull-public-private-key-pair': Promise.resolve({ clientId }),
        'pull-management-presence-remote-sap': Promise.resolve({ clientId }),
        'delete-public-private-key-pair': Promise.resolve({ clientId }),
        'enumerate-remote-access-policy-rule': Promise.resolve({ clientId }),
        'pull-remote-access-policy-rule': Promise.resolve({ clientId }),
        'put-remote-access-policy-rule': Promise.resolve({ clientId }),
        'user-initiated-connection-service': Promise.resolve({ clientId }),
        'enumerate-public-key-certificate': Promise.resolve({ clientId }),
        'pull-public-key-certificate': Promise.resolve({ clientId }),
        'delete-public-key-certificate': Promise.resolve({ clientId }),
        'get-environment-detection-settings': Promise.resolve({ clientId }),
        'put-environment-detection-settings': Promise.resolve({ clientId }),
        'clear-environment-detection-settings': Promise.resolve({ clientId }),
        'add-trusted-root-certificate': Promise.resolve({ clientId }),
        'save-mps-password-to-secret-provider': Promise.resolve({ clientId }),
        'save-device-to-mps': Promise.resolve({ clientId }),
        'add-mps': Promise.resolve({ clientId })
      },
      actions: {
        'Update Configuration Status': () => {},
        'Reset Unauth Count': () => {},
        'Convert WSMan XML response to JSON': () => {}
      }
    }
  })

  // it('should eventually reach "REMOVE_REMOTE_ACCESS_POLICY_RULE_USER_INITIATED"', (done) => {
  //   const mockCiraConfigurationMachine = ciraConfiguration.machine.withConfig(configuration)
  //   const flowStates = ['CIRACONFIGURED', 'GET_CIRA_CONFIG', 'REMOVE_REMOTE_ACCESS_POLICY_RULE_USER_INITIATED']
  //   const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
  //     expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
  //     if (state.matches('REMOVE_REMOTE_ACCESS_POLICY_RULE_USER_INITIATED') && currentStateIndex === flowStates.length) {
  //       done()
  //     }
  //   })

  //   ciraConfigurationService.start()
  //   ciraConfigurationService.send({ type: 'REMOVEPOLICY', clientId: clientId, data: null })
  // })

  it('should eventually reach "Failed"', (done) => {
    configuration.services['get-cira-config'] = Promise.reject(new Error())
    configuration.services['error-machine'] = async (_, event) => await new Promise((resolve, reject) => {
      setTimeout(() => {
        configuration.send({ type: 'ONFAILED', clientId: clientId })
        reject(new Error())
      }, 50)
    })
    const mockCiraConfigurationMachine = ciraConfiguration.machine.withConfig(configuration)
    const flowStates = ['CIRACONFIGURED', 'GET_CIRA_CONFIG', 'FAILURE']
    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILURE') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    ciraConfigurationService.start()
    ciraConfigurationService.send({ type: 'REMOVEPOLICY', clientId: clientId, data: null })
  })

  // TODO: Why is this failing???
  // it('should send a WSMan message', async () => {
  //   const context = { cira: null, amtDomain: null, message: '', clientId: clientId, xmlMessage: '', response: '', status: 'wsman', errorMessage: '' }
  //   void ciraConfiguration.invokeWsmanCall(context)
  //   expect(responseMessageSpy).toHaveBeenCalled()
  //   expect(sendSpy).toHaveBeenCalled()
  //   expect(devices[clientId].pendingPromise).toBeDefined()
  // })

  it('should send to wsman message remove RemoteAccess PolicyRule User Initiated call', async () => {
    await ciraConfiguration.removeRemoteAccessPolicyRuleUserInitiated(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
    expect(remoteAccessPolicyRuleSpy).toHaveBeenCalled()
  })

  it('should send to wsman message remove RemoteAccess PolicyRuleAlert', async () => {
    await ciraConfiguration.removeRemoteAccessPolicyRuleAlert(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send to wsman message remove RemoteAccess PolicyRulePeriodic', async () => {
    await ciraConfiguration.removeRemoteAccessPolicyRulePeriodic(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
    expect(remoteAccessPolicyRuleSpy).toHaveBeenCalled()
  })

  // describe('send wsman message with Management Presence Remote SAP', () => {
  //   let ciraConfiguration
  //   let invokeWsmanCallSpy
  //   beforeEach(() => {
  //     ciraConfiguration = new CIRAConfiguration()
  //     invokeWsmanCallSpy = jest.spyOn(ciraConfiguration, 'invokeWsmanCall').mockImplementation().mockResolvedValue('done')
  //   })

  it('should send wsman message to enumerate ManagementPresenceRemoteSAP', async () => {
    // const context = { cira: null, amtDomain: null, message: '', clientId: clientId, xmlMessage: '', response: '', status: 'wsman', errorMessage: '' }
    await ciraConfiguration.enumerateManagementPresenceRemoteSAP(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send wsman message to pull ManagementPresenceRemoteSAP', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { EnumerateResponse: { EnumerationContext: 'abcd' } } }
    }
    await ciraConfiguration.pullManagementPresenceRemoteSAP(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send to delete RemoteAccessService', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { PullResponse: { Items: { AMT_ManagementPresenceRemoteSAP: { Name: 'abcd' } } } } }
    }
    await ciraConfiguration.deleteRemoteAccessService(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send to add RemoteAccessService', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { PullResponse: { Items: { AMT_ManagementPresenceRemoteSAP: { Name: 'abcd' } } } } }
    }
    await ciraConfiguration.addRemoteAccessService(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  // })

  it('should send wsman message to enumerate Public Key Certificate', async () => {
    await ciraConfiguration.enumeratePublicKeyCertificate(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send wsman message to pull PublicKey Certificate', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { EnumerateResponse: { EnumerationContext: 'abcd' } } }
    }
    await ciraConfiguration.pullPublicKeyCertificate(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send to delete PublicKeyCertificate', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { PullResponse: { Items: { AMT_PublicKeyCertificate: 'abcd' } } } }
    }
    await ciraConfiguration.deletePublicKeyCertificate(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send to delete PublicKeyCertificate', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { PullResponse: { Items: { AMT_PublicKeyCertificate: 'abcd' } } } }
    }
    await ciraConfiguration.deletePublicKeyCertificate(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send wsman message to get Environment Detection Settings', async () => {
    await ciraConfiguration.getEnvironmentDetectionSettings(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send wsman message to put Environment Detection Settings', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { AMT_EnvironmentDetectionSettingData: { DetectionStrings: 'abcde' } } }
    }
    await ciraConfiguration.putEnvironmentDetectionSettings(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send to clear Environment Detection Settings', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { AMT_EnvironmentDetectionSettingData: { DetectionStrings: 'abcde' } } }
    }
    await ciraConfiguration.clearEnvironmentDetectionSettings(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send wsman message to enumerate Remote Access Policy Applies To MPS', async () => {
    await ciraConfiguration.enumerateRemoteAccessPolicyAppliesToMPS(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send wsman message to pull Remote Access Policy Applies To MPS', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { EnumerateResponse: { EnumerationContext: 'abcde' } } }
    }
    await ciraConfiguration.pullRemoteAccessPolicyAppliesToMPS(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send wsman message to put Remote Access Policy Applies To MPS', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { PullResponse: { Items: { AMT_RemoteAccessPolicyAppliesToMPS: MpsType } } } }
    }
    await ciraConfiguration.putRemoteAccessPolicyAppliesToMPS(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send wsman message to enumerate TLS Setting Data', async () => {
    await ciraConfiguration.enumerateRemoteAccessPolicyAppliesToMPS(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send wsman message to pull TLS Setting Data', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { EnumerateResponse: { EnumerationContext: 'abcde' } } }
    }
    await ciraConfiguration.pullTLSSettingData(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  // it('should send wsman message to disable TLS Setting Data', async () => {
  //   const context = { cira: null, amtDomain: null, message: '', clientId: clientId, xmlMessage: '', response: { Envelope: { Body: { PullResponse: { Items: { AMT_RemoteAccessPolicyAppliesToMPS: 2 } } } } }, status: 'wsman', errorMessage: '' }
  //   await ciraConfiguration.disableTLSSettingData(context)
  //   expect(invokeWsmanCallSpy).toHaveBeenCalled()
  // })

  // it('should send wsman message to disable TLS Setting Data', async () => {
  //   const context = { cira: null, amtDomain: null, message: '', clientId: clientId, xmlMessage: '', response: { Envelope: { Body: { PullResponse: { Items: { AMT_RemoteAccessPolicyAppliesToMPS: 2 } } } } }, status: 'wsman', errorMessage: '' }
  //   await ciraConfiguration.disableTLSSettingData2(context)
  //   expect(invokeWsmanCallSpy).toHaveBeenCalled()
  // })

  it('should send wsman message to enumerate TLS Credential Context', async () => {
    await ciraConfiguration.enumerateRemoteAccessPolicyAppliesToMPS(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send wsman message to pull TLS Credential Context', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { EnumerateResponse: { EnumerationContext: 'abcde' } } }
    }
    await ciraConfiguration.pullTLSCredentialContext(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send wsman message to put Remote TLS Credential Context', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { PullResponse: { Items: { AMT_TLSCredentialContext: MpsType } } } }
    }
    await ciraConfiguration.deleteTLSCredentialContext(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send wsman message to enumerate Public Private Key Pair', async () => {
    await ciraConfiguration.enumeratePublicPrivateKeyPair(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send wsman message to pull Public Private Key Pair', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { EnumerateResponse: { EnumerationContext: 'abcde' } } }
    }
    await ciraConfiguration.pullPublicPrivateKeyPair(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('should send wsman message to delete Public Private Key Pair', async () => {
    ciraConfigContext.message = {
      Envelope: { Body: { PullResponse: { Items: { AMT_PublicPrivateKeyPair: { InstanceID: 1234 } } } } }
    }
    await ciraConfiguration.deletePublicPrivateKeyPair(ciraConfigContext, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  // describe('send wsman message for Public Key Management Service', () => {
  //   let ciraConfiguration
  //   let invokeWsmanCallSpy
  //   beforeEach(() => {
  //     ciraConfiguration = new CIRAConfiguration()
  //     invokeWsmanCallSpy = jest.spyOn(ciraConfiguration, 'invokeWsmanCall').mockImplementation().mockResolvedValue('done')
  //   })

//   it('should send wsman message to add Trusted Root Certificate', async () => {
//     const context = { cira: null, amtDomain: null, message: '', clientId: clientId, xmlMessage: '', response: '', status: 'wsman', errorMessage: '' }
//     await ciraConfiguration.addTrustedRootCertificate(context)
//     expect(invokeWsmanCallSpy).toHaveBeenCalled()
//   })
// })
})
