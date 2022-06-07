/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import { v4 as uuid } from 'uuid'
import { Activator } from './Activator'
import Logger from '../Logger'
import { SignatureHelper } from '../utils/SignatureHelper'
import { NodeForge } from '../NodeForge'
import { CertManager } from '../CertManager'
import { Configurator } from '../Configurator'
import { config } from '../test/helper/Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { Validator } from '../Validator'
import { EnvReader } from '../utils/EnvReader'
import { CIRAConfigurator } from './CIRAConfigurator'
// import got from 'got'
import { NetworkConfigurator } from './NetworkConfigurator'
import { PasswordHelper } from '../utils/PasswordHelper'
import { TLSConfigurator } from './TLSConfigurator'
import { HttpHandler } from '../HttpHandler'
import { ClientAction, ClientObject } from '../models/RCS.Config'
import { RPSError } from '../utils/RPSError'
import { devices } from '../WebSocketListener'

EnvReader.GlobalEnvConfig = config
const nodeForge = new NodeForge()
const certManager = new CertManager(new Logger('CertManager'), nodeForge)
const helper = new SignatureHelper(nodeForge)
const configurator = new Configurator()
const responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
const validator = new Validator(new Logger('Validator'), configurator)
const tlsConfig = new TLSConfigurator(new Logger('CIRAConfig'), certManager, responseMsg)
const ciraConfig = new CIRAConfigurator(new Logger('CIRAConfig'), configurator, responseMsg, tlsConfig)
const networkConfigurator = new NetworkConfigurator(new Logger('NetworkConfig'), configurator, responseMsg, validator, ciraConfig)
const activator = new Activator(new Logger('Activator'), configurator, certManager, helper, responseMsg, validator, networkConfigurator)
const httpHandler = new HttpHandler()
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
      profile: 'profile1',
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
    uuid: '4c4c4544-004b-4210-8033-b6c04f504633',
    messageId: 1
  }
})
const message = {
  payload: {
    statusCode: 200,
    body: {
      text: undefined
    }
  }
}
let response200GeneralSettingsMsg = null
let response200SetMEBxPassword = null
let response200AddNextInChain = null
let response200AdminSetUp = null
let response200Setup = null

