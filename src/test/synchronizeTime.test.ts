import { ClientManager } from '../ClientManager'
import Logger from '../Logger'
import { NodeForge } from '../NodeForge'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { RPSError } from '../utils/RPSError'
import { WSManProcessor } from '../WSManProcessor'
import { v4 as uuid } from 'uuid'
import { synchronizeTime } from '../utils/maintenance/synchronizeTime'
import { ClientObject } from '../RCS.Config'
import { AMTUserName } from '../utils/constants'

const clientManager = ClientManager.getInstance(new Logger('ClientManager'))
const nodeForge = new NodeForge()
const responseMsg: ClientResponseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'), nodeForge)
const amtwsman: WSManProcessor = new WSManProcessor(new Logger('WSManProcessor'), clientManager, responseMsg)
let maintenanceMsg
let amtwsmanExecuteSpy: jest.SpyInstance

beforeEach(() => {
  amtwsmanExecuteSpy = jest.spyOn(amtwsman, 'execute')
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
})

test('should throw an exception if ReturnValue is not equal to zero', async () => {
  let rpsError = null
  let clientObj: ClientObject = null
  const message = {
    payload: {
      Header: {
        To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
        RelatesTo: '32',
        Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_TimeSynchronizationService/SetHighAccuracyTimeSynchResponse',
        MessageID: 'uuid:00000000-8086-8086-8086-00000002CFEB',
        ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_TimeSynchronizationService',
        Method: 'SetHighAccuracyTimeSynch'
      },
      Body: {
        ReturnValue: 1,
        ReturnValueStr: 'PT_STATUS_INTERNAL_ERROR'
      }
    }
  }
  try {
    const clientId = uuid()
    clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg })
    clientObj = clientManager.getClientObject(clientId)
    await synchronizeTime(clientId, message, amtwsman, clientManager)
  } catch (error) {
    rpsError = error
  }
  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toContain(`${message.payload.Header.Method} failed for ${clientObj.uuid}`)
})

test('should return true if ReturnValue is zero', async () => {
  const message = {
    payload: {
      Header: {
        To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
        RelatesTo: '32',
        Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_TimeSynchronizationService/SetHighAccuracyTimeSynchResponse',
        MessageID: 'uuid:00000000-8086-8086-8086-00000002CFEB',
        ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_TimeSynchronizationService',
        Method: 'SetHighAccuracyTimeSynch'
      },
      Body: {
        ReturnValue: 0,
        ReturnValueStr: 'SUCCESS'
      }
    }
  }
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg })
  const result = await synchronizeTime(clientId, message, amtwsman, clientManager)
  expect(result).toBe(true)
})

test('should synchronize time', async () => {
  const message = {
    payload: {
      Header: {
        To: 'http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous',
        RelatesTo: '31',
        Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_TimeSynchronizationService/GetLowAccuracyTimeSynchResponse',
        MessageID: 'uuid:00000000-8086-8086-8086-00000002CFEA',
        ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_TimeSynchronizationService',
        Method: 'GetLowAccuracyTimeSynch'
      },
      Body: {
        Ta0: 1633106396,
        ReturnValue: 0,
        ReturnValueStr: 'SUCCESS'
      }
    }
  }
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg })
  await synchronizeTime(clientId, message, amtwsman, clientManager)
  const Tm1 = Math.round(new Date().getTime() / 1000)
  expect(amtwsmanExecuteSpy).toHaveBeenCalledWith(clientId, 'AMT_TimeSynchronizationService', 'SetHighAccuracyTimeSynch', { Ta0: 1633106396, Tm1: Tm1, Tm2: Tm1 }, null, AMTUserName, 'P@ssw0rd')
})

test('should synchronize time', async () => {
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg })
  await synchronizeTime(clientId, maintenanceMsg, amtwsman, clientManager)
  expect(amtwsmanExecuteSpy).toHaveBeenCalledWith(clientId, 'AMT_TimeSynchronizationService', 'GetLowAccuracyTimeSynch', {}, null, AMTUserName, 'P@ssw0rd')
})
