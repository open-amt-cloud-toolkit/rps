/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import { v4 as uuid } from 'uuid'
import { Activator } from '../actions/Activator'
import Logger from '../Logger'
import { SignatureHelper } from '../utils/SignatureHelper'
import { NodeForge } from '../NodeForge'
import { CertManager } from '../CertManager'
import { Configurator } from '../Configurator'
import { config } from './helper/Config'
import { ClientManager } from '../ClientManager'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { WSManProcessor } from '../WSManProcessor'
import { Validator } from '../Validator'
import { EnvReader } from '../utils/EnvReader'
import { CIRAConfigurator } from '../actions/CIRAConfigurator'
import { ClientAction } from '../models/RCS.Config'
import { NetworkConfigurator } from '../actions/NetworkConfigurator'
import { PasswordHelper } from '../utils/PasswordHelper'
import { TLSConfigurator } from '../actions/TLSConfigurator'
// EnvReader.InitFromEnv(config);
EnvReader.GlobalEnvConfig = config
const nodeForge = new NodeForge()
const certManager = new CertManager(new Logger('CertManager'), nodeForge)
const helper = new SignatureHelper(nodeForge)
const configurator = new Configurator()
const clientManager = ClientManager.getInstance(new Logger('ClientManager'))
const responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'), nodeForge)
const amtwsman = new WSManProcessor(new Logger('WSManProcessor'), clientManager, responseMsg)
const validator = new Validator(new Logger('Validator'), configurator, clientManager, nodeForge)
const tlsConfig = new TLSConfigurator(new Logger('CIRAConfig'), certManager, responseMsg, amtwsman, clientManager)
const ciraConfig = new CIRAConfigurator(new Logger('CIRAConfig'), configurator, responseMsg, amtwsman, clientManager, tlsConfig)
const networkConfigurator = new NetworkConfigurator(new Logger('NetworkConfig'), configurator, responseMsg, amtwsman, clientManager, validator, ciraConfig)
const activator = new Activator(new Logger('Activator'), configurator, certManager, helper, responseMsg, amtwsman, clientManager, validator, networkConfigurator)
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
      profile: 'profile1',
      action: 'acmactivate'
    }
  }
  clientManager.addClient({
    ClientId: clientId,
    ClientSocket: null,
    ClientData: activationmsg,
    ciraconfig: {},
    network: {},
    status: {},
    activationStatus: {}
  })
})

describe('execute function', () => {
  test('should throw an error when the payload is null', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = activationmsg.payload.uuid
    clientManager.setClientObject(clientObj)
    const clientMsg = { payload: null }
    const responseMsg = await activator.execute(clientMsg, clientId)
    expect(responseMsg.message).toEqual(`{"Status":"Device ${activationmsg.payload.uuid} activation failed. Missing/invalid WSMan response payload."}`)
  })
})