beforeEach(() => {
  jest.resetAllMocks()
  response200GeneralSettingsMsg = (value: string) => {
    message.payload.body.text = '0514\r\n' +
          '<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_GeneralSettings" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>1</b:RelatesTo><b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-000000000024</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_GeneralSettings</c:ResourceURI></a:Header><a:Body><g:AMT_GeneralSettings><g:AMTNetworkEnabled>1</g:AMTNetworkEnabled><g:DDNSPeriodicUpdateInterval>1440</g:DDNSPeriodicUpdateInterval><g:DDNSTTL>900</g:DDNSTTL><g:DDNSUpdateByDHCPServerEnabled>true</g:DDNSUpdateByDHCPServerEnabled><g:DDNSUpdateEnabled>false</g:DDNSUpdateEnabled><g:DHCPv6ConfigurationTimeout>0</g:DHCPv6ConfigurationTimeout><g:DigestReal\r\n' +
          '033C\r\n' +
          `m>${value}</g:DigestRealm><g:DomainName></g:DomainName><g:ElementName>Intel(r) AMT: General Settings</g:ElementName><g:HostName></g:HostName><g:HostOSFQDN></g:HostOSFQDN><g:IdleWakeTimeout>1</g:IdleWakeTimeout><g:InstanceID>Intel(r) AMT: General Settings</g:InstanceID><g:NetworkInterfaceEnabled>true</g:NetworkInterfaceEnabled><g:PingResponseEnabled>true</g:PingResponseEnabled><g:PowerSource>0</g:PowerSource><g:PreferredAddressFamily>0</g:PreferredAddressFamily><g:PresenceNotificationInterval>0</g:PresenceNotificationInterval><g:PrivacyLevel>0</g:PrivacyLevel><g:RmcpPingResponseEnabled>true</g:RmcpPingResponseEnabled><g:SharedFQDN>true</g:SharedFQDN><g:ThunderboltDockEnabled>0</g:ThunderboltDockEnabled><g:WsmanOnlyMode>false</g:WsmanOnlyMode></g:AMT_GeneralSettings></a:Body></a:Envelope>\r\n` +
          '0\r\n' +
          '\r\n'
    return message
  }
  response200SetMEBxPassword = (value: number) => {
    return {
      statusCode: 200,
      body: {
        contentType: 'application/soap+xml',
        text: '0462\r\n' +
        `<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>7</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService/SetMEBxPasswordResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-00000000002F</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService</c:ResourceURI></a:Header><a:Body><g:SetMEBxPassword_OUTPUT><g:ReturnValue>${value}</g:ReturnValue></g:SetMEBxPassword_OUTPUT></a:Body></a:Envelope>\r\n` +
        '0\r\n' +
        '\r\n'
      }
    }
  }
  response200AddNextInChain = (value: number) => {
    message.payload.body.text = '0456\r\n' +
            `<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>3</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService/AddNextCertInChainResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-000000000026</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService</c:ResourceURI></a:Header><a:Body><g:AddNextCertInChain_OUTPUT><g:ReturnValue>${value}</g:ReturnValue></g:AddNextCertInChain_OUTPUT></a:Body></a:Envelope>\r\n` +
            '0\r\n' +
            '\r\n'
    return message
  }
  response200AdminSetUp = (value: number) => {
    message.payload.body.text = '043E\r\n' +
    `<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>6</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService/AdminSetupResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-000000000029</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService</c:ResourceURI></a:Header><a:Body><g:AdminSetup_OUTPUT><g:ReturnValue>${value}</g:ReturnValue></g:AdminSetup_OUTPUT></a:Body></a:Envelope>\r\n` +
    '0\r\n' +
    '\r\n'
    return message
  }
  response200Setup = (value: number) => {
    message.payload.body.text = '042F\r\n' +
    `<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>4</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService/SetupResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-000000000039</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService</c:ResourceURI></a:Header><a:Body><g:Setup_OUTPUT><g:ReturnValue>${value}</g:ReturnValue></g:Setup_OUTPUT></a:Body></a:Envelope>\r\n` +
    '0\r\n' +
    '\r\n'
    return message
  }
})
const cert = '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'
const domain = {
  profileName: 'vpro',
  domainSuffix: 'vprodemo.com',
  provisioningCert: undefined,
  provisioningCertStorageFormat: 'raw',
  provisioningCertPassword: 'P@ssw0rd',
  tenantId: ''
}

describe('GetProvisioningCertObj', () => {
  test('should return null if unable to convert pfx to object', async () => {
    const convertPfxToObjectSpy = jest.spyOn(certManager, 'convertPfxToObject').mockImplementation(() => {
      throw new Error('Decrypting provisioning certificate failed.')
    })
    const message = activationmsg
    const password = null
    const result = activator.GetProvisioningCertObj(message, cert, password, clientId)
    expect(result).toBeNull()
    expect(convertPfxToObjectSpy).toHaveBeenCalled()

    // expect(result.errorText).toBe('Decrypting provisioning certificate failed.')
  })
  test('should return null if unable to get provisioning certificate', async () => {
    const message = activationmsg
    const password = 'Intel123!'
    const result = activator.GetProvisioningCertObj(message, cert, password, clientId)
    expect(result).toBeNull()
  })
  test('should successfully return valid certificate object', async () => {
    const certObject = { provisioningCertificateObj: { certChain: ['leaf', 'inter1', 'root'], privateKey: null }, fingerprint: 'eb04cf5eb1f39afa762f2bb120f296cba520c1b97db1589565b81cb9a17b7244' }
    const convertPfxToObjectSpy = jest.spyOn(certManager, 'convertPfxToObject').mockImplementation(() => {
      return { certs: null, keys: null }
    })
    const dumpPfxSpy = jest.spyOn(certManager, 'dumpPfx').mockImplementation(() => {
      return certObject
    })
    const message = activationmsg
    const password = null
    const result = activator.GetProvisioningCertObj(message, cert, password, clientId)
    expect(convertPfxToObjectSpy).toHaveBeenCalled()
    expect(dumpPfxSpy).toHaveBeenCalled()
    expect(result).toBe(certObject.provisioningCertificateObj)
  })
})

