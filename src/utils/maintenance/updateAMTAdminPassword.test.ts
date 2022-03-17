/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import Logger from '../../Logger'
import { ClientResponseMsg } from '../ClientResponseMsg'
import { v4 as uuid } from 'uuid'
import { updateAMTAdminPassword } from './updateAMTAdminPassword'
import { Configurator } from '../../Configurator'
import { Validator } from '../../Validator'
import { config } from '../../test/helper/Config'
import { EnvReader } from '../EnvReader'
import { HttpHandler } from '../../HttpHandler'
import { RPSError } from '../RPSError'
import { devices } from '../../WebSocketListener'

EnvReader.GlobalEnvConfig = config
const configurator = new Configurator()
const responseMsg: ClientResponseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
const validator = new Validator(new Logger('Validator'), configurator)
const httpHandler = new HttpHandler()
let msg
let setAdminAclEntryExOutPut = null
let generalSettings = null
const digestChallenge = {
  realm: 'Digest:AF541D9BC94CFF7ADFA073F492F355E6',
  nonce: 'dxNzCQ9JBAAAAAAAd2N7c6tYmUl0FFzQ',
  stale: 'false',
  qop: 'auth'
}
const connectionParams = {
  guid: '4c4c4544-004b-4210-8033-b6c04f504633',
  port: 16992,
  digestChallenge: digestChallenge,
  username: 'admin',
  password: 'P@ssw0rd'
}

beforeEach(() => {
  msg = {
    method: 'activate',
    apiKey: 'key',
    appVersion: '1.0.0',
    protocolVersion: '4.0.0',
    status: 'ok',
    message: 'ok',
    fqdn: '',
    payload: {
      ver: '15.0.23',
      build: '1706',
      sku: '16392',
      uuid: '4c4c4544-005a-3510-804b-b4c04f564433',
      username: '$$OsAdmin',
      password: 'bKyU7llR/08Zm80OlPGeKkPq1PTsjZTA',
      currentMode: 0,
      hostname: 'DESKTOP-B22S514',
      fqdn: 'vprodemo.com',
      client: 'RPC',
      certHashes: [
        'c3846bf24b9e93ca64274c0ec67c1ecc5e024ffcacd2d74019350e81fe546ae4',
        '45140b3247eb9cc8c5b4f0d7b53091f73292089e6e5a63e2749dd3aca9198eda'
      ],
      profile: {
        profileName: 'acm'
      }
    }
  }
  setAdminAclEntryExOutPut = (value: number) => {
    return {
      statusCode: 200,
      body: {
        contentType: 'application/soap+xml',
        text: '0453\r\n' +
          `<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_AuthorizationService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>2</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_AuthorizationService/SetAdminAclEntryExResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-0000000000CC</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_AuthorizationService</c:ResourceURI></a:Header><a:Body><g:SetAdminAclEntryEx_OUTPUT><g:ReturnValue>${value}</g:ReturnValue></g:SetAdminAclEntryEx_OUTPUT></a:Body></a:Envelope>\r\n` +
          '0\r\n' +
          '\r\n'
      }
    }
  }
  generalSettings = (value: string) => {
    return {
      statusCode: 200,
      body: {
        text: '0514\r\n' +
          '<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_GeneralSettings" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>1</b:RelatesTo><b:Action a:mustUnderstand="true">http://schemas.xmlsoap.org/ws/2004/09/transfer/GetResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-000000000024</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_GeneralSettings</c:ResourceURI></a:Header><a:Body><g:AMT_GeneralSettings><g:AMTNetworkEnabled>1</g:AMTNetworkEnabled><g:DDNSPeriodicUpdateInterval>1440</g:DDNSPeriodicUpdateInterval><g:DDNSTTL>900</g:DDNSTTL><g:DDNSUpdateByDHCPServerEnabled>true</g:DDNSUpdateByDHCPServerEnabled><g:DDNSUpdateEnabled>false</g:DDNSUpdateEnabled><g:DHCPv6ConfigurationTimeout>0</g:DHCPv6ConfigurationTimeout><g:DigestReal\r\n' +
          '033C\r\n' +
          `m>${value}</g:DigestRealm><g:DomainName></g:DomainName><g:ElementName>Intel(r) AMT: General Settings</g:ElementName><g:HostName></g:HostName><g:HostOSFQDN></g:HostOSFQDN><g:IdleWakeTimeout>1</g:IdleWakeTimeout><g:InstanceID>Intel(r) AMT: General Settings</g:InstanceID><g:NetworkInterfaceEnabled>true</g:NetworkInterfaceEnabled><g:PingResponseEnabled>true</g:PingResponseEnabled><g:PowerSource>0</g:PowerSource><g:PreferredAddressFamily>0</g:PreferredAddressFamily><g:PresenceNotificationInterval>0</g:PresenceNotificationInterval><g:PrivacyLevel>0</g:PrivacyLevel><g:RmcpPingResponseEnabled>true</g:RmcpPingResponseEnabled><g:SharedFQDN>true</g:SharedFQDN><g:ThunderboltDockEnabled>0</g:ThunderboltDockEnabled><g:WsmanOnlyMode>false</g:WsmanOnlyMode></g:AMT_GeneralSettings></a:Body></a:Envelope>\r\n` +
          '0\r\n' +
          '\r\n'
      }
    }
  }
})