describe('GetProvisioningCertObj', () => {
  test('should return error message if unable to convert pfx to object', async () => {
    const message = activationmsg
    const cert = 'MIIKVwIBAzCCChMGCSqGSIb3DQEHAaCCCgQEggoAMIIJ/DCCBg0GCSqGSIb3DQEHAaCCBf4EggX6MIIF9jCCBfIGCyqGSIb3DQEMCgECoIIE9jCCBPIwHAYKKoZIhvcNAQwBAzAOBAh87TxEXvCz4gICB9AEggTQByKBFqxmLXd3UekvURxlJnJ2HkZQmsL4OIxlB3TGm/bpNqCsIWuxmO9+Af4fl/hPYfYlokD2RtyPCUNI8wSRfsVcRclCBfZZcETvGrKFiGb6b9/siutflbjOPAZkzlU9DrbbY+RbxzT6xfPbAGDerao/pP7MRFCQMAXMpFzwdu+DZvEjLjSrFlyR4C7/IvukojSIM3inxEyHh+LsCSCzAKKroOvJavGHNz7CInBZVmOgoLFl1YB1bLhFsj6vRr3dADwdMrc2N/wEx+Y0HpJr/IAWBlqTdqL1zB8m9uDN/SV2dBihZkQ6yRGV8TaI16Ml4JsC6jarmhCyK1vT3PjwuvxORooXhmpRvn34/1gHYlJaVJkNW6eS/QmQ2eiPOybAd8EZNIujRAwHeKGuMaJ0ZktX3porKCQDP8nXW3KEAWVGARjy1uhmj852NblwFFiJUMK/rKSgCdXuBLK9KuZn2dPSw6zkTI8a3UtqSjqS6psnfDTPxX4jR5tzEKEiyVKYtN0gD8plI75jfpfXAe9Xf3i9PsuGjZsI5wCYtyW36X8Yz78aUbtpcebIPKRMI6FXbFcJpkoSpbmGZIaEJUeC+hhnNk0sRKTEGYR/JsYOTKE0kKkt5dviFO50sfb+JmfO+Jq2iJ9xQRU/Sxj8FTjIa12NlwHz4q7IMDyrzUL5eeWY28iG6jgl5QldV6lvL3dfKoPakIw94G1EY77rOubLC1DsWJ00QYe1W7J8Jz5lnnJQWr+gQko4G7e8xfnOKtoYapFDfsXme+3Grs4bHudpTvUrt8n2aCRbHUB3xv2fGezN1PY6bYtQschuftwF676TDBp2PpCCm2lk5OcfXL5bYu7H58c5Ozb1m3zICmR3Q81LkuX1b6MmrT/0hzelCfKxocUqP4pm0SxYWu1B9XO0i5O3UF7kEiBPKvgKm+J2M0WBkNc2iTUNh29fouQdGRvVuRegdPyLfwxI246tFUBzZtHN5BWcY1HrQJYwNgSilsuJgp+8Oy2cHutfJVvUdCmZw+fzjkzTxw//AEM8XrucWi+uTDra949VysFrKKHLjM5mCXZJ5f/mGOu1czzFD7H1R4unUy/vCe4p1Mevz4xPz6iR075e/H81xQ52mIvxnAoftapneke6PMAhI8LokDB4zY/zHDwrAmLBaQkM76Owo2GK98BwJ8xZU3dHjyB3Hd80Ijo6Zu/lSsSjjYcUB2PMjS956/lamHbdZNZ1Xh5EpSnupRly/Ekxl0DRErATsQLksBIqocotO9WgsVF0ZhyEyjeRnZq4zkjXWzawHjVj0FflrxuFNPwAmFXlJ+ksnBBeIhYBGJG5kIqU4zCqBKRYW0taAInrQU+ld+zo/F/ecTUW0XEbMOkP8CLjgO1vfA0sBN27D/k/1jfDkDY18t3X+3plQgoLMJYx4iiq874TOp6sjSv3cuee0PmaC58CqH1njpIyQ9SQ4lJVHhFjIhlkfXumheFkiZK96V6aontaJb63WkoNRwWJkWyUTfAaRyM2hs86wLfyzesj6hSFlXVnyOwruKHTc+ZLHG+E3+fwXleo1MHzefxaezaMHiBZQ7DjbX7eCH1B43/vXcYmbsZjy3t/6f5tYjSXblk7u7aJxQU8RJ5ZVLuefPbhWEPvxVExgegwDQYJKwYBBAGCNxECMQAwEwYJKoZIhvcNAQkVMQYEBAEAAAAwVwYJKoZIhvcNAQkUMUoeSAA4AGYANgAwADkANQA1ADAALQA3ADUANQBjAC0ANAAxADkAMwAtAGEANgBmADMALQBiADkAYgBhADYAYQBiAGEAYQBmADEAYTBpBgkrBgEEAYI3EQExXB5aAE0AaQBjAHIAbwBzAG8AZgB0ACAAUgBTAEEAIABTAEMAaABhAG4AbgBlAGwAIABDAHIAeQBwAHQAbwBnAHIAYQBwAGgAaQBjACAAUAByAG8AdgBpAGQAZQByMIID5wYJKoZIhvcNAQcGoIID2DCCA9QCAQAwggPNBgkqhkiG9w0BBwEwHAYKKoZIhvcNAQwBAzAOBAhUGMWP4bmnWAICB9CAggOgjXn05KrT5Cj45Ci8ofkihdsI9F8pVs1O/NU2CW6ltOHO0x/rxD5w9qF8MMIZF0RKOJQDcfur8+PAIduWezAxhJ64NEezN8gL+YY1DIGgUnV1mgPAF7VX+IST2iCmEA/qLjB3Vx7ry8DLmDKvrbOQEDTs8sHxPtb9DCHrTo4H75cjIznXSOgMB7MLCyAH2swLSn9OJQci1AWCscV25SdZyAqLpC/tcdZRrS/nGlOWLEcbLjdfd+ni5bDxg2p586xeTG3n9X1j5Ka1gzx1f6d8zpklJzvo9o/6FfEG6ZkdpHJKLYYW4AdS7IYqV+MTKj5LoYNVHbhfvJ/xukg0FR7c3F+ganMMzgNrnxtxFvW2UmTvZ9YAA16zzj+tOcYGGSkoABGhkpRXP0M4jdU2YKf4wupAgz4rqvsc1eve5Kqq/s+rQLS2epvzIyuQSisD+x6mmh1/nktXonmKcJ1Thgaa34VwRXnRZs613qE3x1yKCt0DSmq/4mu1/qjQnrR9aPQr/HFzsoLlvgutxQqOjSylEFptznLFCQtkSmUg4ngJbUlb1cqeOL63uVjD2ezAOOJCZNDiGqUm055ApyHRoKzN2Uuo2kA8ztvE5EMgbuLf/pQ6TvLPcGhJwB8nztHsOHIryXe9zbyE1N8EP/gfJSS3P8u49W4eesFbEmxpZnTUJS4jU96SGJ0SCLGK5LrD7T1tZpwNtqH2jpNwWry3IUdDO91IDcpFsNkMYnl4MEiZo/Dz276aAa2MDPwBcJcj4eOjdg40voL5hyXu9L8WJ32CqRBQsl0QmpBXrB1Z7L1T/ul5tSkRk+BAleWs0yQpDoJC7b3xwHeld10gZAbGY7xC5XvUkdfhFMI5HFCDiKBpnznz3q9bTq3eDnFStJEcpYx2jrjGC6P9OHpyZFxhnrlBUoNyI9/vRwEk4DjoIfBCzzK2ObsWW+rctiJjWWytl6NE5qM7hw2yZXfGb1b4LO/DXAbQNkXDL5jZVa0UiRYwLRNtcKmCqoLFdJxpeTI6Hd4p13KekeyQGxobRsyNClKOZT2AWVL6O3hO5KJ64pTzJx3nsQ6nz/b4N2eoP1Zh0D/C2YoqAWTtfrBo08oTa1YVTF/5Y/TANNMqPOdmJ9mqeYqOGfywF2+h8LXzVhuxyMkphKZA9/MTnjOGRlCofV0jYgbSx+lShWM79C6ubeZ8AKTqRtEvntroQ+4u8CMi84vUhE/ZwsQ4k2v58FKyPRITlzA7MB8wBwYFKw4DAhoEFByn+twX67VAipMWejWpWKwm+1SoBBQe/uAU6R0627jkSAR8BG60XbWAHgICB9A='
    const password = null
    const result = activator.GetProvisioningCertObj(message, cert, password, clientId)
    expect(result.errorText).toBe('Decrypting provisioning certificate failed.')
  })
  test('should return null if unable to get provisioning certificate', async () => {
    const message = activationmsg
    const cert = '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'
    const password = 'Intel123!'
    const result = activator.GetProvisioningCertObj(message, cert, password, clientId)
    expect(result).toBe(undefined)
  })
  test('should successfully return valid certificate object', async () => {
  })
})

