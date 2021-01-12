/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import { v4 as uuid } from 'uuid'
import * as path from 'path'
import { ACMActivator } from '../actions/ACMActivator'
import Logger from '../Logger'
import { SignatureHelper } from '../utils/SignatureHelper'
import { NodeForge } from '../NodeForge'
import { CertManager } from '../CertManager'
import { Configurator } from '../Configurator'
import { config } from './helper/Config'
import { ClientManager } from '../ClientManager'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { WSManProcessor } from '../WSManProcessor'
import { Validator } from '../Validator'
import { IPSHostBasedSetupService } from './helper/AMTJSONResponses'
import { EnvReader } from '../utils/EnvReader'
import { CIRAConfigurator } from '../actions/CIRAConfigurator'
import { ClientAction } from '../RCS.Config'
import { NetworkConfigurator } from '../actions/NetworkConfigurator'
// EnvReader.InitFromEnv(config);
EnvReader.GlobalEnvConfig = config
EnvReader.configPath = path.join(__dirname, './helper/data.json')
const nodeForge = new NodeForge()
const certManager = new CertManager(nodeForge)
const helper = new SignatureHelper(nodeForge)
const configurator = new Configurator()
const clientManager = ClientManager.getInstance(new Logger('ClientManager'))
const responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'), nodeForge)
const amtwsman = new WSManProcessor(new Logger('WSManProcessor'), clientManager, responseMsg)
const validator = new Validator(new Logger('Validator'), configurator, clientManager, nodeForge)
const ciraConfig = new CIRAConfigurator(new Logger('CIRAConfig'), configurator, responseMsg, amtwsman, clientManager)
const networkConfigurator = new NetworkConfigurator(new Logger('NetworkConfig'), configurator, responseMsg, amtwsman, clientManager, validator, ciraConfig)
const acmActivator = new ACMActivator(new Logger('ACMActivator'), configurator, certManager, helper, responseMsg, amtwsman, clientManager, validator, networkConfigurator)
let clientId, activationmsg

beforeAll(() => {
  clientId = uuid()
  activationmsg = {
    method: 'activation',
    apiKey: 'key',
    appVersion: '1.0.0',
    protocolVersion: '2.0.0',
    status: 'ok',
    message: "all's good!",
    payload: {
      ver: '11.8.50',
      build: '3425',
      fqdn: 'vprodemo.com',
      password: 'KQGnH+N5qJ8YLqjEFJMnGSgcnFLMv0Tk',
      currentMode: 0,
      certHashes: [
        'e7685634efacf69ace939a6b255b7b4fabef42935b50a265acb5cb6027e44e70',
        'eb04cf5eb1f39afa762f2bb120f296cba520c1b97db1589565b81cb9a17b7244',
        'c3846bf24b9e93ca64274c0ec67c1ecc5e024ffcacd2d74019350e81fe546ae4',
        'd7a7a0fb5d7e2731d771e9484ebcdef71d5f0c3e0a2948782bc83ee0ea699ef4',
        '1465fa205397b876faa6f0a9958e5590e40fcc7faa4fb7c2c8677521fb5fb658',
        '83ce3c1229688a593d485f81973c0f9195431eda37cc5e36430e79c7a888638b',
        'a4b6b3996fc2f306b3fd8681bd63413d8c5009cc4fa329c2ccf0e2fa1b140305',
        '9acfab7e43c8d880d06b262a94deeee4b4659989c3d0caf19baf6405e41ab7df',
        'a53125188d2110aa964b02c7b7c6da3203170894e5fb71fffb6667d5e6810a36',
        '16af57a9f676b0ab126095aa5ebadef22ab31119d644ac95cd4b93dbf3f26aeb',
        '960adf0063e96356750c2965dd0a0867da0b9cbd6e77714aeafb2349ab393da3',
        '68ad50909b04363c605ef13581a939ff2c96372e3f12325b0a6861e1d59f6603',
        '6dc47172e01cbcb0bf62580d895fe2b8ac9ad4f873801e0c10b9c837d21eb177',
        '73c176434f1bc6d5adf45b0e76e727287c8de57616c1e6e6141a2b2cbc7d8e4c',
        '2399561127a57125de8cefea610ddf2fa078b5c8067f4e828290bfb860e84b3c',
        '45140b3247eb9cc8c5b4f0d7b53091f73292089e6e5a63e2749dd3aca9198eda',
        '43df5774b03e7fef5fe40d931a7bedf1bb2e6b42738c4e6d3841103d3aa7f339',
        '2ce1cb0bf9d2f9e102993fbe215152c3b2dd0cabde1c68e5319b839154dbb7f5',
        '70a73f7f376b60074248904534b11482d5bf0e698ecc498df52577ebf2e93b9a'
      ],
      sku: '16392',
      uuid: '4bac9510-04a6-4321-bae2-d45ddf07b684',
      username: '$$OsAdmin',
      client: 'PPC',
      profile: 'profile1',
      action: 'acmactivate'
    }
  }
  clientManager.addClient({
    ClientId: clientId,
    ClientSocket: null,
    ClientData: activationmsg
  })
})

describe('activate in admin control mode', () => {
  test('should throw an error when the payload is null', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = activationmsg.payload.uuid
    clientManager.setClientObject(clientObj)

    const clientMsg = { payload: null }
    const responseMsg = await acmActivator.execute(clientMsg, clientId)
    expect(responseMsg.message).toEqual(`Device ${activationmsg.payload.uuid} activation failed. Missing/invalid WSMan response payload.`)
  })

  test('should throw an error when the certificate does not exist on server', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.action = ClientAction.ADMINCTLMODE
    clientObj.uuid = activationmsg.payload.uuid
    clientManager.setClientObject(clientObj)
    const clientMsg = { payload: IPSHostBasedSetupService }
    const responseMsg = await acmActivator.execute(clientMsg, clientId)
    expect(responseMsg.message).toEqual(`Device ${activationmsg.payload.uuid} activation failed. Provisioning certificate doesn't match any trusted certificates from AMT`)
  })
})
