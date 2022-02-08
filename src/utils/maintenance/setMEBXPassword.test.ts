import { ClientManager } from '../../ClientManager'
import Logger from '../../Logger'
import { NodeForge } from '../../NodeForge'
import { ClientResponseMsg } from '../ClientResponseMsg'
import { v4 as uuid } from 'uuid'
import { setMEBXPassword } from './setMEBXPassword'
import { HttpHandler } from '../../HttpHandler'
import { Configurator } from '../../Configurator'
import { EnvReader } from '../EnvReader'
import { config } from '../../test/helper/Config'

EnvReader.GlobalEnvConfig = config
const clientManager = ClientManager.getInstance(new Logger('ClientManager'))
const nodeForge = new NodeForge()
const configurator = new Configurator()
const responseMsg: ClientResponseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'), nodeForge)
const httpHandler = new HttpHandler()
let msg
let SetMEBxPasswordOutPut = null
const message = { statusCode: 200, body: { text: null } }
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
  const digestChallenge = {
    realm: 'Digest:AF541D9BC94CFF7ADFA073F492F355E6',
    nonce: 'dxNzCQ9JBAAAAAAAd2N7c6tYmUl0FFzQ',
    stale: 'false',
    qop: 'auth'
  }
  httpHandler.connectionParams = {
    guid: '4c4c4544-004b-4210-8033-b6c04f504633',
    port: 16992,
    digestChallenge: digestChallenge,
    username: 'admin',
    password: 'P@ssw0rd'
  }
  SetMEBxPasswordOutPut = (value: number) => {
    message.body.text = '0462\r\n' +
   `<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>7</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService/SetMEBxPasswordResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-00000000002F</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService</c:ResourceURI></a:Header><a:Body><g:SetMEBxPassword_OUTPUT><g:ReturnValue>${value}</g:ReturnValue></g:SetMEBxPassword_OUTPUT></a:Body></a:Envelope>\r\n` +
   '0\r\n' +
   '\r\n'
    return message
  }
})

test('should return wsman message if incoming message is empty', async () => {
  const getMEBxPasswordSpy = jest.spyOn(configurator.profileManager, 'getMEBxPassword').mockImplementation(async () => 'P@ssw0rd')
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: msg, status: {} })
  const response = await setMEBXPassword(clientId, '', responseMsg, clientManager, configurator, httpHandler)
  expect(getMEBxPasswordSpy).toHaveBeenCalled()
  expect(response.method).toEqual('wsman')
})

test('should return wsman message if status code is 401', async () => {
  const getMEBxPasswordSpy = jest.spyOn(configurator.profileManager, 'getMEBxPassword').mockImplementation(async () => 'P@ssw0rd')
  const message = {
    statusCode: 401,
    headers: [],
    body: {}
  }
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: msg, status: {} })
  const response = await setMEBXPassword(clientId, message, responseMsg, clientManager, configurator, httpHandler)
  expect(getMEBxPasswordSpy).toHaveBeenCalled()
  expect(response.method).toEqual('wsman')
})

test('should return success message if ReturnValue is zero', async () => {
  const getMEBxPasswordSpy = jest.spyOn(configurator.profileManager, 'getMEBxPassword').mockImplementation(async () => 'P@ssw0rd')
  const insertSpy = jest.spyOn(configurator.amtDeviceRepository, 'insert').mockImplementation(async () => true)
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: msg, status: {} })
  const response = await setMEBXPassword(clientId, SetMEBxPasswordOutPut(0), responseMsg, clientManager, configurator, httpHandler)
  expect(getMEBxPasswordSpy).toHaveBeenCalled()
  expect(insertSpy).toHaveBeenCalled()
  expect(response.method).toEqual('success')
  expect(response.message).toEqual('{"Status":"MEBx Password updated"}')
})

test('should return error message if ReturnValue is not zero', async () => {
  const getMEBxPasswordSpy = jest.spyOn(configurator.profileManager, 'getMEBxPassword').mockImplementation(async () => 'P@ssw0rd')
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: msg, status: {} })
  const response = await setMEBXPassword(clientId, SetMEBxPasswordOutPut(1), responseMsg, clientManager, configurator, httpHandler)
  expect(getMEBxPasswordSpy).toHaveBeenCalled()
  expect(response.method).toEqual('error')
  expect(response.message).toEqual('{"Status":"Failed to update MEBx Password"}')
})

test('should return success message if ReturnValue is not zero and client message status is activated', async () => {
  const getMEBxPasswordSpy = jest.spyOn(configurator.profileManager, 'getMEBxPassword').mockImplementation(async () => 'P@ssw0rd')
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: msg, status: { Status: 'Admin control mode' } })
  const response = await setMEBXPassword(clientId, SetMEBxPasswordOutPut(1), responseMsg, clientManager, configurator, httpHandler)
  expect(getMEBxPasswordSpy).toHaveBeenCalled()
  expect(response.method).toEqual('error')
})

test('should not insert into vault if configurator is null', async () => {
  const getMEBxPasswordSpy = jest.spyOn(configurator.profileManager, 'getMEBxPassword').mockImplementation(async () => 'P@ssw0rd')
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: msg, status: {} })
  configurator.amtDeviceRepository = null
  const response = await setMEBXPassword(clientId, SetMEBxPasswordOutPut(0), responseMsg, clientManager, configurator, httpHandler)
  expect(getMEBxPasswordSpy).toHaveBeenCalled()
  expect(response.method).toEqual('success')
})

test('should return error message if status code is not 401 or 200', async () => {
  const getMEBxPasswordSpy = jest.spyOn(configurator.profileManager, 'getMEBxPassword').mockImplementation(async () => 'P@ssw0rd')
  const message = {
    statusCode: 400
  }
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: msg, status: {} })
  const response = await setMEBXPassword(clientId, message, responseMsg, clientManager, configurator, httpHandler)
  expect(getMEBxPasswordSpy).toHaveBeenCalled()
  expect(response.method).toEqual('error')
  expect(response.message).toEqual('{"Status":"Failed to update MEBx Password"}')
})

test('should return error message if status code is not 401 or 200, client status message is not null', async () => {
  const getMEBxPasswordSpy = jest.spyOn(configurator.profileManager, 'getMEBxPassword').mockImplementation(async () => 'P@ssw0rd')
  const message = {
    statusCode: 400
  }
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: msg, status: { Status: 'Admin control mode' } })
  const response = await setMEBXPassword(clientId, message, responseMsg, clientManager, configurator, httpHandler)
  expect(getMEBxPasswordSpy).toHaveBeenCalled()
  expect(response.method).toEqual('error')
  expect(response.message).toEqual('{"Status":"Admin control mode, Failed to update MEBx Password"}')
})
