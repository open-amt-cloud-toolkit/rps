import { ClientManager } from '../../ClientManager'
import Logger from '../../Logger'
import { ClientResponseMsg } from '../ClientResponseMsg'
import { v4 as uuid } from 'uuid'
import { synchronizeTime } from './synchronizeTime'
import { HttpHandler } from '../../HttpHandler'

const clientManager = ClientManager.getInstance(new Logger('ClientManager'))
const responseMsg: ClientResponseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
const httpHandler = new HttpHandler()
const message = { payload: { statusCode: null, header: null, body: null } }
let maintenanceMsg
let getLowAccuracyTimeSync = null
let setHighAccuracyTimeSync = null
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
  maintenanceMsg = {
    method: 'maintenance',
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
      password: 'P@ssw0rd',
      currentMode: 0,
      hostname: 'DESKTOP-B22S514',
      fqdn: 'vprodemo.com',
      client: 'RPC',
      certHashes: [
        'c3846bf24b9e93ca64274c0ec67c1ecc5e024ffcacd2d74019350e81fe546ae4',
        '45140b3247eb9cc8c5b4f0d7b53091f73292089e6e5a63e2749dd3aca9198eda'
      ],
      task: 'synctime'
    }
  }
  getLowAccuracyTimeSync = (value: number) => {
    return {
      text: '048D\r\n' +
              `<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_TimeSynchronizationService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>1</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_TimeSynchronizationService/GetLowAccuracyTimeSynchResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-00000000004A</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_TimeSynchronizationService</c:ResourceURI></a:Header><a:Body><g:GetLowAccuracyTimeSynch_OUTPUT><g:Ta0>1644242209</g:Ta0><g:ReturnValue>${value}</g:ReturnValue></g:GetLowAccuracyTimeSynch_OUTPUT></a:Body></a:Envelope>\r\n` +
              '0\r\n' +
              '\r\n'
    }
  }
  setHighAccuracyTimeSync = (value: number, response: string) => {
    return {
      text: '0477\r\n' +
      `<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_TimeSynchronizationService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>2</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_TimeSynchronizationService/${response}</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-00000000004C</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_TimeSynchronizationService</c:ResourceURI></a:Header><a:Body><g:SetHighAccuracyTimeSynch_OUTPUT><g:ReturnValue>${value}</g:ReturnValue></g:SetHighAccuracyTimeSynch_OUTPUT></a:Body></a:Envelope>\r\n` +
      '0\r\n' +
      '\r\n'
    }
  }
})

test('should return a wsman message if input message a maintenance request', async () => {
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg, status: {}, connectionParams: connectionParams, messageId: 0 })
  const response = await synchronizeTime(clientId, maintenanceMsg, responseMsg, clientManager, httpHandler)
  expect(response.method).toBe('wsman')
})

test('should return a wsman message if input is a 401 unauthorized error from AMT', async () => {
  message.payload.statusCode = 401
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg, status: {}, connectionParams: connectionParams, messageId: 0 })
  const response = await synchronizeTime(clientId, message, responseMsg, clientManager, httpHandler)
  expect(response.method).toBe('wsman')
})

test('should return a wsman message if input is a 200 response message for GET_LOW_ACCURACY_TIME_SYNCH', async () => {
  message.payload.statusCode = 200
  message.payload.body = getLowAccuracyTimeSync(0)
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg, status: {}, connectionParams: connectionParams, messageId: 0 })
  const response = await synchronizeTime(clientId, message, responseMsg, clientManager, httpHandler)
  expect(response.method).toBe('wsman')
})

test('should return an error message if input is a 200 response message for GET_LOW_ACCURACY_TIME_SYNCH and return value is not zero', async () => {
  message.payload.statusCode = 200
  message.payload.body = getLowAccuracyTimeSync(1)
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg, status: {}, connectionParams: connectionParams, messageId: 0 })
  const response = await synchronizeTime(clientId, message, responseMsg, clientManager, httpHandler)
  expect(response.method).toBe('error')
  expect(response.message).toEqual('{"Status":"Failed to Synchronize time"}')
})

test('should return success message if input is a 200 response message for SET_HIGH_ACCURACY_TIME_SYNCH', async () => {
  message.payload.statusCode = 200
  message.payload.body = setHighAccuracyTimeSync(0, 'SetHighAccuracyTimeSynchResponse')
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg, status: {}, connectionParams: connectionParams, messageId: 0 })
  const response = await synchronizeTime(clientId, message, responseMsg, clientManager, httpHandler)
  expect(response.method).toBe('success')
  expect(response.message).toEqual('{"Status":"Time Synchronized"}')
})
test('should return an error message if input  is a 200 response message for SET_HIGH_ACCURACY_TIME_SYNCH and return value is not zero', async () => {
  message.payload.statusCode = 200
  message.payload.body = setHighAccuracyTimeSync(1, 'SetHighAccuracyTimeSynchResponse')
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg, status: {}, connectionParams: connectionParams, messageId: 0 })
  const response = await synchronizeTime(clientId, message, responseMsg, clientManager, httpHandler)
  expect(response.method).toBe('error')
  expect(response.message).toEqual('{"Status":"Failed to Synchronize time"}')
})
test('should return an error message if input is a 200 response message but not for SET_HIGH_ACCURACY_TIME_SYNCH and GET_LOW_ACCURACY_TIME_SYNCH', async () => {
  message.payload.statusCode = 200
  message.payload.body = setHighAccuracyTimeSync(1, 'SetHighAccuracyTimeSynchResronse')
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg, status: {}, connectionParams: connectionParams, messageId: 0 })
  const response = await synchronizeTime(clientId, message, responseMsg, clientManager, httpHandler)
  expect(response.method).toBe('error')
  expect(response.message).toEqual('{"Status":"Failed to Synchronize time"}')
})
test('should return an error message if input is not 401 0r 200', async () => {
  message.payload.statusCode = 400
  message.payload.body = null
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg, status: {}, connectionParams: connectionParams, messageId: 0 })
  const response = await synchronizeTime(clientId, message, responseMsg, clientManager, httpHandler)
  expect(response.method).toBe('error')
  expect(response.message).toEqual('{"Status":"Failed to Synchronize time"}')
})
