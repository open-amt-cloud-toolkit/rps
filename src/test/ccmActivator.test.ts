/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import { v4 as uuid } from 'uuid'

import { CCMActivator } from '../actions/CCMActivator'
import Logger from '../Logger'
import { NodeForge } from '../NodeForge'
import { Configurator } from '../Configurator'
import { config } from './helper/Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { WSManProcessor } from '../WSManProcessor'
import { ClientManager } from '../ClientManager'
import { Validator } from '../Validator'
import { EnvReader } from '../utils/EnvReader'
import { CIRAConfigurator } from '../actions/CIRAConfigurator'
import { NetworkConfigurator } from '../actions/NetworkConfigurator'

// EnvReader.InitFromEnv(config);
EnvReader.GlobalEnvConfig = config
const nodeForge = new NodeForge()
const configurator = new Configurator()
const clientManager = ClientManager.getInstance(new Logger('ClientManager'))
const responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'), nodeForge)
const amtwsman = new WSManProcessor(new Logger('WSManProcessor'), clientManager, responseMsg)
const validator = new Validator(new Logger('Validator'), configurator, clientManager, nodeForge)
const ciraConfig = new CIRAConfigurator(new Logger('CIRAConfig'), configurator, responseMsg, amtwsman, clientManager)
const networkConfigurator = new NetworkConfigurator(new Logger('NetworkConfig'), configurator, responseMsg, amtwsman, clientManager, validator, ciraConfig)
const ccmActivate = new CCMActivator(new Logger('CCMActivator'), configurator, responseMsg, amtwsman, clientManager, validator, networkConfigurator)
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
      password: 'KQGnH+N5qJ8YLqjEFJMnGSgcnFLMv0Tk',
      currentMode: 0,
      sku: '16392',
      uuid: '4bac9510-04a6-4321-bae2-d45ddf07b684',
      username: '$$OsAdmin',
      client: 'PPC',
      profile: 'profile1',
      action: 'ccmactivate'
    }
  }
  clientManager.addClient({
    ClientId: clientId,
    ClientSocket: null,
    ClientData: activationmsg
  })
})

describe('Activate in client control mode', () => {
  test('should throw an error when the payload is null', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = activationmsg.payload.uuid
    clientManager.setClientObject(clientObj)
    const clientMsg = { payload: null }
    const ccmactivateMsg = await ccmActivate.execute(clientMsg, clientId)
    expect(ccmactivateMsg.message).toEqual(' Failed to activate in client control mode')
  })
})