describe('processWSManJasonResponse', () => {
  test('should throw an error if the digest realm is invalid', async () => {
    const message = { payload: { AMT_GeneralSettings: { response: { DigestRealm: null } } } }
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.ClientData.payload.digestRealm = null
    try {
      await activator.processWSManJsonResponse(message, clientId)
    } catch (error) {
      expect(error.message).toBe(`Device ${activationmsg.payload.uuid} activation failed. Not a valid digest realm.`)
    }
  })
  test('should populate hostname and digest realm after GeneralSettings call', async () => {
    const message = { payload: { AMT_GeneralSettings: { response: { DigestRealm: 'Digest:A4070000000000000000000000000000' } } } }
    const clientObj = clientManager.getClientObject(clientId)
    await activator.processWSManJsonResponse(message, clientId)
    expect(clientObj.ClientData.payload.digestRealm).toBeDefined()
    expect(clientObj.hostname).toBe(clientObj.ClientData.payload.hostname)
  })
  test('should populate fwNonce and modes after IPS_HostBasedSetupService call', async () => {
    const message = { payload: { IPS_HostBasedSetupService: { response: { ConfigurationNonce: 'abcd1234=', AllowedControlModes: [2, 1] } } } }
    const clientObj = clientManager.getClientObject(clientId)
    await activator.processWSManJsonResponse(message, clientId)
    expect(clientObj.ClientData.payload.fwNonce).toBeDefined()
    expect(clientObj.ClientData.payload.modes).toEqual([2, 1])
  })
  test('should throw an error if adding a certificate to AMT fails', async () => {
    const message = { payload: { Header: { Method: 'AddNextCertInChain' }, Body: { ReturnValue: 1 } } }
    const clientObj = clientManager.getClientObject(clientId)
    try {
      await activator.processWSManJsonResponse(message, clientId)
    } catch (error) {
      expect(error.message).toEqual(`Device ${clientObj.uuid} activation failed. Error while adding the certificates to AMT.`)
    }
  })
  test('logger reports certificate was added to device', async () => {
  })
  test('should throw an error if ACM activation fails', async () => {
    const message = { payload: { Header: { Method: 'AdminSetup' }, Body: { ReturnValue: 1 } } }
    const clientObj = clientManager.getClientObject(clientId)
    try {
      await activator.processWSManJsonResponse(message, clientId)
    } catch (error) {
      expect(error.message).toEqual(`Device ${clientObj.uuid} activation failed. Error while activating the AMT device in admin mode.`)
    }
  })
  test('should populate ciraconfig.status and activationStatus if ACM activation successful', async () => {
  })
  test('should throw an error if CCM activation fails', async () => {
    const message = { payload: { Header: { Method: 'Setup' }, Body: { ReturnValue: 1 } } }
    const clientObj = clientManager.getClientObject(clientId)
    try {
      await activator.processWSManJsonResponse(message, clientId)
    } catch (error) {
      expect(error.message).toEqual(`Device ${clientObj.uuid} activation failed. Error while activating the AMT device in client mode.`)
    }
  })
  test('should populate ciraconfig.status and activationStatus if CCM activation successful', async () => {
  })
  test('should thow an error if receives an invalid response', async () => {
    const message = { payload: { Header: { Method: 'badrequest' }, Body: { ReturnValue: 0 } } }
    const clientObj = clientManager.getClientObject(clientId)
    try {
      await activator.processWSManJsonResponse(message, clientId)
    } catch (error) {
      expect(error.message).toEqual(`Device ${clientObj.uuid} sent an invalid response.`)
    }
  })
  test('logger reports that MEBx password was updated', async () => {

  })
})

