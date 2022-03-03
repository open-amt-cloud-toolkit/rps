/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { v4 as uuid } from 'uuid'
import Logger from '../Logger'
import { NodeForge } from '../NodeForge'
import { CertManager } from '../CertManager'
import { Configurator } from '../Configurator'
import { config } from '../test/helper/Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { EnvReader } from '../utils/EnvReader'
import { CIRAConfigurator } from './CIRAConfigurator'
import { TLSConfigurator } from './TLSConfigurator'
import { RPSError } from '../utils/RPSError'
import { devices } from '../WebSocketListener'
import { ClientAction } from '../models/RCS.Config'

EnvReader.GlobalEnvConfig = config
const nodeForge = new NodeForge()
const certManager = new CertManager(new Logger('CertManager'), nodeForge)
const configurator = new Configurator()
const responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
const tlsConfig = new TLSConfigurator(new Logger('CIRAConfig'), certManager, responseMsg)
const ciraConfig = new CIRAConfigurator(new Logger('CIRAConfig'), configurator, responseMsg, tlsConfig)
let clientId, activationmsg

beforeAll(() => {
  clientId = uuid()
  activationmsg = {
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
        activation: 'acmactivate',
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
      action: 'acmactivate',
      mpsUsername: 'admin',
      mpsPassword: 'OUUR#v1aq5EwLGg2'
    }
  }
  const digestChallenge = {
    realm: 'Digest:AF541D9BC94CFF7ADFA073F492F355E6',
    nonce: 'dxNzCQ9JBAAAAAAAd2N7c6tYmUl0FFzQ',
    stale: 'false',
    qop: 'auth'
  }
  devices[clientId] = {
    ClientId: clientId,
    uuid: '4bac9510-04a6-4321-bae2-d45ddf07b684',
    ClientSocket: null,
    ClientData: activationmsg,
    ciraconfig: {},
    network: {},
    status: {},
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

beforeEach(() => {
  jest.resetAllMocks()
})

describe('save MPS password to vault', () => {
  // test('should return false if failed to save', async () => {
  //   const clientObj = devices[clientId]
  //   clientObj.mpsUsername = null
  //   clientObj.mpsPassword = null
  //   const getCiraConfigurationSpy = jest.spyOn(configurator.profileManager, 'getCiraConfiguration').mockImplementation(async () => {
  //     return {
  //       configName: 'config1',
  //       mpsServerAddress: '192.168.1.38',
  //       mpsPort: 4433,
  //       username: 'admin',
  //       password: 'OUUR#v1aq5EwLGg2',
  //       commonName: '192.168.1.38',
  //       serverAddressFormat: 3,
  //       authMethod: 2,
  //       mpsRootCertificate: '==',
  //       proxyDetails: '',
  //       tenantId: ''
  //     }
  //   })
  //   const getMPSPasswordSpy = jest.spyOn(configurator.profileManager, 'getMPSPassword').mockImplementation(async () => { return 'OUUR#v1aq5EwLGg2' })
  //   const getSecretAtPathSpy = jest.spyOn(configurator.secretsManager, 'getSecretAtPath').mockImplementation(async () => { })
  //   const writeSecretWithObjectSpy = jest.spyOn(configurator.secretsManager, 'writeSecretWithObject').mockImplementation(async () => { })
  //   await ciraConfig.setMPSPasswordInVault(clientId)
  //   expect(getCiraConfigurationSpy).toHaveBeenCalled()
  //   expect(getMPSPasswordSpy).toHaveBeenCalled()
  //   expect(getSecretAtPathSpy).toHaveBeenCalled()
  //   expect(writeSecretWithObjectSpy).toHaveBeenCalled()
  // })
})

describe('save Device Information to MPS database', () => {
  test('should return false if failed to save', async () => {
    const clientObj = devices[clientId]
    clientObj.mpsUsername = 'admin'
    clientObj.mpsPassword = 'OUUR#v1aq5EwLGg2'
    const getAmtProfileSpy = jest.spyOn(configurator.profileManager, 'getAmtProfile').mockImplementation(async () => {
      return {
        profileName: 'acm',
        activation: 'acmactivate',
        tenantId: '',
        tags: ['acm']
      }
    })
    const results = await ciraConfig.saveDeviceInfoToMPS(clientId)
    expect(getAmtProfileSpy).toHaveBeenCalled()
    expect(results).toBeFalsy()
  })
  test('should throw an error if mps username and password does not exists ', async () => {
    let rpsError
    const clientObj = devices[clientId]
    clientObj.mpsUsername = null
    clientObj.mpsPassword = null
    try {
      await ciraConfig.saveDeviceInfoToMPS(clientId)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toBe(`Device ${clientObj.uuid} setMPSPassword: mpsUsername or mpsPassword is null`)
  })
})

describe('remove Remote Access Policy Rule', () => {
  test('should return a wsman to delete Policy Rule Name user initiated from AMT', async () => {
    const clientObj = devices[clientId]
    const result = ciraConfig.removeRemoteAccessPolicyRule(clientId)
    expect(result.method).toBe('wsman')
    expect(clientObj.ciraconfig.policyRuleUserInitiate).toBeTruthy()
  })
  test('should return a wsman to delete Policy Rule Name alert from AMT', async () => {
    const clientObj = devices[clientId]
    const result = ciraConfig.removeRemoteAccessPolicyRule(clientId)
    expect(result.method).toBe('wsman')
    expect(clientObj.ciraconfig.policyRuleAlert).toBeTruthy()
  })
  test('should return a wsman to delete Policy Rule Name Periodic from AMT', async () => {
    const clientObj = devices[clientId]
    const result = ciraConfig.removeRemoteAccessPolicyRule(clientId)
    expect(result.method).toBe('wsman')
    expect(clientObj.ciraconfig.policyRulePeriodic).toBeTruthy()
  })
  test('should return null when all the policy rules are deleted', async () => {
    const clientObj = devices[clientId]
    const result = ciraConfig.removeRemoteAccessPolicyRule(clientId)
    expect(result).toBeNull()
    expect(clientObj.ciraconfig.policyRulePeriodic).toBeTruthy()
    expect(clientObj.ciraconfig.policyRuleAlert).toBeTruthy()
    expect(clientObj.ciraconfig.policyRuleUserInitiate).toBeTruthy()
  })
})

describe('validate Management Presence Remote SAP', () => {
  test('should return a wsman to Pull the existing MPS config from AMT', async () => {
    const response = {
      Envelope: {
        Header: {
          To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
          RelatesTo: 4,
          Action: 'http://schemas.xmlsoap.org/ws/2004/09/enumeration/EnumerateResponse',
          MessageID: 'uuid:00000000-8086-8086-8086-000000000129',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_ManagementPresenceRemoteSAP'
        },
        Body: {
          EnumerateResponse: {
            EnumerationContext: '39000000-0000-0000-0000-000000000000'
          }
        }
      }
    }
    const result = ciraConfig.validateManagementPresenceRemoteSAP(clientId, response)
    expect(result.method).toBe('wsman')
  })
  test('should return a wsman to delete the existing config from AMT', async () => {
    const response = {
      Envelope: {
        Header: {
          Action: 'http://schemas.xmlsoap.org/ws/2004/09/enumeration/PullResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_ManagementPresenceRemoteSAP'
        },
        Body: { PullResponse: { Items: { AMT_ManagementPresenceRemoteSAP: { Name: 'Intel(r) AMT:Management Presence Server 0' } } } }
      }
    }
    const result = ciraConfig.validateManagementPresenceRemoteSAP(clientId, response)
    expect(result.method).toBe('wsman')
  })
  test('should return a wsman to enumerate the existing Public Key Certificates from AMT when pull response null', async () => {
    const response = {
      Envelope: {
        Header: {
          Action: 'http://schemas.xmlsoap.org/ws/2004/09/enumeration/PullResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_ManagementPresenceRemoteSAP'
        },
        Body: { PullResponse: { Items: '' } }
      }
    }
    const result = ciraConfig.validateManagementPresenceRemoteSAP(clientId, response)
    expect(result.method).toBe('wsman')
  })
  test('should return a wsman to enumerate the existing Public Key Certificates from AMT', async () => {
    const response = {
      Envelope: {
        Header: {
          To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
          RelatesTo: 6,
          Action: 'http://schemas.xmlsoap.org/ws/2004/09/transfer/DeleteResponse',
          MessageID: 'uuid:00000000-8086-8086-8086-00000000012B',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_ManagementPresenceRemoteSAP'
        },
        Body: ''
      }
    }
    const result = ciraConfig.validateManagementPresenceRemoteSAP(clientId, response)
    expect(result.method).toBe('wsman')
  })
})

describe('validate Public Key Certificate', () => {
  test('should return a wsman to pull Public Key Certificates from AMT', async () => {
    const response = {
      Envelope: {
        Header: {
          Action: 'http://schemas.xmlsoap.org/ws/2004/09/enumeration/EnumerateResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyCertificate'
        },
        Body: { EnumerateResponse: { EnumerationContext: '3F000000-0000-0000-0000-000000000000' } }
      }
    }
    const result = ciraConfig.validatePublicKeyCertificate(clientId, response)
    expect(result.method).toBe('wsman')
  })
  test('should return a wsman to delete Public Key Certificates from AMT', async () => {
    const response = {
      Envelope: {
        Header: {
          Action: 'http://schemas.xmlsoap.org/ws/2004/09/enumeration/PullResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyCertificate'
        },
        Body: {
          PullResponse: {
            Items: { AMT_PublicKeyCertificate: { InstanceID: 'Intel(r) AMT Certificate: Handle: 0' } }
          }
        }
      }
    }
    const result = ciraConfig.validatePublicKeyCertificate(clientId, response)
    expect(result.method).toBe('wsman')
  })
  test('should return a wsman to get Environment Detection Setting Data from AMT', async () => {
    const response = {
      Envelope: {
        Header: {
          Action: 'http://schemas.xmlsoap.org/ws/2004/09/transfer/DeleteResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyCertificate'
        },
        Body: ''
      }
    }
    const result = ciraConfig.validatePublicKeyCertificate(clientId, response)
    expect(result.method).toBe('wsman')
  })
  test('should return wsman to get Environment Detection Setting Data from AMT when no certificates exists', async () => {
    const response = {
      Envelope: {
        Header: {
          Action: 'http://schemas.xmlsoap.org/ws/2004/09/enumeration/PullResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyCertificate'
        },
        Body: {
          PullResponse: {
            Items: ''
          }
        }
      }
    }
    const result = ciraConfig.validatePublicKeyCertificate(clientId, response)
    expect(result.method).toBe('wsman')
  })
})

describe('Validate User Initiated Connection Service ', () => {
  test('should throw an error if trusted Root Certificate is not added ', async () => {
    let rpsError
    const clientObj = devices[clientId]
    const response = {
      Envelope: {
        Header: {
          To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
          RelatesTo: 16,
          Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_UserInitiatedConnectionService/RequestStateChangeResponse',
          MessageID: 'uuid:00000000-8086-8086-8086-00000000024C',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_UserInitiatedConnectionService'
        },
        Body: {
          RequestStateChange_OUTPUT: {
            ReturnValue: 1
          }
        }
      }
    }
    try {
      await ciraConfig.ValidateUserInitiatedConnectionService(clientId, response)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toBe(`Device ${clientObj.uuid} failed to update User Initiated Connection Service.`)
  })
  test('should return a wsman if trusted Root Certificate added ', () => {
    const clientObj = devices[clientId]
    const response = {
      Envelope: {
        Header: {
          To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
          RelatesTo: 16,
          Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_UserInitiatedConnectionService/RequestStateChangeResponse',
          MessageID: 'uuid:00000000-8086-8086-8086-00000000024C',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_UserInitiatedConnectionService'
        },
        Body: {
          RequestStateChange_OUTPUT: {
            ReturnValue: 0
          }
        }
      }
    }
    const result = ciraConfig.ValidateUserInitiatedConnectionService(clientId, response)
    expect(result.method).toBe('wsman')
    expect(clientObj.ciraconfig.userInitConnectionService).toBeTruthy()
  })
})

describe('Validate Environment Detection Setting Data', () => {
  test('should return a wsman to put no Environment Detection Setting Data in AMT', async () => {
    const clientObj = devices[clientId]
    clientObj.ciraconfig.userInitConnectionService = false
    const response = {
      Envelope: {
        Header: {
          Action: 'http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_EnvironmentDetectionSettingData'
        },
        Body: {
          AMT_EnvironmentDetectionSettingData: {
            DetectionAlgorithm: 0,
            DetectionStrings: 'dummy.com',
            ElementName: 'Intel(r) AMT Environment Detection Settings',
            InstanceID: 'Intel(r) AMT Environment Detection Settings'
          }
        }
      }
    }
    const result = await ciraConfig.ValidateEnvironmentDetectionSettingData(clientId, response)
    expect(result.method).toBe('wsman')
    expect(clientObj.ciraconfig.setENVSettingData).toBeTruthy()
  })
  test('should return null when no exiting Environment Detection Setting Data in AMT', async () => {
    const clientObj = devices[clientId]
    clientObj.ciraconfig.userInitConnectionService = false
    const response = {
      Envelope: {
        Header: {
          Action: 'http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_EnvironmentDetectionSettingData'
        },
        Body: {
          AMT_EnvironmentDetectionSettingData: {
            DetectionAlgorithm: 0,
            ElementName: 'Intel(r) AMT Environment Detection Settings',
            InstanceID: 'Intel(r) AMT Environment Detection Settings'
          }
        }
      }
    }
    const result = await ciraConfig.ValidateEnvironmentDetectionSettingData(clientId, response)
    expect(result).toBe(null)
    expect(clientObj.ciraconfig.setENVSettingData).toBeTruthy()
  })
  test('should return null and CIRA connection status should Unconfigured', async () => {
    const clientObj = devices[clientId]
    clientObj.ciraconfig.userInitConnectionService = false
    const response = {
      Envelope: {
        Header: {
          Action: 'http://schemas.xmlsoap.org/ws/2004/09/transfer/PutResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_EnvironmentDetectionSettingData'
        },
        Body: {
          AMT_EnvironmentDetectionSettingData: {
            DetectionAlgorithm: 0,
            ElementName: 'Intel(r) AMT Environment Detection Settings',
            InstanceID: 'Intel(r) AMT Environment Detection Settings'
          }
        }
      }
    }
    const result = await ciraConfig.ValidateEnvironmentDetectionSettingData(clientId, response)
    expect(result).toBe(null)
    expect(clientObj.ciraconfig.setENVSettingData).toBeTruthy()
  })
  test('should return a wsman to put Environment Detection Setting Data in AMT when userInitConnectionService is true', async () => {
    const clientObj = devices[clientId]
    clientObj.ciraconfig.userInitConnectionService = true
    const response = {
      Envelope: {
        Header: {
          Action: 'http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_EnvironmentDetectionSettingData'
        },
        Body: {
          AMT_EnvironmentDetectionSettingData: {
            DetectionAlgorithm: 0,
            ElementName: 'Intel(r) AMT Environment Detection Settings',
            InstanceID: 'Intel(r) AMT Environment Detection Settings'
          }
        }
      }
    }
    const result = await ciraConfig.ValidateEnvironmentDetectionSettingData(clientId, response)
    expect(result.method).toBe('wsman')
    expect(clientObj.ciraconfig.setENVSettingData).toBeTruthy()
  })
  test('should return success and CIRA connection status should Configured', async () => {
    const clientObj = devices[clientId]
    clientObj.ciraconfig.userInitConnectionService = false
    const response = {
      Envelope: {
        Header: {
          Action: 'http://schemas.xmlsoap.org/ws/2004/09/transfer/PutResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_EnvironmentDetectionSettingData'
        },
        Body: {
          AMT_EnvironmentDetectionSettingData: {
            DetectionAlgorithm: 0,
            DetectionStrings: 'dummy.com',
            ElementName: 'Intel(r) AMT Environment Detection Settings',
            InstanceID: 'Intel(r) AMT Environment Detection Settings'
          }
        }
      }
    }
    const result = await ciraConfig.ValidateEnvironmentDetectionSettingData(clientId, response)
    expect(result.method).toBe('success')
    expect(clientObj.status.CIRAConnection).toBe('Configured')
  })
})

describe('Validate Public Key Management Service', () => {
  test('should throw an error if trusted Root Certificate is not added ', async () => {
    let rpsError
    const response = {
      Envelope: {
        Header: {
          To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
          RelatesTo: 11,
          Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyManagementService/AddTrustedRootCertificateResponse',
          MessageID: 'uuid:00000000-8086-8086-8086-000000000238',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyManagementService'
        },
        Body: {
          AddTrustedRootCertificate_OUTPUT: {
            ReturnValue: 1
          }
        }
      }
    }
    try {
      await ciraConfig.ValidatePublicKeyManagementService(clientId, response)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toBe('Device 4bac9510-04a6-4321-bae2-d45ddf07b684 failed to add Trusted Root Certificate.')
  })
  test('should return a wsman if trusted Root Certificate added ', async () => {
    const setMPSPasswordSpy = jest.spyOn(ciraConfig, 'setMPSPasswordInVault').mockImplementation(async () => { })
    const saveDeviceInfoToMPSSpy = jest.spyOn(ciraConfig, 'saveDeviceInfoToMPS').mockImplementation(async () => { return true })
    const response = {
      Envelope: {
        Header: {
          To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
          RelatesTo: 11,
          Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyManagementService/AddTrustedRootCertificateResponse',
          MessageID: 'uuid:00000000-8086-8086-8086-000000000238',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyManagementService'
        },
        Body: {
          AddTrustedRootCertificate_OUTPUT: {
            CreatedCertificate: {
              Address: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
              ReferenceParameters: {
                ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyCertificate',
                SelectorSet: {
                  Selector: 'Intel(r) AMT Certificate: Handle: 0'
                }
              }
            },
            ReturnValue: 0
          }
        }
      }
    }
    const result = await ciraConfig.ValidatePublicKeyManagementService(clientId, response)
    expect(setMPSPasswordSpy).toHaveBeenCalled()
    expect(saveDeviceInfoToMPSSpy).toHaveBeenCalled()
    expect(result.method).toBe('wsman')
  })
})

describe('Validate Remote Access Service', () => {
  test('should throw an error if it is failed to add MPS server', async () => {
    let rpsError
    const clientObj = devices[clientId]
    const response = {
      Envelope: {
        Header: {
          Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RemoteAccessService/AddMpServerResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RemoteAccessService'
        },
        Body: {
          AddMpServer_OUTPUT: {
            ReturnValue: 1
          }
        }
      }
    }
    try {
      await ciraConfig.ValidateRemoteAccessService(clientId, response)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toBe(`Device ${clientObj.uuid} failed to add MPS server.`)
  })
  test('should return a wsman if  MPS server added ', () => {
    const response = {
      Envelope: {
        Header: {
          Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RemoteAccessService/AddMpServerResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RemoteAccessService'
        },
        Body: {
          AddMpServer_OUTPUT: {
            ReturnValue: 0
          }
        }
      }
    }
    const result = ciraConfig.ValidateRemoteAccessService(clientId, response)
    expect(result.method).toBe('wsman')
  })
  test('should throw an error if it is failed to add remote policy rule', async () => {
    let rpsError
    const clientObj = devices[clientId]
    const response = {
      Envelope: {
        Header: {
          Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RemoteAccessService/AddRemoteAccessPolicyRuleResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RemoteAccessService'
        },
        Body: {
          AddRemoteAccessPolicyRule_OUTPUT: {
            ReturnValue: 1
          }
        }
      }
    }
    try {
      await ciraConfig.ValidateRemoteAccessService(clientId, response)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toBe(`Device ${clientObj.uuid} failed to add access policy rule.`)
  })
  test('should return a wsman if remote policy rule is added ', () => {
    const response = {
      Envelope: {
        Header: {
          Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RemoteAccessService/AddRemoteAccessPolicyRuleResponse',
          ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RemoteAccessService'
        },
        Body: {
          AddRemoteAccessPolicyRule_OUTPUT: {
            ReturnValue: 0
          }
        }
      }
    }
    const result = ciraConfig.ValidateRemoteAccessService(clientId, response)
    expect(result.method).toBe('wsman')
  })
})

describe('process WSMan Response', () => {
  test('should return a wsman if the status code 401', async () => {
    const message = {
      payload: { statusCode: 401 }
    }
    const result = await ciraConfig.processWSManJsonResponse(message, clientId)
    expect(result.method).toBe('wsman')
  })
  test('should return a wsman if status code is 400', async () => {
    const message = {
      payload: {
        statusCode: 400,
        body: {
          contentType: 'application/soap+xml',
          text: '04EC\r\n<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:g="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:f="http://schemas.xmlsoap.org/ws/2004/08/eventing" xmlns:e="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2004/09/transfer" xmlns:c="http://schemas.xmlsoap.org/ws/2004/09/enumeration" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:h="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:i="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>2</b:RelatesTo><b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/08/addressing/fault</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-00000000211E</b:MessageID></a:Header><a:Body><a:Fault><a:Code><a:Value>a:Sender</a:Value><a:Subcode><a:Value>b:DestinationUnreachable</a:Value></a:Subcode></a:Code><a:Reason><a:Text xml:lang="en-US">No route can be determined to reach the destination role defined by the WSAddressing To.</a:Text></a:Reason><a:Detail></a:Detail></a:Fault></a:Body></a:En\r\n0007\r\nvelope>\r\n0\r\n\r\n'
        }
      }
    }
    const result = await ciraConfig.processWSManJsonResponse(message, clientId)
    expect(result.method).toBe('wsman')
  })
  test('should return a wsman if status code is 400', async () => {
    const message = {
      payload: {
        statusCode: 400,
        body: {
          contentType: 'application/soap+xml',
          text: '04EC\r\n<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:g="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:f="http://schemas.xmlsoap.org/ws/2004/08/eventing" xmlns:e="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2004/09/transfer" xmlns:c="http://schemas.xmlsoap.org/ws/2004/09/enumeration" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:h="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:i="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>2</b:RelatesTo><b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/08/addressing/fault</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-00000000211E</b:MessageID></a:Header><a:Body><a:Fault><a:Code><a:Value>a:Sender</a:Value><a:Subcode><a:Value>b:DestinationUnreachable</a:Value></a:Subcode></a:Code><a:Reason><a:Text xml:lang="en-US">No route can be determined to reach the destination role defined by the WSAddressing To.</a:Text></a:Reason><a:Detail></a:Detail></a:Fault></a:Body></a:En\r\n0007\r\nvelope>\r\n0\r\n\r\n'
        }
      }
    }
    const result = await ciraConfig.processWSManJsonResponse(message, clientId)
    expect(result.method).toBe('wsman')
  })
  test('should return a wsman if status code is 200 and method is AMT_RemoteAccessPolicyRule', async () => {
    const message = {
      payload: {
        protocolVersion: 'HTTP/1.1',
        statusCode: 200,
        body: {
          text: '038B\r\n<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>3</b:RelatesTo><b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/09/transfer/DeleteResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-000000000148</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RemoteAccessPolicyRule</c:ResourceURI></a:Header><a:Body></a:Body></a:Envelope>\r\n0\r\n\r\n'
        }
      }
    }
    const result = await ciraConfig.processWSManJsonResponse(message, clientId)
    expect(result.method).toBe('wsman')
  })
  test('should return a wsman if status code is 200 and method is AMT_ManagementPresenceRemoteSAP', async () => {
    const message = {
      payload: {
        statusCode: 200,
        body: {
          text: '0390\r\n<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>6</b:RelatesTo><b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/09/transfer/DeleteResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-000000000178</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_ManagementPresenceRemoteSAP</c:ResourceURI></a:Header><a:Body></a:Body></a:Envelope>\r\n0\r\n\r\n'
        }
      }
    }
    const result = await ciraConfig.processWSManJsonResponse(message, clientId)
    expect(result.method).toBe('wsman')
  })
  test('should return a wsman if status code is 200 and method is AMT_PublicKeyCertificate', async () => {
    const message = {
      payload: {
        statusCode: 200,
        body: {
          text: '041D\r\n<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://schemas.xmlsoap.org/ws/2004/09/enumeration" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>7</b:RelatesTo><b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/09/enumeration/PullResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-000000002123</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyCertificate</c:ResourceURI></a:Header><a:Body><g:PullResponse><g:Items></g:Items><g:EndOfSequence></g:EndOfSequence></g:PullResponse></a:Body></a:Envelope>\r\n0\r\n\r\n'
        }
      }
    }
    const result = await ciraConfig.processWSManJsonResponse(message, clientId)
    expect(result.method).toBe('wsman')
  })
  test('should return a wsman if status code is 200 and method is AMT_EnvironmentDetectionSettingData', async () => {
    const message = {
      payload: {
        statusCode: 200,
        body: {
          text: '04F9\r\n<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_EnvironmentDetectionSettingData" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>8</b:RelatesTo><b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-00000000212B</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_EnvironmentDetectionSettingData</c:ResourceURI></a:Header><a:Body><g:AMT_EnvironmentDetectionSettingData><g:DetectionAlgorithm>0</g:DetectionAlgorithm><g:ElementName>Intel(r) AMT Environment Detection Settings</g:ElementName><g:InstanceID>Intel(r) AMT Environment Detection Settings</g:InstanceID></g:AMT_EnvironmentDetectionSettingData></a:Body></a:Envelope>\r\n0\r\n\r\n'
        }
      }
    }
    const result = await ciraConfig.processWSManJsonResponse(message, clientId)
    expect(result).toBeNull()
  })
  test('should return a wsman if status code is 200 and method is AMT_PublicKeyManagementService', async () => {
    const message = {
      payload: {
        statusCode: 200,
        body: {
          text: '0508\r\n<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyManagementService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>9</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyManagementService/AddTrustedRootCertificateResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-00000000212C</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyManagementService</c:ResourceURI></a:Header><a:Body><g:AddTrustedRootCertificate_OUTPUT><g:CreatedCertificate><b:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:Address><b:ReferenceParameters><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_PublicKeyCertificate</c:ResourceURI><c:S\r\n00F3\r\nelectorSet><c:Selector Name="InstanceID">Intel(r) AMT Certificate: Handle: 0</c:Selector></c:SelectorSet></b:ReferenceParameters></g:CreatedCertificate><g:ReturnValue>0</g:ReturnValue></g:AddTrustedRootCertificate_OUTPUT></a:Body></a:Envelope>\r\n0\r\n\r\n'
        }
      }
    }
    const result = await ciraConfig.processWSManJsonResponse(message, clientId)
    expect(result.method).toBe('wsman')
  })
  test('should return a wsman if status code is 200 and method is AMT_RemoteAccessService', async () => {
    const message = {
      payload: {
        statusCode: 200,
        body: {
          text: '0508\r\n<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RemoteAccessService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>10</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RemoteAccessService/AddMpServerResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-00000000212D</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_RemoteAccessService</c:ResourceURI></a:Header><a:Body><g:AddMpServer_OUTPUT><g:MpServer><b:Address>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:Address><b:ReferenceParameters><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_ManagementPresenceRemoteSAP</c:ResourceURI><c:SelectorSet><c:Selector Name="CreationClassName">AMT\r\n017A\r\n_ManagementPresenceRemoteSAP</c:Selector><c:Selector Name="Name">Intel(r) AMT:Management Presence Server 0</c:Selector><c:Selector Name="SystemCreationClassName">CIM_ComputerSystem</c:Selector><c:Selector Name="SystemName">Intel(r) AMT</c:Selector></c:SelectorSet></b:ReferenceParameters></g:MpServer><g:ReturnValue>0</g:ReturnValue></g:AddMpServer_OUTPUT></a:Body></a:Envelope>\r\n0\r\n\r\n'
        }
      }
    }
    const result = await ciraConfig.processWSManJsonResponse(message, clientId)
    expect(result.method).toBe('wsman')
  })
  test('should return a wsman if status code is 200 and method is AMT_UserInitiatedConnectionService', async () => {
    const message = {
      payload: {
        statusCode: 200,
        body: {
          text: '0472\r\n<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_UserInitiatedConnectionService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>14</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_UserInitiatedConnectionService/RequestStateChangeResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-000000002131</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_UserInitiatedConnectionService</c:ResourceURI></a:Header><a:Body><g:RequestStateChange_OUTPUT><g:ReturnValue>0</g:ReturnValue></g:RequestStateChange_OUTPUT></a:Body></a:Envelope>\r\n0\r\n\r\n'
        }
      }
    }
    const result = await ciraConfig.processWSManJsonResponse(message, clientId)
    expect(result.method).toBe('wsman')
  })
})

describe('execute CIRA Configuration', () => {
  test('should return a wsman if the status code 401', async () => {
    const message = {
      payload: { statusCode: 401 }
    }
    const result = await ciraConfig.execute(message, clientId)
    expect(result.method).toBe('wsman')
  })
  test('should return wsman to delete access policy rule if the message is activation message', async () => {
    // const setprocessWSManJsonResponseSpy = jest.spyOn(ciraConfig, 'processWSManJsonResponse').mockImplementation(async () => { return null })
    const clientObj = devices[clientId]
    clientObj.ciraconfig.policyRuleUserInitiate = false
    clientObj.ciraconfig.policyRuleAlert = false
    clientObj.ciraconfig.policyRulePeriodic = false
    const result = await ciraConfig.execute(activationmsg, clientId)
    expect(result.method).toBe('wsman')
  })
  test('should return wsman if CIRA Config exists and setENVSettingData is true', async () => {
    const clientObj = devices[clientId]
    clientObj.ClientData.payload.profile.ciraConfigName = 'config1'
    clientObj.ciraconfig.setENVSettingData = true
    clientObj.ciraconfig.addTrustedRootCert = undefined
    clientObj.ciraconfig.policyRuleUserInitiate = true
    clientObj.ciraconfig.policyRuleAlert = true
    clientObj.ciraconfig.policyRulePeriodic = true
    const result = await ciraConfig.execute(null, clientId)
    expect(result.method).toBe('wsman')
  })
  test('should return success message if CIRA Config and TLS Config does not exist for profile', async () => {
    const removeRemoteAccessPolicyRuleSpy = jest.spyOn(ciraConfig, 'removeRemoteAccessPolicyRule').mockImplementation(() => { return null })
    const clientObj = devices[clientId]
    clientObj.ClientData.payload.profile.ciraConfigName = null
    clientObj.ciraconfig.setENVSettingData = true
    const result = await ciraConfig.execute(null, clientId)
    expect(removeRemoteAccessPolicyRuleSpy).toHaveBeenCalled()
    expect(result.method).toBe('success')
  })
  test('should set action to TLS if TLS Config exists and CIRA Config does not exist for profile', async () => {
    const removeRemoteAccessPolicyRuleSpy = jest.spyOn(ciraConfig, 'removeRemoteAccessPolicyRule').mockImplementation(() => { return null })
    const clientObj = devices[clientId]
    clientObj.ClientData.payload.profile.ciraConfigName = null
    clientObj.ClientData.payload.profile.tlsCerts = { certbin: '' }
    clientObj.ciraconfig.setENVSettingData = true
    await ciraConfig.execute(null, clientId)
    expect(removeRemoteAccessPolicyRuleSpy).toHaveBeenCalled()
    expect(clientObj.action).toBe(ClientAction.TLSCONFIG)
  })
})
