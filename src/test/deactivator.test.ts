/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Brian Osburn
 **********************************************************************/
import { v4 as uuid } from 'uuid'

import { Deactivator } from '../actions/Deactivator'
import Logger from '../Logger'
import { NodeForge } from '../NodeForge'
import { config } from './helper/Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { WSManProcessor } from '../WSManProcessor'
import { ClientManager } from '../ClientManager'
import { EnvReader } from '../utils/EnvReader'

// EnvReader.InitFromEnv(config);

EnvReader.GlobalEnvConfig = config

const nodeForge = new NodeForge()
const clientManager = ClientManager.getInstance(new Logger('ClientManager'))
const responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'), nodeForge)
const amtwsman = new WSManProcessor(new Logger('WSManProcessor'), clientManager, responseMsg, nodeForge)
const deactivate = new Deactivator(new Logger('Deactivator'), responseMsg, amtwsman, clientManager)
let clientId, deactivatemsg

beforeAll(() => {
  clientId = uuid()
  deactivatemsg = {
    method: 'deactivation',
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
      action: 'deactivate'
    }
  }
  clientManager.addClient({
    ClientId: clientId,
    ClientSocket: null,
    ClientData: deactivatemsg,
    status: {}
  })
})

describe('deactivate from admin control mode', () => {
  test('should throw an error when the payload is null', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = deactivatemsg.payload.uuid
    clientManager.setClientObject(clientObj)

    const clientMsg = { payload: null }
    const deactivateMsg = await deactivate.execute(clientMsg, clientId)
    expect(deactivateMsg.message).toEqual(`{"Deactivation":"Device ${deactivatemsg.payload.uuid} deactivate failed : Missing/invalid WSMan response payload."}`)
  })
})