describe('waitForActivation', () => {
  test('should populate delayEndTime if it is currently set to null', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    expect(clientObj.delayEndTime).toBeUndefined()
    await activator.waitAfterActivation(clientId, clientObj)
    expect(clientObj.delayEndTime).toBeDefined()
  })
  test('should heartbeat if current time is less than delayEndTime', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    const currentTime = new Date().getTime()
    clientObj.delayEndTime = currentTime + 1000000000000
    const responseMsg = await activator.waitAfterActivation(clientId, clientObj)
    expect(responseMsg).toEqual({ apiKey: 'xxxxx', appVersion: '1.2.0', message: '', method: 'heartbeat_request', payload: '', protocolVersion: '4.0.0', status: 'heartbeat' })
  })
  test('should set next action as NETWORKCONFIG once heartbeat has ended for ACM', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    const currentTime = new Date().getTime()
    clientObj.action = ClientAction.ADMINCTLMODE
    clientObj.delayEndTime = currentTime
    clientObj.mebxPassword = 'P@ssw0rd'
    const message = {
      Header: {
        To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
        RelatesTo: '7',
        Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService/SetMEBxPasswordResponse',
        MessageID: 'uuid:00000000-8086-8086-8086-00000000019D',
        ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService',
        Method: 'SetMEBxPassword'
      },
      Body: {
        ReturnValue: 0,
        ReturnValueStr: 'SUCCESS'
      }
    }
    await activator.waitAfterActivation(clientId, clientObj, message)
    expect(clientObj.action).toBe(ClientAction.NETWORKCONFIG)
  })
  test('should set next action as NETWORKCONFIG once heartbeat has ended for ACM', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    const currentTime = new Date().getTime()
    clientObj.action = ClientAction.CLIENTCTLMODE
    clientObj.delayEndTime = currentTime
    await activator.waitAfterActivation(clientId, clientObj)
    expect(clientObj.action).toBe(ClientAction.NETWORKCONFIG)
  })
})

