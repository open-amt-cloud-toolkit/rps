
import { ClientManager } from '../ClientManager'
import { Configurator } from '../Configurator'
import Logger from '../Logger'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { WSManProcessor } from '../WSManProcessor'
import { v4 as uuid } from 'uuid'
import { EnvReader } from '../utils/EnvReader'
import { config } from '../test/helper/Config'
import { Maintenance } from './Maintenance'
EnvReader.GlobalEnvConfig = config
const configurator = new Configurator()
const clientManager = ClientManager.getInstance(new Logger('ClientManager'))
const responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
const amtwsman = new WSManProcessor(new Logger('WSManProcessor'), clientManager, responseMsg)
const maintenance = new Maintenance(new Logger('Maintenance'), configurator, responseMsg, amtwsman, clientManager)
let maintenanceMsg
describe('execute', () => {
  beforeEach(() => {
    maintenanceMsg = {
      method: 'maintenance',
      apiKey: 'key',
      appVersion: '1.0.0',
      protocolVersion: '4.0.0',
      status: 'ok',
      message: 'ok',
      fqdn: '',
      uuid: '4c4c4544-005a-3510-804b-b4c04f564433',
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
  test('should return success response for successful timesync response', async () => {
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
    const result = await maintenance.execute(message, clientId)
    console.log(result)
    expect(result.method).toBe('success')
  })
  test('should return failure message for maintenance task does not exists', async () => {
    const clientId = uuid()
    maintenanceMsg.payload.task = 'setMEBXPassword'
    clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg })
    const result = await maintenance.execute(maintenanceMsg, clientId)
    console.log(result)
    expect(result.method).toBe('error')
  })
  test('should throw an exception if ', async () => {
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
    const clientId = uuid()
    clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: maintenanceMsg })
    const result = await maintenance.execute(message, clientId)
    console.log(result)
    expect(result.method).toBe('error')
  })
})