describe('createSignedString', () => {
  test('should return valid signed string when certificate is valid', async () => {
    const clientObj = devices[clientId]
    clientObj.ClientData.payload.fwNonce = PasswordHelper.generateNonce()
    clientObj.nonce = PasswordHelper.generateNonce()
    const nodeForge = new NodeForge()
    const certManager = new CertManager(new Logger('CertManager'), nodeForge)

    // convert the certificate pfx to an object
    const pfxobj = certManager.convertPfxToObject(cert, 'Intel123!')
    clientObj.certObj = {} as any
    clientObj.certObj.privateKey = pfxobj.keys[0]
    await activator.createSignedString(clientId)
    expect(clientObj.signature).toBeDefined()
    expect(clientObj.signature).not.toBe('')
  })
  test('should throw error message when certificate is invalid', async () => {
    let rpsError = null
    const clientObj = devices[clientId]
    clientObj.ClientData.payload.fwNonce = PasswordHelper.generateNonce()
    clientObj.nonce = PasswordHelper.generateNonce()
    const signStringSpy = jest.spyOn(activator.signatureHelper, 'signString').mockImplementation(() => {
      throw new Error('Unable to create Digital Signature')
    })
    try {
      await activator.createSignedString(clientId)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(signStringSpy).toHaveBeenCalled()
  })
})

describe('performACMSteps', () => {
  test('should throw an error when the certificate does not exist on server', async () => {
    let rpsError = null
    let clientObj: ClientObject = null
    const getProvisioningCertSpy = jest.spyOn(configurator.domainCredentialManager, 'getProvisioningCert').mockImplementation(async () => {
      return domain
    })
    try {
      clientObj = devices[clientId]
      clientObj.count = undefined
      await activator.performACMSteps(clientId, httpHandler)
    } catch (error) {
      rpsError = error
    }
    expect(getProvisioningCertSpy).toHaveBeenCalled()
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toBe(`Device ${clientObj.uuid} activation failed. AMT provisioning certificate not found on server`)
  })
  test('should throw an error when the certificate does not match trusted list from AMT', async () => {
    let rpsError = null
    let clientObj: ClientObject = null
    domain.provisioningCert = 'Cert'
    const getProvisioningCertSpy = jest.spyOn(configurator.domainCredentialManager, 'getProvisioningCert').mockImplementation(async () => {
      return domain
    })
    try {
      clientObj = devices[clientId]
      clientObj.count = undefined
      await activator.performACMSteps(clientId, httpHandler)
    } catch (error) {
      rpsError = error
    }
    expect(getProvisioningCertSpy).toHaveBeenCalled()
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toBe(`Device ${clientObj.uuid} activation failed. Provisioning certificate doesn't match any trusted certificates from AMT`)
  })
  test('should throw error if receive an error when retrieving certificate', async () => {
    let rpsError = null
    let clientObj: ClientObject = null
    const getProvisioningCertObjSpy = jest.spyOn(activator, 'GetProvisioningCertObj').mockImplementation(() => {
      return null
    })
    const getProvisioningCertSpy = jest.spyOn(configurator.domainCredentialManager, 'getProvisioningCert').mockImplementation(async () => {
      return domain
    })
    try {
      clientObj = devices[clientId]
      clientObj.count = undefined
      await activator.performACMSteps(clientId, httpHandler)
    } catch (error) {
      rpsError = error
    }
    expect(getProvisioningCertSpy).toHaveBeenCalled()
    expect(getProvisioningCertObjSpy).toHaveBeenCalled()
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toBe("Device 4c4c4544-004b-4210-8033-b6c04f504633 activation failed. Provisioning certificate doesn't match any trusted certificates from AMT")
  })
  test('should return wsman message', async () => {
    let clientObj: ClientObject = null
    const getProvisioningCertObjSpy = jest.spyOn(activator, 'GetProvisioningCertObj').mockImplementation(() => {
      return {
        certChain: ['leaf', 'inter1', 'inter2', 'root'],
        privateKey: '' as any
      }
    })
    const getProvisioningCertSpy = jest.spyOn(configurator.domainCredentialManager, 'getProvisioningCert').mockImplementation(async () => {
      return domain
    })
    clientObj = devices[clientId]
    clientObj.count = undefined
    const response = await activator.performACMSteps(clientId, httpHandler)

    expect(getProvisioningCertSpy).toHaveBeenCalled()
    expect(getProvisioningCertObjSpy).toHaveBeenCalled()
    expect(response.method).toBe('wsman')
  })
})

describe('activate device', () => {
  test('should throw an error when the payload is null', async () => {
    const clientObj = devices[clientId]
    clientObj.uuid = activationmsg.payload.uuid
    const clientMsg = { payload: null }
    const responseMsg = await activator.execute(clientMsg, clientId, httpHandler)
    expect(responseMsg.message).toEqual(`{"Status":"Device ${activationmsg.payload.uuid} activation failed. Missing/invalid WSMan response payload."}`)
  })
  test('should return wsman to update AMT admin password when device does not exits in DB', async () => {
    const clientObj = devices[clientId]
    clientObj.uuid = activationmsg.payload.uuid
    clientObj.activationStatus.changePassword = true
    clientObj.activationStatus.activated = true
    const clientMsg = { payload: { protocolVersion: 'HTTP/1.1', statusCode: 401, statusMessage: 'Unauthorized', headersSize: 295, bodySize: 693, headers: [], body: { } } }
    const responseMsg = await activator.execute(clientMsg, clientId, httpHandler)
    expect(responseMsg.method).toEqual('wsman')
  })
  test('should return error message when AMT admin password failed to update', async () => {
    const clientObj = devices[clientId]
    clientObj.uuid = activationmsg.payload.uuid
    clientObj.activationStatus.changePassword = true
    clientObj.activationStatus.activated = true
    const clientMsg = {
      payload: {
        statusCode: 400,
        body: { }
      }
    }
    const responseMsg = await activator.execute(clientMsg, clientId, httpHandler)
    expect(responseMsg.method).toEqual('error')
    expect(clientObj.activationStatus.changePassword).toEqual(true)
    expect(responseMsg.message).toEqual(`{"Status":"Device ${activationmsg.payload.uuid} failed to update AMT password."}`)
  })
  test('should return success message when AMT admin password update', async () => {
    const clientObj = devices[clientId]
    clientObj.uuid = activationmsg.payload.uuid
    clientObj.activationStatus.changePassword = true
    clientObj.activationStatus.activated = true
    const clientMsg = {
      payload: {
        statusCode: 200,
        body: {
          contentType: 'application/soap+xml',
          text: '0453\r\n' +
            '<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_AuthorizationService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>2</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_AuthorizationService/SetAdminAclEntryExResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-0000000000CC</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_AuthorizationService</c:ResourceURI></a:Header><a:Body><g:SetAdminAclEntryEx_OUTPUT><g:ReturnValue>0</g:ReturnValue></g:SetAdminAclEntryEx_OUTPUT></a:Body></a:Envelope>\r\n' +
            '0\r\n' +
            '\r\n'
        }
      }
    }
    const responseMsg = await activator.execute(clientMsg, clientId, httpHandler)
    expect(responseMsg.method).toEqual('heartbeat_request')
    expect(clientObj.activationStatus.changePassword).toEqual(false)
  })
  test('should return wsman message for admin control mode activation', async () => {
    const getAMTPasswordSpy = jest.spyOn(configurator.profileManager, 'getAmtPassword').mockImplementation(async () => 'P@ssw0rd')
    const signStringSpy = jest.spyOn(activator.signatureHelper, 'signString').mockImplementation(() => {
      return ''
    })
    const clientObj = devices[clientId]
    clientObj.uuid = activationmsg.payload.uuid
    clientObj.activationStatus.changePassword = false
    clientObj.activationStatus.activated = false
    clientObj.certObj.certChain = ['leaf', 'inter1', 'root']
    clientObj.count = 4
    clientObj.action = ClientAction.ADMINCTLMODE
    const clientMsg = {
      payload: {
        statusCode: 200,
        body: {
          contentType: 'application/octet-stream',
          text: '0456\r\n' +
            '<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>5</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService/AddNextCertInChainResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-000000000028</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService</c:ResourceURI></a:Header><a:Body><g:AddNextCertInChain_OUTPUT><g:ReturnValue>0</g:ReturnValue></g:AddNextCertInChain_OUTPUT></a:Body></a:Envelope>\r\n' +
            '0\r\n' +
            '\r\n'
        }
      }
    }
    const responseMsg = await activator.execute(clientMsg, clientId, httpHandler)
    expect(getAMTPasswordSpy).toHaveBeenCalled()
    expect(signStringSpy).toHaveBeenCalled()
    expect(responseMsg.method).toEqual('wsman')
  })
  test('should return wsman message for client control mode activation', async () => {
    const clientObj = devices[clientId]
    clientObj.uuid = activationmsg.payload.uuid
    clientObj.activationStatus.changePassword = false
    clientObj.activationStatus.activated = false
    clientObj.action = ClientAction.CLIENTCTLMODE
    const responseMsg = await activator.execute(response200GeneralSettingsMsg('Digest:E637970E01D8813AA21BA98C7589B883'), clientId, httpHandler)
    expect(responseMsg.method).toEqual('wsman')
  })
})

describe('save Device Information to MPS database', () => {
  test(`should return true if saved for ${ClientAction.ADMINCTLMODE}`, async () => {
    const insertSpy = jest.spyOn(configurator.profileManager, 'getAmtProfile').mockImplementation(async () => {
      return {
        profileName: 'acm',
        activation: ClientAction.ADMINCTLMODE,
        tenantId: '',
        tags: ['acm']
      }
    })
    const response = await activator.saveDeviceInfoToMPS(clientId)
    expect(insertSpy).toHaveBeenCalled()
    expect(response).toBe(false)
  })
  // test('should return false if not able to save data', async () => {
  //   const insertSpy = jest.spyOn(configurator.profileManager, 'getAmtProfile').mockImplementation(async () => {
  //     return {
  //       profileName: 'acm',
  //       activation: ClientAction.ADMINCTLMODE,
  //       tenantId: '',
  //       tags: ['acm']
  //     }
  //   })

  //   const gotSpy = jest.spyOn(got, 'post').mockImplementation({ json: true })
  //   const clientObj = clientManager.getClientObject(clientId)
  //   const response = await activator.saveDeviceInfoToMPS(clientObj)
  //   expect(gotSpy).toHaveBeenCalled()
  //   expect(insertSpy).toHaveBeenCalled()
  //   expect(response).toBe(true)
  // })
})

describe('save Device Information to vault', () => {
  test(`should return true if saved for ${ClientAction.ADMINCTLMODE}`, async () => {
    const insertSpy = jest.spyOn(configurator.amtDeviceRepository, 'insert').mockImplementation(async () => true)
    const response = await activator.saveDeviceInfoToVault(clientId)
    expect(insertSpy).toHaveBeenCalled()
    expect(response).toBe(true)
  })
  test(`should return true if saved for ${ClientAction.CLIENTCTLMODE}`, async () => {
    const insertSpy = jest.spyOn(configurator.amtDeviceRepository, 'insert').mockImplementation(async () => true)
    const clientObj = devices[clientId]
    clientObj.action = ClientAction.ADMINCTLMODE
    const response = await activator.saveDeviceInfoToVault(clientId)
    expect(insertSpy).toHaveBeenCalled()
    expect(response).toBe(true)
  })
  test('should return false if not able to save data', async () => {
    configurator.amtDeviceRepository = null
    const response = await activator.saveDeviceInfoToVault(clientId)
    expect(response).toBe(false)
  })
})

describe('inject Certificate', () => {
  test('should return wsman message when certchain is not null', async () => {
    const clientObj = devices[clientId]
    clientObj.count = 1
    clientObj.certObj = {} as any
    clientObj.certObj.certChain = ['leaf', 'inter1', 'root']
    const response = await activator.injectCertificate(clientId, httpHandler)
    expect(response.method).toBe('wsman')
    expect(clientObj.count).toBe(2)
  })
  test('should return wsman message when certchain is not null and cert chain length is less than count', async () => {
    const clientObj = devices[clientId]
    clientObj.certObj = {} as any
    clientObj.certObj.certChain = ['leaf', 'inter1', 'root']
    const response = await activator.injectCertificate(clientId, httpHandler)
    expect(response.method).toBe('wsman')
    expect(clientObj.count).toBe(3)
  })
  test('should return wsman message when certchain is not null and cert chain length is equal to count', async () => {
    const clientObj = devices[clientId]
    clientObj.certObj = {} as any
    clientObj.certObj.certChain = ['leaf', 'inter1', 'root']
    const response = await activator.injectCertificate(clientId, httpHandler)
    expect(response.method).toBe('wsman')
    expect(clientObj.count).toBe(4)
    expect(clientObj.certObj.certChain.length).toBeLessThan(clientObj.count)
  })
})

describe('process WSMan Json Response ', () => {
  test('should return wsman message when statusCode is 401', async () => {
    const message = {
      payload: {
        statusCode: 401
      }
    }
    const response = await activator.processWSManJsonResponse(message, clientId, httpHandler)
    expect(response.method).toBe('wsman')
  })
  test('should throw an error message when the statusCode is not 401 or 200', async () => {
    let rpsError = null
    let clientObj: ClientObject = null
    const message = {
      payload: {
        statusCode: 400
      }
    }
    try {
      clientObj = devices[clientId]
      await activator.processWSManJsonResponse(message, clientId, httpHandler)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toBe(`Device ${clientObj.uuid} failed to activate`)
  })
  test('should throw an error message when the statusCode is 200 and response is not for General settings or Host Based Configuration Service', async () => {
    let rpsError = null
    let clientObj: ClientObject = null
    const message = {
      payload: {
        statusCode: 200,
        body: {
          contentType: 'application/soap+xml',
          text: '0453\r\n' +
            '<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_AuthorizationService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>2</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_AuthorizationService/SetAdminAclEntryExResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-0000000000CC</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_AuthorizationService</c:ResourceURI></a:Header><a:Body><g:SetAdminAclEntryEx_OUTPUT><g:ReturnValue>0</g:ReturnValue></g:SetAdminAclEntryEx_OUTPUT></a:Body></a:Envelope>\r\n' +
            '0\r\n' +
            '\r\n'
        }
      }
    }
    try {
      clientObj = devices[clientId]
      await activator.processWSManJsonResponse(message, clientId, httpHandler)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toBe(`Device ${clientObj.uuid} failed to activate`)
  })
})

describe('validate AMT GeneralSettings  response', () => {
  test('should throw an error if the digest realm is invalid', async () => {
    let rpsError = null
    let clientObj: ClientObject = null
    try {
      clientObj = devices[clientId]
      await activator.processWSManJsonResponse(response200GeneralSettingsMsg('Digest:E637970E01D8813AA21BA98C7589883'), clientId, httpHandler)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toBe(`Device ${clientObj.uuid} activation failed. Not a valid digest realm.`)
  })
  test(`should return wsman message for ${ClientAction.ADMINCTLMODE} method`, async () => {
    const clientObj = devices[clientId]
    clientObj.ClientData.payload.fwNonce = null
    clientObj.action = ClientAction.ADMINCTLMODE
    const response = await activator.processWSManJsonResponse(response200GeneralSettingsMsg('Digest:E637970E01D8813AA21BA98C7589B883'), clientId, httpHandler)
    expect(response.method).toBe('wsman')
    expect(clientObj.ClientData.payload.digestRealm).toBe('Digest:E637970E01D8813AA21BA98C7589B883')
    expect(clientObj.hostname).toBe('DESKTOP-9CC12U7')
  })
  test(`should return null for ${ClientAction.CLIENTCTLMODE} method`, async () => {
    const clientObj = devices[clientId]
    clientObj.action = ClientAction.CLIENTCTLMODE
    const response = await activator.processWSManJsonResponse(response200GeneralSettingsMsg('Digest:E637970E01D8813AA21BA98C7589B883'), clientId, httpHandler)
    expect(response).toBeNull()
    expect(clientObj.ClientData.payload.digestRealm).toBe('Digest:E637970E01D8813AA21BA98C7589B883')
    expect(clientObj.hostname).toBe('DESKTOP-9CC12U7')
  })
})

describe('validate Host Based Setup Service response', () => {
  test('should return null when its a get response', async () => {
    const message = {
      payload: {
        statusCode: 200,
        body: {
          contentType: 'application/octet-stream',
          text: '0514\r\n' +
            '<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService" xmlns:h="http://schemas.dmtf.org/wbem/wscim/1/common" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>2</b:RelatesTo><b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-000000000025</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/ips-schema/1/IPS_HostBasedSetupService</c:ResourceURI></a:Header><a:Body><g:IPS_HostBasedSetupService><g:AllowedControlModes>2</g:AllowedControlModes><g:AllowedControlModes>1</g:AllowedControlModes><g:CertChainStatus>0</g:CertChainStatus><g:ConfigurationNonce>SkqopmngrtkhdvcteznRbEdgqpc=</g:ConfigurationNonce><g:CreationClassName>IPS_HostBasedSetupService</\r\n' +
            '0162\r\n' +
            'g:CreationClassName><g:CurrentControlMode>0</g:CurrentControlMode><g:ElementName>Intel(r) AMT Host Based Setup Service</g:ElementName><g:Name>Intel(r) AMT Host Based Setup Service</g:Name><g:SystemCreationClassName>CIM_ComputerSystem</g:SystemCreationClassName><g:SystemName>Intel(r) AMT</g:SystemName></g:IPS_HostBasedSetupService></a:Body></a:Envelope>\r\n' +
            '0\r\n' +
            '\r\n'
        }
      }
    }
    const response = await activator.processWSManJsonResponse(message, clientId, httpHandler)
    expect(response).toBe(null)
  })
  test('should return null when its a Add NextCert In Chain response', async () => {
    const response = await activator.processWSManJsonResponse(response200AddNextInChain(0), clientId, httpHandler)
    expect(response).toBe(null)
  })
  test('should throw an error when Add NextCert In Chain response, ReturnValue is not zero', async () => {
    let rpsError = null
    let clientObj: ClientObject = null
    try {
      clientObj = devices[clientId]
      await activator.processWSManJsonResponse(response200AddNextInChain(1), clientId, httpHandler)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toBe(`Device ${clientObj.uuid} activation failed. Error while adding the certificates to AMT.`)
  })
  test('should return null when it is Admin Setup response', async () => {
    const saveDeviceInfoToVaultSpy = jest.spyOn(activator, 'saveDeviceInfoToVault').mockImplementation(async () => { return true })
    const saveDeviceInfoToMPSSpy = jest.spyOn(activator, 'saveDeviceInfoToMPS').mockImplementation(async () => { return true })
    const response = await activator.processWSManJsonResponse(response200AdminSetUp(0), clientId, httpHandler)
    const clientObj = devices[clientId]
    clientObj.delayEndTime = null
    expect(saveDeviceInfoToVaultSpy).toHaveBeenCalled()
    expect(saveDeviceInfoToMPSSpy).toHaveBeenCalled()
    expect(response.method).toBe('heartbeat_request')
  })
  test('should throw an error when it is Admin Setup response and ReturnValue is not zero', async () => {
    let rpsError = null
    let clientObj: ClientObject = null
    try {
      clientObj = devices[clientId]
      await activator.processWSManJsonResponse(response200AdminSetUp(1), clientId, httpHandler)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toBe(`Device ${clientObj.uuid} activation failed. Error while activating the AMT device in admin mode.`)
  })
  test('should return null when it is Setup response', async () => {
    const saveDeviceInfoToVaultSpy = jest.spyOn(activator, 'saveDeviceInfoToVault').mockImplementation(async () => { return true })
    const saveDeviceInfoToMPSSpy = jest.spyOn(activator, 'saveDeviceInfoToMPS').mockImplementation(async () => { return true })
    const response = await activator.processWSManJsonResponse(response200Setup(0), clientId, httpHandler)
    const clientObj = devices[clientId]
    clientObj.delayEndTime = null
    expect(saveDeviceInfoToVaultSpy).toHaveBeenCalled()
    expect(saveDeviceInfoToMPSSpy).toHaveBeenCalled()
    expect(response.method).toBe('heartbeat_request')
  })
  test('should throw an error when it is Setup response and ReturnValue is not zero', async () => {
    let rpsError = null
    let clientObj: ClientObject = null
    try {
      clientObj = devices[clientId]
      await activator.processWSManJsonResponse(response200Setup(1), clientId, httpHandler)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toBe(`Device ${clientObj.uuid} activation failed. Error while activating the AMT device in client mode.`)
  })
})

describe('wait for Activation', () => {
  test('should set next action as NETWORKCONFIG once heartbeat has ended for ACM', async () => {
    const clientObj = devices[clientId]
    const currentTime = new Date().getTime()
    clientObj.action = ClientAction.ADMINCTLMODE
    clientObj.delayEndTime = currentTime + 1000000000000
    clientObj.delayEndTime = currentTime
    await activator.waitAfterActivation(clientId, response200SetMEBxPassword(0), httpHandler)
    expect(clientObj.action).toBe(ClientAction.NETWORKCONFIG)
  })
  test('should set next action as NETWORKCONFIG once heartbeat has ended for ACM', async () => {
    const clientObj = devices[clientId]
    const currentTime = new Date().getTime()
    clientObj.action = ClientAction.ADMINCTLMODE
    clientObj.delayEndTime = currentTime + 1000000000000
    clientObj.delayEndTime = currentTime
    await activator.waitAfterActivation(clientId, response200SetMEBxPassword(1), httpHandler)
    expect(clientObj.action).toBe(ClientAction.NETWORKCONFIG)
  })
  test('should set next action as NETWORKCONFIG once heartbeat has ended for ACM', async () => {
    const clientObj = devices[clientId]
    const currentTime = new Date().getTime()
    clientObj.action = ClientAction.ADMINCTLMODE
    clientObj.delayEndTime = currentTime + 1000000000000
    clientObj.delayEndTime = currentTime
    const message = ''
    const response = await activator.waitAfterActivation(clientId, message, httpHandler)
    expect(response.method).toBe('wsman')
  })
  test('should set next action as NETWORKCONFIG once heartbeat has ended for CCM', async () => {
    const clientObj = devices[clientId]
    const currentTime = new Date().getTime()
    clientObj.action = ClientAction.CLIENTCTLMODE
    clientObj.delayEndTime = currentTime
    await activator.waitAfterActivation(clientId, null, httpHandler)
    expect(clientObj.action).toBe(ClientAction.NETWORKCONFIG)
  })
})

afterAll(() => {
  // clientManager.clients = []
})