describe('performACMSteps', () => {
  test('should throw an error when the certificate does not exist on server', async () => {
  })
  test('should throw an error when the certificate does not match trusted list from AMT', async () => {
  })
  test('should throw error if receive an error when retreiving certificate', async () => {

  })
})

describe('injectCertificate', () => {
  const spy = jest.spyOn(amtwsman, 'getCertChainWSManResponse')
  test('updates client count when count === certChain.length', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.count = 1
    clientObj.certObj = {}
    clientObj.certObj.certChain = ['cert']
    await activator.injectCertificate(clientId, clientObj)
    expect(clientObj.count).toBeGreaterThan(clientObj.certObj.certChain.length)
  })
  test('updates client count when count <= certChain.length', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.count = 0
    clientObj.certObj = {}
    clientObj.certObj.certChain = ['cert']
    await activator.injectCertificate(clientId, clientObj)
    expect(clientObj.count).toBeLessThanOrEqual(clientObj.certObj.certChain.length)
  })
  test('amt wsman call to update leaf certificate', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.count = 0
    clientObj.certObj = {}
    clientObj.certObj.certChain = ['leaf', 'inter1', 'inter2', 'root']
    await activator.injectCertificate(clientId, clientObj)
    expect(spy).toHaveBeenCalled()
    expect(clientObj.count).toBe(1)
  })
  test('amt wsman call to update intermediate certificate', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.count = 2
    clientObj.certObj = {}
    clientObj.certObj.certChain = ['leaf', 'inter1', 'inter2', 'root']
    await activator.injectCertificate(clientId, clientObj)
    expect(spy).toHaveBeenCalled()
    expect(clientObj.count).toBe(3)
  })
  test('amt wsman call to update root certificate', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.count = 3
    clientObj.certObj = {}
    clientObj.certObj.certChain = ['leaf', 'inter1', 'inter2', 'root']
    await activator.injectCertificate(clientId, clientObj)
    expect(spy).toHaveBeenCalled()
    expect(clientObj.count).toBe(4)
  })
})

describe('createSignedString', () => {
  test('should return valid signed string when certificate is valid', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.ClientData.payload.fwNonce = PasswordHelper.generateNonce()
    clientObj.nonce = PasswordHelper.generateNonce()

    const pfxb64: string = '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'
    const nodeForge = new NodeForge()
    const certManager = new CertManager(new Logger('CertManager'), nodeForge)

    // convert the certificate pfx to an object
    const pfxobj = certManager.convertPfxToObject(pfxb64, 'Intel123!')
    clientObj.certObj = {}
    clientObj.certObj.privateKey = pfxobj.keys[0]
    await activator.createSignedString(clientObj)
    expect(clientObj.signature.errorText).toBe(undefined)
  })
  test('should throw error message when certificate is invalid', async () => {

  })
})

describe('saveDeviceInfo', () => {
  test('logger should report error if not able to save data in DB', async () => {
  })
  test('logger should report warning if not able to save data with MPS', async () => {
  })
})

afterAll(() => {
  clientManager.clients = []
})
