import { ClientManager } from '../ClientManager'
import Logger from '../Logger'
import { NodeForge } from '../NodeForge'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { RPSError } from '../utils/RPSError'
import { WSManProcessor } from '../WSManProcessor'
import { v4 as uuid } from 'uuid'
import { updateAMTAdminPassword } from '../utils/maintenance/updateAMTAdminPassword'
import { ClientObject } from '../models/RCS.Config'
import { Configurator } from '../Configurator'
import { Validator } from '../Validator'
import { config } from './helper/Config'
import { EnvReader } from '../utils/EnvReader'

EnvReader.GlobalEnvConfig = config
const clientManager = ClientManager.getInstance(new Logger('ClientManager'))
const nodeForge = new NodeForge()
const configurator = new Configurator()
const responseMsg: ClientResponseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'), nodeForge)
const validator = new Validator(new Logger('Validator'), configurator, clientManager, nodeForge)
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
      RelatesTo: 2,
      Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_AuthorizationService/SetAdminAclEntryExResponse',
      MessageID: 'uuid:00000000-8086-8086-8086-00000000275D',
      ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_AuthorizationService',
      Method: 'SetAdminAclEntryEx'
    },
    Body: {
      ReturnValue: 2054,
      ReturnValueStr: 'INVALID_PASSWORD'
    }
  }
  try {
    const clientId = uuid()
    clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: msg })
    clientObj = clientManager.getClientObject(clientId)
    await updateAMTAdminPassword(clientId, message, amtwsman, clientManager, configurator, validator)
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
      RelatesTo: 2,
      Action: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_AuthorizationService/SetAdminAclEntryExResponse',
      MessageID: 'uuid:00000000-8086-8086-8086-00000000275D',
      ResourceURI: 'http://intel.com/wbem/wscim/1/amt-schema/1/AMT_AuthorizationService',
      Method: 'SetAdminAclEntryEx'
    },
    Body: {
      ReturnValue: 0,
      ReturnValueStr: 'SUCCESS'
    }
  }
  const clientId = uuid()
  clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: msg })
  const result = await updateAMTAdminPassword(clientId, message, amtwsman, clientManager, configurator, validator)
  expect(result).toBe(true)
})

test('should throw an error if the digest realm is invalid', async () => {
  let rpsError = null
  let clientObj: ClientObject = null
  const message = { AMT_GeneralSettings: { response: { DigestRealm: 'Digest:968871E1351D09ADA0E8C5D7282407' } } }
  try {
    const clientId = uuid()
    clientManager.addClient({ ClientId: clientId, ClientSocket: null, ClientData: msg })
    clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = msg.uuid
    await updateAMTAdminPassword(clientId, message, amtwsman, clientManager, configurator, validator)
  } catch (error) {
    rpsError = error
  }
  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toBe(`Device ${clientObj.uuid} activation failed. Not a valid digest realm.`)
})
