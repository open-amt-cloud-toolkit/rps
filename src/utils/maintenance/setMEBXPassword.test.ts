import { ClientManager } from '../../ClientManager'
import Logger from '../../Logger'
import { NodeForge } from '../../NodeForge'
import { ClientResponseMsg } from '../ClientResponseMsg'
import { RPSError } from '../RPSError'
import { WSManProcessor } from '../../WSManProcessor'
import { v4 as uuid } from 'uuid'
import { setMEBXPassword } from './setMEBXPassword'
import { ClientObject } from '../../models/RCS.Config'

const clientManager = ClientManager.getInstance(new Logger('ClientManager'))
const nodeForge = new NodeForge()
const responseMsg: ClientResponseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'), nodeForge)
const amtwsman: WSManProcessor = new WSManProcessor(new Logger('WSManProcessor'), clientManager, responseMsg)
let msg

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
})

test('should throw an exception if ReturnValue is not equal to zero', async () => {
  let rpsError = null
  let clientObj: ClientObject = null
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
      ReturnValue: 1,
      ReturnValueStr: 'NOTSUCCESS'
    }
  }
  try {
    const clientId = uuid()
    clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: msg })
    clientObj = clientManager.getClientObject(clientId)
    await setMEBXPassword(clientId, message, amtwsman, clientManager, null)
  } catch (error) {
    rpsError = error
  }
  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toContain(`${message.Header.Method} failed for ${clientObj.uuid}`)
})

test('should return true if ReturnValue is zero', async () => {
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
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: msg })
  const result = await setMEBXPassword(clientId, message, amtwsman, clientManager, null)
  expect(result).toBe(true)
})
