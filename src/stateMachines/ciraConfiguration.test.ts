import { CIRAConfiguration, CIRAConfigContext } from './ciraConfiguration'
import { v4 as uuid } from 'uuid'
import { devices } from '../WebSocketListener'
import { EnvReader } from '../utils/EnvReader'
import { config } from '../test/helper/Config'
import { ClientAction } from '../models/RCS.Config'
import { MpsType } from '../actions/CIRAConfigurator'
import { HttpHandler } from '../HttpHandler'
import { interpret } from 'xstate'

const clientId = uuid()
EnvReader.GlobalEnvConfig = config

describe('CIRA Configuration State Machine', () => {
  let ciraConfiguration: CIRAConfiguration
  let currentStateIndex: number
  let invokeWsmanCallSpy: jest.SpyInstance
  let sendSpy: jest.SpyInstance
  let responseMessageSpy: jest.SpyInstance
  let wrapItSpy: jest.SpyInstance
  let ciraConfigContext: CIRAConfigContext
  let configuration

  beforeEach(() => {
    ciraConfiguration = new CIRAConfiguration()
    invokeWsmanCallSpy = jest.spyOn(ciraConfiguration, 'invokeWsmanCall').mockResolvedValue('done')
    ciraConfigContext = {
      clientId: clientId,
      httpHandler: new HttpHandler(),
      status: 'success',
      errorMessage: '',
      xmlMessage: '',
      statusMessage: '',
      message: null,
      ciraConfig: {
        configName: 'config1',
        mpsServerAddress: '192.168.1.38',
        mpsPort: 4433,
        username: 'admin',
        password: null,
        commonName: '192.168.1.38',
        serverAddressFormat: 3,
        authMethod: 2,
        proxyDetails: null,
        tenantId: '',
        mpsRootCertificate: 'MIIEOzCCAqOgAwIBAgIDATghMA0GCSqGSIb3DQEBDAUAMD0xFzAVBgNVBAMTDk1QU1Jvb3QtZjI5NzdjMRAwDgYDVQQKEwd1bmtub3duMRAwDgYDVQQGEwd1bmtub3duMCAXDTIxMDIwOTE2NTA1NloYDzIwNTIwMjA5MTY1MDU2WjA9MRcwFQYDVQQDEw5NUFNSb290LWYyOTc3YzEQMA4GA1UEChMHdW5rbm93bjEQMA4GA1UEBhMHdW5rbm93bjCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBALh5/XVfcshMOarCLJ4RHMZ6sGS8PGaDiCdL4V0SwxCju4n9ZJFr2O6Bv2/qNl1enjgC/YRguHeNlYa1usbJReNJXb6Mv7G4z7NCVnPmvJtCI78CIeZ0+r6H1VZyw0Jft7S6U0G6ZQue21Ycr6ELJhNz9b4QZUMujd863TWWtE3peejYGEY8hIgMk6YfNyzFx/Xd4wpQToYoN6kBrrKK8R0rYBVR19YZg36ZWhfdg9saLhPy+7L2ScE4KW92+DUK++aXxt3Aq1dMzjHewii98c//TwCpJQBEQhzTyyuSicfWj78Q61IgtLpHWlkKvoFldYcH4vHVZiMbjSyW6EA5tQET4GKef2fY4OnEIvfyJEn7P6WDHz4vbSMZBwBBgpzwWQGeU2+W5lAblmuL48gk5byED6qXSBt4BV2c8IAMEAnShBxjJRDkYJfjEg3t/Gd5lskrcwTSh6AqEGAJqM4251+jO84gvuTqGwwejC/kdiCi9lR+KNEb25S3REfTQQAxgwIDAQABo0IwQDAMBgNVHRMEBTADAQH/MBEGCWCGSAGG+EIBAQQEAwIABzAdBgNVHQ4EFgQU8pd839uyitiRmIpp2R1MvZtvhW0wDQYJKoZIhvcNAQEMBQADggGBAAcbf4vdlTz0ZJkOaW7NwILAvfqeRvn0bTr8PZKGLW9BOcovtKPa8VjoBAar/LjGBvhdXXRYKpQqYUsJcCf53OKVhUx5vX0B6TYZYQtu6KtlmdbxrSEz/wermV5mMYM7yONVeZSUZmOT9iNwE5hTiNzRXNFlx/1+cDCRt8ApsjmYNdoKgxNjoY+ynqmtMkTNXKWd0KKsietOEciPS4UZ5tx6WZ+BH+vEpWw9u3cLeX8iLJXfPHsDmqqHIyjkGNCDsZmDIeyPxBe9CXPGCcMLX1WhBfSma9NMiRI2l18vryo7SRME600RbnkBZyjlzquL9aILZnmiHQOCJ9d75P1MtUdpBYVpqR0Owd8JtAZOqnm+u54oU4OZ+IZmJDT7S5/qytf5lJdIfHKp2RNNL3PoNgmANLop8UKQMoZ2QHl+8L6xJuZSYZMzKDIYXJCCucZSHxx8G41P6rTCylorEjFudqk0OoEb+30vOUqrd5ib/nXp+opwQaEdXYkZ+Wxim9quVw=='
      },
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
          profile: {
            profileName: 'acm',
            activation: ClientAction.ADMINCTLMODE,
            ciraConfigName: 'config1',
            ciraConfigObject: {
              configName: 'config1',
              mpsServerAddress: '192.168.1.38',
              mpsPort: 4433,
              username: 'admin',
              password: null,
              commonName: '192.168.1.38',
              serverAddressFormat: 3,
              authMethod: 2,
              mpsRootCertificate: 'MIIEOzCCAqOgAwIBAgIDATghMA0GCSqGSIb3DQEBDAUAMD0xFzAVBgNVBAMTDk1QU1Jvb3QtZjI5NzdjMRAwDgYDVQQKEwd1bmtub3duMRAwDgYDVQQGEwd1bmtub3duMCAXDTIxMDIwOTE2NTA1NloYDzIwNTIwMjA5MTY1MDU2WjA9MRcwFQYDVQQDEw5NUFNSb290LWYyOTc3YzEQMA4GA1UEChMHdW5rbm93bjEQMA4GA1UEBhMHdW5rbm93bjCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBALh5/XVfcshMOarCLJ4RHMZ6sGS8PGaDiCdL4V0SwxCju4n9ZJFr2O6Bv2/qNl1enjgC/YRguHeNlYa1usbJReNJXb6Mv7G4z7NCVnPmvJtCI78CIeZ0+r6H1VZyw0Jft7S6U0G6ZQue21Ycr6ELJhNz9b4QZUMujd863TWWtE3peejYGEY8hIgMk6YfNyzFx/Xd4wpQToYoN6kBrrKK8R0rYBVR19YZg36ZWhfdg9saLhPy+7L2ScE4KW92+DUK++aXxt3Aq1dMzjHewii98c//TwCpJQBEQhzTyyuSicfWj78Q61IgtLpHWlkKvoFldYcH4vHVZiMbjSyW6EA5tQET4GKef2fY4OnEIvfyJEn7P6WDHz4vbSMZBwBBgpzwWQGeU2+W5lAblmuL48gk5byED6qXSBt4BV2c8IAMEAnShBxjJRDkYJfjEg3t/Gd5lskrcwTSh6AqEGAJqM4251+jO84gvuTqGwwejC/kdiCi9lR+KNEb25S3REfTQQAxgwIDAQABo0IwQDAMBgNVHRMEBTADAQH/MBEGCWCGSAGG+EIBAQQEAwIABzAdBgNVHQ4EFgQU8pd839uyitiRmIpp2R1MvZtvhW0wDQYJKoZIhvcNAQEMBQADggGBAAcbf4vdlTz0ZJkOaW7NwILAvfqeRvn0bTr8PZKGLW9BOcovtKPa8VjoBAar/LjGBvhdXXRYKpQqYUsJcCf53OKVhUx5vX0B6TYZYQtu6KtlmdbxrSEz/wermV5mMYM7yONVeZSUZmOT9iNwE5hTiNzRXNFlx/1+cDCRt8ApsjmYNdoKgxNjoY+ynqmtMkTNXKWd0KKsietOEciPS4UZ5tx6WZ+BH+vEpWw9u3cLeX8iLJXfPHsDmqqHIyjkGNCDsZmDIeyPxBe9CXPGCcMLX1WhBfSma9NMiRI2l18vryo7SRME600RbnkBZyjlzquL9aILZnmiHQOCJ9d75P1MtUdpBYVpqR0Owd8JtAZOqnm+u54oU4OZ+IZmJDT7S5/qytf5lJdIfHKp2RNNL3PoNgmANLop8UKQMoZ2QHl+8L6xJuZSYZMzKDIYXJCCucZSHxx8G41P6rTCylorEjFudqk0OoEb+30vOUqrd5ib/nXp+opwQaEdXYkZ+Wxim9quVw=='
            }
          },
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
    sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send').mockReturnValue()
    wrapItSpy = jest.spyOn(ciraConfigContext.httpHandler, 'wrapIt').mockReturnValue('message')
    responseMessageSpy = jest.spyOn(ciraConfiguration.responseMsg, 'get')
    currentStateIndex = 0
    configuration = {
      services: {
        'get-cira-config': Promise.resolve({ clientId }),
        'error-machine': Promise.resolve({ clientId }),
        'add-trusted-root-certificate': Promise.resolve({ clientId }),
        'save-mps-password-to-secret-provider': Promise.resolve({ clientId }),
        'save-device-to-mps': Promise.resolve({ clientId }),
        'add-mps': Promise.resolve({ clientId }),
        'enumerate-management-presence-remote-sap': Promise.resolve({ clientId }),
        'pull-management-presence-remote-sap': Promise.resolve({ clientId }),
        'add-remote-policy-access-rule': Promise.resolve({ clientId }),
        'enumerate-remote-access-policy-rule': Promise.resolve({ clientId }),
        'pull-remote-access-policy-rule': Promise.resolve({ clientId }),
        'put-remote-access-policy-rule': Promise.resolve({ clientId }),
        'user-initiated-connection-service': Promise.resolve({ Envelope: { Body: { RequestStateChange_OUTPUT: { ReturnValue: 0 } } } }),
        'get-environment-detection-settings': Promise.resolve({ clientId }),
        'put-environment-detection-settings': Promise.resolve({ clientId })
      },
      actions: {
        'Update Configuration Status': () => {},
        'Reset Unauth Count': () => {},
        'Convert WSMan XML response to JSON': () => {}
      }
    }
  })

  it('should eventually reach "REMOVE_REMOTE_ACCESS_POLICY_RULE_USER_INITIATED"', (done) => {
    const mockCiraConfigurationMachine = ciraConfiguration.machine.withConfig(configuration).withContext(ciraConfigContext)
    const flowStates = [
      'CIRACONFIGURED',
      'GET_CIRA_CONFIG',
      'ADD_TRUSTED_ROOT_CERTIFICATE',
      'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER',
      'SAVE_DEVICE_TO_MPS',
      'ADD_MPS',
      'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'ADD_REMOTE_POLICY_ACCESS_RULE',
      'ENUMERATE_REMOTE_ACCESS_POLICY_RULE',
      'PULL_REMOTE_ACCESS_POLICY_RULE',
      'PUT_REMOTE_ACCESS_POLICY_RULE',
      'USER_INITIATED_CONNECTION_SERVICE',
      'GET_ENVIRONMENT_DETECTION_SETTINGS',
      'PUT_ENVIRONMENT_DETECTION_SETTINGS',
      'SUCCESS'
    ]
    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    ciraConfigurationService.start()
    ciraConfigurationService.send({ type: 'REMOVEPOLICY', clientId: clientId, data: null })
  })

  it('should eventually reach "Failed"', (done) => {
    configuration.services['get-cira-config'] = Promise.reject(new Error())
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

  it('should eventually reach "Failed" at add-trusted-root-certificate state ', (done) => {
    configuration.services['add-trusted-root-certificate'] = Promise.reject(new Error())
    const mockCiraConfigurationMachine = ciraConfiguration.machine.withConfig(configuration)
    const flowStates = [
      'CIRACONFIGURED',
      'GET_CIRA_CONFIG',
      'ADD_TRUSTED_ROOT_CERTIFICATE',
      'FAILURE']
    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILURE') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    ciraConfigurationService.start()
    ciraConfigurationService.send({ type: 'REMOVEPOLICY', clientId: clientId, data: null })
  })

  it('should eventually reach "Failed" at enumerate-management-presence-remote-sap state ', (done) => {
    configuration.services['enumerate-management-presence-remote-sap'] = Promise.reject(new Error())
    const mockCiraConfigurationMachine = ciraConfiguration.machine.withConfig(configuration)
    const flowStates = [
      'CIRACONFIGURED',
      'GET_CIRA_CONFIG',
      'ADD_TRUSTED_ROOT_CERTIFICATE',
      'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER',
      'SAVE_DEVICE_TO_MPS',
      'ADD_MPS',
      'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'FAILURE']
    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILURE') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    ciraConfigurationService.start()
    ciraConfigurationService.send({ type: 'REMOVEPOLICY', clientId: clientId, data: null })
  })

  it('should eventually reach "Failed" at add-mps state ', (done) => {
    configuration.services['add-mps'] = Promise.reject(new Error())
    const mockCiraConfigurationMachine = ciraConfiguration.machine.withConfig(configuration)
    const flowStates = [
      'CIRACONFIGURED',
      'GET_CIRA_CONFIG',
      'ADD_TRUSTED_ROOT_CERTIFICATE',
      'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER',
      'SAVE_DEVICE_TO_MPS',
      'ADD_MPS',
      'FAILURE']
    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILURE') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    ciraConfigurationService.start()
    ciraConfigurationService.send({ type: 'REMOVEPOLICY', clientId: clientId, data: null })
  })

  it('should eventually reach "Failed" at pull-management-presence-remote-sap state ', (done) => {
    configuration.services['pull-management-presence-remote-sap'] = Promise.reject(new Error())
    const mockCiraConfigurationMachine = ciraConfiguration.machine.withConfig(configuration)
    const flowStates = [
      'CIRACONFIGURED',
      'GET_CIRA_CONFIG',
      'ADD_TRUSTED_ROOT_CERTIFICATE',
      'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER',
      'SAVE_DEVICE_TO_MPS',
      'ADD_MPS',
      'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'FAILURE']
    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILURE') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    ciraConfigurationService.start()
    ciraConfigurationService.send({ type: 'REMOVEPOLICY', clientId: clientId, data: null })
  })

  it('should eventually reach "Failed" at add-remote-policy-access-rule state ', (done) => {
    configuration.services['add-remote-policy-access-rule'] = Promise.reject(new Error())
    const mockCiraConfigurationMachine = ciraConfiguration.machine.withConfig(configuration)
    const flowStates = [
      'CIRACONFIGURED',
      'GET_CIRA_CONFIG',
      'ADD_TRUSTED_ROOT_CERTIFICATE',
      'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER',
      'SAVE_DEVICE_TO_MPS',
      'ADD_MPS',
      'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'ADD_REMOTE_POLICY_ACCESS_RULE',
      'FAILURE']
    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILURE') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    ciraConfigurationService.start()
    ciraConfigurationService.send({ type: 'REMOVEPOLICY', clientId: clientId, data: null })
  })

  it('should eventually reach "Failed" at enumerate-remote-access-policy-rule state ', (done) => {
    configuration.services['enumerate-remote-access-policy-rule'] = Promise.reject(new Error())
    const mockCiraConfigurationMachine = ciraConfiguration.machine.withConfig(configuration)
    const flowStates = [
      'CIRACONFIGURED',
      'GET_CIRA_CONFIG',
      'ADD_TRUSTED_ROOT_CERTIFICATE',
      'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER',
      'SAVE_DEVICE_TO_MPS',
      'ADD_MPS',
      'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'ADD_REMOTE_POLICY_ACCESS_RULE',
      'ENUMERATE_REMOTE_ACCESS_POLICY_RULE',
      'FAILURE']
    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILURE') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    ciraConfigurationService.start()
    ciraConfigurationService.send({ type: 'REMOVEPOLICY', clientId: clientId, data: null })
  })

  it('should eventually reach "Failed" at pull-remote-access-policy-rule state ', (done) => {
    configuration.services['pull-remote-access-policy-rule'] = Promise.reject(new Error())
    const mockCiraConfigurationMachine = ciraConfiguration.machine.withConfig(configuration)
    const flowStates = [
      'CIRACONFIGURED',
      'GET_CIRA_CONFIG',
      'ADD_TRUSTED_ROOT_CERTIFICATE',
      'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER',
      'SAVE_DEVICE_TO_MPS',
      'ADD_MPS',
      'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'ADD_REMOTE_POLICY_ACCESS_RULE',
      'ENUMERATE_REMOTE_ACCESS_POLICY_RULE',
      'PULL_REMOTE_ACCESS_POLICY_RULE',
      'FAILURE']
    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILURE') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    ciraConfigurationService.start()
    ciraConfigurationService.send({ type: 'REMOVEPOLICY', clientId: clientId, data: null })
  })

  it('should eventually reach "Failed" at put-remote-access-policy-rule state ', (done) => {
    configuration.services['put-remote-access-policy-rule'] = Promise.reject(new Error())
    const mockCiraConfigurationMachine = ciraConfiguration.machine.withConfig(configuration)
    const flowStates = [
      'CIRACONFIGURED',
      'GET_CIRA_CONFIG',
      'ADD_TRUSTED_ROOT_CERTIFICATE',
      'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER',
      'SAVE_DEVICE_TO_MPS',
      'ADD_MPS',
      'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'ADD_REMOTE_POLICY_ACCESS_RULE',
      'ENUMERATE_REMOTE_ACCESS_POLICY_RULE',
      'PULL_REMOTE_ACCESS_POLICY_RULE',
      'PUT_REMOTE_ACCESS_POLICY_RULE',
      'FAILURE']
    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILURE') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    ciraConfigurationService.start()
    ciraConfigurationService.send({ type: 'REMOVEPOLICY', clientId: clientId, data: null })
  })

  it('should eventually reach "Failed" at user-initiated-connection-service state ', (done) => {
    configuration.services['user-initiated-connection-service'] = Promise.reject(new Error())
    const mockCiraConfigurationMachine = ciraConfiguration.machine.withConfig(configuration)
    const flowStates = [
      'CIRACONFIGURED',
      'GET_CIRA_CONFIG',
      'ADD_TRUSTED_ROOT_CERTIFICATE',
      'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER',
      'SAVE_DEVICE_TO_MPS',
      'ADD_MPS',
      'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'ADD_REMOTE_POLICY_ACCESS_RULE',
      'ENUMERATE_REMOTE_ACCESS_POLICY_RULE',
      'PULL_REMOTE_ACCESS_POLICY_RULE',
      'PUT_REMOTE_ACCESS_POLICY_RULE',
      'USER_INITIATED_CONNECTION_SERVICE',
      'FAILURE']
    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILURE') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    ciraConfigurationService.start()
    ciraConfigurationService.send({ type: 'REMOVEPOLICY', clientId: clientId, data: null })
  })

  it('should eventually reach "Failed" at get-environment-detection-settings state ', (done) => {
    configuration.services['get-environment-detection-settings'] = Promise.reject(new Error())
    const mockCiraConfigurationMachine = ciraConfiguration.machine.withConfig(configuration)
    const flowStates = [
      'CIRACONFIGURED',
      'GET_CIRA_CONFIG',
      'ADD_TRUSTED_ROOT_CERTIFICATE',
      'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER',
      'SAVE_DEVICE_TO_MPS',
      'ADD_MPS',
      'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'ADD_REMOTE_POLICY_ACCESS_RULE',
      'ENUMERATE_REMOTE_ACCESS_POLICY_RULE',
      'PULL_REMOTE_ACCESS_POLICY_RULE',
      'PUT_REMOTE_ACCESS_POLICY_RULE',
      'USER_INITIATED_CONNECTION_SERVICE',
      'GET_ENVIRONMENT_DETECTION_SETTINGS',
      'FAILURE']
    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILURE') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    ciraConfigurationService.start()
    ciraConfigurationService.send({ type: 'REMOVEPOLICY', clientId: clientId, data: null })
  })

  it('should eventually reach "Failed" at put-environment-detection-settings state ', (done) => {
    configuration.services['put-environment-detection-settings'] = Promise.reject(new Error())
    const mockCiraConfigurationMachine = ciraConfiguration.machine.withConfig(configuration)
    const flowStates = [
      'CIRACONFIGURED',
      'GET_CIRA_CONFIG',
      'ADD_TRUSTED_ROOT_CERTIFICATE',
      'SAVE_MPS_PASSWORD_TO_SECRET_PROVIDER',
      'SAVE_DEVICE_TO_MPS',
      'ADD_MPS',
      'ENUMERATE_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'PULL_MANAGEMENT_PRESENCE_REMOTE_SAP',
      'ADD_REMOTE_POLICY_ACCESS_RULE',
      'ENUMERATE_REMOTE_ACCESS_POLICY_RULE',
      'PULL_REMOTE_ACCESS_POLICY_RULE',
      'PUT_REMOTE_ACCESS_POLICY_RULE',
      'USER_INITIATED_CONNECTION_SERVICE',
      'GET_ENVIRONMENT_DETECTION_SETTINGS',
      'PUT_ENVIRONMENT_DETECTION_SETTINGS',
      'FAILURE']
    const ciraConfigurationService = interpret(mockCiraConfigurationMachine).onTransition((state) => {
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('FAILURE') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    ciraConfigurationService.start()
    ciraConfigurationService.send({ type: 'REMOVEPOLICY', clientId: clientId, data: null })
  })

  describe('send wsman message with Management Presence Remote SAP', () => {
    it('should send wsman message to enumerate ManagementPresenceRemoteSAP', async () => {
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
    it('should send to add RemoteAccessService', async () => {
      ciraConfigContext.message = {
        Envelope: { Body: { PullResponse: { Items: { AMT_ManagementPresenceRemoteSAP: { Name: 'abcd' } } } } }
      }
      await ciraConfiguration.addRemoteAccessService(ciraConfigContext, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
  })
  describe('send wsman message for Environment Detection Settings', () => {
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
  })

  describe('send wsman message for Remote Access Policy Applies To MPS', () => {
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

    it('should send wsman message to User Initiated Connection Service', async () => {
      await ciraConfiguration.userInitiatedConnectionService(ciraConfigContext, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
  })

  describe('send wsman message to add MPS server and certificate', () => {
    it('should send wsman message to add Trusted Root Certificate', async () => {
      await ciraConfiguration.addTrustedRootCertificate(ciraConfigContext, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
    it('should send wsman message to add MPS server', async () => {
      await ciraConfiguration.addMPS(ciraConfigContext, null)
      expect(invokeWsmanCallSpy).toHaveBeenCalled()
    })
  })

  it('invokeWsmanCall', async () => {
    invokeWsmanCallSpy.mockRestore()
    void ciraConfiguration.invokeWsmanCall(ciraConfigContext)
    expect(responseMessageSpy).toHaveBeenCalled()
    expect(wrapItSpy).toHaveBeenCalled()
    expect(sendSpy).toHaveBeenCalled()
  })

  describe('update Configuration Status', () => {
    it('should update Configuration Status', () => {
      ciraConfigContext.statusMessage = 'abcd'
      ciraConfiguration.updateConfigurationStatus(ciraConfigContext, null)
      expect(devices[ciraConfigContext.clientId].status.CIRAConnection).toEqual(ciraConfigContext.statusMessage)
    })
  })
})