test('should return wsman message if message status code is 401', async () => {
  const message = {
    protocolVersion: 'HTTP/1.1',
    statusCode: 401,
    statusMessage: 'Unauthorized',
    headersSize: 295,
    bodySize: 693,
    headers: [],
    body: { }
  }
  const clientId = uuid()
  devices[clientId] = { ClientId: clientId, ClientSocket: null, ClientData: msg, connectionParams: connectionParams, messageId: 0, unauthCount: 0 }
  const response = await updateAMTAdminPassword(clientId, message, responseMsg, configurator, validator, httpHandler)
  expect(response.method).toEqual('wsman')
})

test('should return wsman message if message is AMT_GeneralSettings and status code is 200  ', async () => {
  const getAMTPasswordSpy = jest.spyOn(configurator.profileManager, 'getAmtPassword').mockImplementation(async () => 'P@ssw0rd')
  const insertSpy = jest.spyOn(configurator.amtDeviceRepository, 'insert').mockImplementation(async () => true)
  const getprofileSpy = jest.spyOn(configurator.profileManager, 'getAmtProfile').mockImplementation(async () => {
    return {
      profileName: 'acm',
      activation: 'acmactivate',
      tenantId: '',
      tags: ['acm']
    }
  })
  const clientId = uuid()
  devices[clientId] = { ClientId: clientId, ClientSocket: null, ClientData: msg, connectionParams: connectionParams, messageId: 0, unauthCount: 0 }

  const response = await updateAMTAdminPassword(clientId, generalSettings('Digest:AF541D9BC94CFF7ADFA073F492F355E6'), responseMsg, configurator, validator, httpHandler)
  expect(getAMTPasswordSpy).toHaveBeenCalled()
  expect(insertSpy).toHaveBeenCalled()
  expect(getprofileSpy).toHaveBeenCalled()
  expect(response.method).toEqual('wsman')
})

test('should not insert into vault if configurator is null', async () => {
  const getAMTPasswordSpy = jest.spyOn(configurator.profileManager, 'getAmtPassword').mockImplementation(async () => 'P@ssw0rd')
  const insertSpy = jest.spyOn(configurator.amtDeviceRepository, 'insert').mockImplementation(async () => true)
  const getprofileSpy = jest.spyOn(configurator.profileManager, 'getAmtProfile').mockImplementation(async () => {
    return {
      profileName: 'acm',
      activation: 'acmactivate',
      tenantId: '',
      tags: ['acm']
    }
  })
  configurator.amtDeviceRepository = null
  const clientId = uuid()
  devices[clientId] = { ClientId: clientId, ClientSocket: null, ClientData: msg, connectionParams: connectionParams, messageId: 0, unauthCount: 0 }
  const response = await updateAMTAdminPassword(clientId, generalSettings('Digest:AF541D9BC94CFF7ADFA073F492F355E6'), responseMsg, configurator, validator, httpHandler)
  expect(getAMTPasswordSpy).toHaveBeenCalled()
  expect(insertSpy).toHaveBeenCalled()
  expect(getprofileSpy).toHaveBeenCalled()
  expect(response.method).toEqual('wsman')
})

test('should return success message if message is AMT_AuthorizationService, status code is 200 and ReturnValue is 0  ', async () => {
  const clientId = uuid()
  devices[clientId] = { ClientId: clientId, ClientSocket: null, ClientData: msg, status: {}, connectionParams: connectionParams, messageId: 0, unauthCount: 0 }
  const response = await updateAMTAdminPassword(clientId, setAdminAclEntryExOutPut(0), responseMsg, configurator, validator, httpHandler)
  expect(response.method).toEqual('success')
})

test('should return error message if message status code is not 200 0r 401  ', async () => {
  const message = {
    statusCode: 400
  }
  const clientId = uuid()
  devices[clientId] = { ClientId: clientId, ClientSocket: null, ClientData: msg, status: {}, connectionParams: connectionParams, messageId: 0, unauthCount: 0 }
  const response = await updateAMTAdminPassword(clientId, message, responseMsg, configurator, validator, httpHandler)
  expect(response.method).toEqual('error')
  expect(response.message).toEqual('{"Status":"Failed to update AMT admin password"}')
})

test('should throw an error if the digest realm is invalid', async () => {
  let rpsError = null
  const clientId = uuid()
  try {
    devices[clientId] = { ClientId: clientId, ClientSocket: null, ClientData: msg, connectionParams: connectionParams, messageId: 0, unauthCount: 0 }
    await updateAMTAdminPassword(clientId, generalSettings('Digest:AF541D9BC94CFF7ADFA073F492F355E'), responseMsg, configurator, validator, httpHandler)
  } catch (error) {
    rpsError = error
  }
  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toBe(`Device ${devices[clientId].uuid} activation failed. Not a valid digest realm.`)
})

test('should throw an error if the message is AMT_AuthorizationService, status code is 200 and ReturnValue is not 0', async () => {
  let rpsError = null
  const clientId = uuid()

  try {
    devices[clientId] = { ClientId: clientId, ClientSocket: null, ClientData: msg, connectionParams: connectionParams, messageId: 0, unauthCount: 0 }
    await await updateAMTAdminPassword(clientId, setAdminAclEntryExOutPut(1), responseMsg, configurator, validator, httpHandler)
  } catch (error) {
    rpsError = error
  }
  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toBe(`Failed to update AMT admin password for ${devices[clientId].uuid}`)
})
