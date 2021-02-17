/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import { v4 as uuid } from 'uuid'

import Logger from '../Logger'
import { config } from './helper/Config'
import { NodeForge } from '../NodeForge'
import { Validator } from '../Validator'
import { Configurator } from '../Configurator'
import { ClientManager } from '../ClientManager'
import { RPSError } from '../utils/RPSError'
import { EnvReader } from '../utils/EnvReader'
import * as path from 'path'
import { ClientAction } from '../RCS.Config'
import { VersionChecker } from '../VersionChecker'

EnvReader.GlobalEnvConfig = config
EnvReader.configPath = path.join(__dirname, './helper/data.json')
const nodeForge = new NodeForge()
const configurator: Configurator = new Configurator()
const clientManager = ClientManager.getInstance(new Logger('ClientManager'))
const validator = new Validator(new Logger('Validator'), configurator, clientManager, nodeForge)
let activationmsg

describe('Activation message', () => {
  beforeEach(() => {
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
        profile: 'profile1'
      }
    }
  })

  test('should parse and return a client activation message', () => {
    const msg = '{"apiKey":"key","appVersion":"1.0.0","message":"all\'s good!","method":"activation","payload":"eyJidWlsZCI6IjM0MjUiLCJjZXJ0SGFzaGVzIjpbImU3Njg1NjM0ZWZhY2Y2OWFjZTkzOWE2YjI1NWI3YjRmYWJlZjQyOTM1YjUwYTI2NWFjYjVjYjYwMjdlNDRlNzAiLCJlYjA0Y2Y1ZWIxZjM5YWZhNzYyZjJiYjEyMGYyOTZjYmE1MjBjMWI5N2RiMTU4OTU2NWI4MWNiOWExN2I3MjQ0IiwiYzM4NDZiZjI0YjllOTNjYTY0Mjc0YzBlYzY3YzFlY2M1ZTAyNGZmY2FjZDJkNzQwMTkzNTBlODFmZTU0NmFlNCIsImQ3YTdhMGZiNWQ3ZTI3MzFkNzcxZTk0ODRlYmNkZWY3MWQ1ZjBjM2UwYTI5NDg3ODJiYzgzZWUwZWE2OTllZjQiLCIxNDY1ZmEyMDUzOTdiODc2ZmFhNmYwYTk5NThlNTU5MGU0MGZjYzdmYWE0ZmI3YzJjODY3NzUyMWZiNWZiNjU4IiwiODNjZTNjMTIyOTY4OGE1OTNkNDg1ZjgxOTczYzBmOTE5NTQzMWVkYTM3Y2M1ZTM2NDMwZTc5YzdhODg4NjM4YiIsImE0YjZiMzk5NmZjMmYzMDZiM2ZkODY4MWJkNjM0MTNkOGM1MDA5Y2M0ZmEzMjljMmNjZjBlMmZhMWIxNDAzMDUiLCI5YWNmYWI3ZTQzYzhkODgwZDA2YjI2MmE5NGRlZWVlNGI0NjU5OTg5YzNkMGNhZjE5YmFmNjQwNWU0MWFiN2RmIiwiYTUzMTI1MTg4ZDIxMTBhYTk2NGIwMmM3YjdjNmRhMzIwMzE3MDg5NGU1ZmI3MWZmZmI2NjY3ZDVlNjgxMGEzNiIsIjE2YWY1N2E5ZjY3NmIwYWIxMjYwOTVhYTVlYmFkZWYyMmFiMzExMTlkNjQ0YWM5NWNkNGI5M2RiZjNmMjZhZWIiLCI5NjBhZGYwMDYzZTk2MzU2NzUwYzI5NjVkZDBhMDg2N2RhMGI5Y2JkNmU3NzcxNGFlYWZiMjM0OWFiMzkzZGEzIiwiNjhhZDUwOTA5YjA0MzYzYzYwNWVmMTM1ODFhOTM5ZmYyYzk2MzcyZTNmMTIzMjViMGE2ODYxZTFkNTlmNjYwMyIsIjZkYzQ3MTcyZTAxY2JjYjBiZjYyNTgwZDg5NWZlMmI4YWM5YWQ0Zjg3MzgwMWUwYzEwYjljODM3ZDIxZWIxNzciLCI3M2MxNzY0MzRmMWJjNmQ1YWRmNDViMGU3NmU3MjcyODdjOGRlNTc2MTZjMWU2ZTYxNDFhMmIyY2JjN2Q4ZTRjIiwiMjM5OTU2MTEyN2E1NzEyNWRlOGNlZmVhNjEwZGRmMmZhMDc4YjVjODA2N2Y0ZTgyODI5MGJmYjg2MGU4NGIzYyIsIjQ1MTQwYjMyNDdlYjljYzhjNWI0ZjBkN2I1MzA5MWY3MzI5MjA4OWU2ZTVhNjNlMjc0OWRkM2FjYTkxOThlZGEiLCI0M2RmNTc3NGIwM2U3ZmVmNWZlNDBkOTMxYTdiZWRmMWJiMmU2YjQyNzM4YzRlNmQzODQxMTAzZDNhYTdmMzM5IiwiMmNlMWNiMGJmOWQyZjllMTAyOTkzZmJlMjE1MTUyYzNiMmRkMGNhYmRlMWM2OGU1MzE5YjgzOTE1NGRiYjdmNSIsIjcwYTczZjdmMzc2YjYwMDc0MjQ4OTA0NTM0YjExNDgyZDViZjBlNjk4ZWNjNDk4ZGY1MjU3N2ViZjJlOTNiOWEiXSwiY2xpZW50IjoiUFBDIiwiY3VycmVudE1vZGUiOjAsImZxZG4iOiJ2cHJvZGVtby5jb20iLCJwYXNzd29yZCI6IktRR25IK041cUo4WUxxakVGSk1uR1NnY25GTE12MFRrIiwicHJvZmlsZSI6InByb2ZpbGUxIiwic2t1IjoiMTYzOTIiLCJ1c2VybmFtZSI6IiQkT3NBZG1pbiIsInV1aWQiOlsxNiwxNDksMTcyLDc1LDE2Niw0LDMzLDY3LDE4NiwyMjYsMjEyLDkzLDIyMyw3LDE4MiwxMzJdLCJ2ZXIiOiIxMS44LjUwIn0=","protocolVersion":"2.0.0","status":"ok"}'
    const clientId = uuid()
    clientManager.addClient({ ClientId: clientId, ClientSocket: null })
    VersionChecker.setCurrentVersion('2.0.0')
    const clientMsg = validator.parseClientMsg(msg, clientId)
    expect(clientMsg).toEqual(activationmsg)
  })

  test('check protocol version of message', () => {
    const msg = '{"apiKey":"key","appVersion":"1.0.0","message":"all\'s good!","method":"activation","payload":"eyJidWlsZCI6IjM0MjUiLCJjZXJ0SGFzaGVzIjpbImU3Njg1NjM0ZWZhY2Y2OWFjZTkzOWE2YjI1NWI3YjRmYWJlZjQyOTM1YjUwYTI2NWFjYjVjYjYwMjdlNDRlNzAiLCJlYjA0Y2Y1ZWIxZjM5YWZhNzYyZjJiYjEyMGYyOTZjYmE1MjBjMWI5N2RiMTU4OTU2NWI4MWNiOWExN2I3MjQ0IiwiYzM4NDZiZjI0YjllOTNjYTY0Mjc0YzBlYzY3YzFlY2M1ZTAyNGZmY2FjZDJkNzQwMTkzNTBlODFmZTU0NmFlNCIsImQ3YTdhMGZiNWQ3ZTI3MzFkNzcxZTk0ODRlYmNkZWY3MWQ1ZjBjM2UwYTI5NDg3ODJiYzgzZWUwZWE2OTllZjQiLCIxNDY1ZmEyMDUzOTdiODc2ZmFhNmYwYTk5NThlNTU5MGU0MGZjYzdmYWE0ZmI3YzJjODY3NzUyMWZiNWZiNjU4IiwiODNjZTNjMTIyOTY4OGE1OTNkNDg1ZjgxOTczYzBmOTE5NTQzMWVkYTM3Y2M1ZTM2NDMwZTc5YzdhODg4NjM4YiIsImE0YjZiMzk5NmZjMmYzMDZiM2ZkODY4MWJkNjM0MTNkOGM1MDA5Y2M0ZmEzMjljMmNjZjBlMmZhMWIxNDAzMDUiLCI5YWNmYWI3ZTQzYzhkODgwZDA2YjI2MmE5NGRlZWVlNGI0NjU5OTg5YzNkMGNhZjE5YmFmNjQwNWU0MWFiN2RmIiwiYTUzMTI1MTg4ZDIxMTBhYTk2NGIwMmM3YjdjNmRhMzIwMzE3MDg5NGU1ZmI3MWZmZmI2NjY3ZDVlNjgxMGEzNiIsIjE2YWY1N2E5ZjY3NmIwYWIxMjYwOTVhYTVlYmFkZWYyMmFiMzExMTlkNjQ0YWM5NWNkNGI5M2RiZjNmMjZhZWIiLCI5NjBhZGYwMDYzZTk2MzU2NzUwYzI5NjVkZDBhMDg2N2RhMGI5Y2JkNmU3NzcxNGFlYWZiMjM0OWFiMzkzZGEzIiwiNjhhZDUwOTA5YjA0MzYzYzYwNWVmMTM1ODFhOTM5ZmYyYzk2MzcyZTNmMTIzMjViMGE2ODYxZTFkNTlmNjYwMyIsIjZkYzQ3MTcyZTAxY2JjYjBiZjYyNTgwZDg5NWZlMmI4YWM5YWQ0Zjg3MzgwMWUwYzEwYjljODM3ZDIxZWIxNzciLCI3M2MxNzY0MzRmMWJjNmQ1YWRmNDViMGU3NmU3MjcyODdjOGRlNTc2MTZjMWU2ZTYxNDFhMmIyY2JjN2Q4ZTRjIiwiMjM5OTU2MTEyN2E1NzEyNWRlOGNlZmVhNjEwZGRmMmZhMDc4YjVjODA2N2Y0ZTgyODI5MGJmYjg2MGU4NGIzYyIsIjQ1MTQwYjMyNDdlYjljYzhjNWI0ZjBkN2I1MzA5MWY3MzI5MjA4OWU2ZTVhNjNlMjc0OWRkM2FjYTkxOThlZGEiLCI0M2RmNTc3NGIwM2U3ZmVmNWZlNDBkOTMxYTdiZWRmMWJiMmU2YjQyNzM4YzRlNmQzODQxMTAzZDNhYTdmMzM5IiwiMmNlMWNiMGJmOWQyZjllMTAyOTkzZmJlMjE1MTUyYzNiMmRkMGNhYmRlMWM2OGU1MzE5YjgzOTE1NGRiYjdmNSIsIjcwYTczZjdmMzc2YjYwMDc0MjQ4OTA0NTM0YjExNDgyZDViZjBlNjk4ZWNjNDk4ZGY1MjU3N2ViZjJlOTNiOWEiXSwiY2xpZW50IjoiUFBDIiwiY3VycmVudE1vZGUiOjAsImZxZG4iOiJ2cHJvZGVtby5jb20iLCJwYXNzd29yZCI6IktRR25IK041cUo4WUxxakVGSk1uR1NnY25GTE12MFRrIiwicHJvZmlsZSI6InByb2ZpbGUxIiwic2t1IjoiMTYzOTIiLCJ1c2VybmFtZSI6IiQkT3NBZG1pbiIsInV1aWQiOlsxNiwxNDksMTcyLDc1LDE2Niw0LDMzLDY3LDE4NiwyMjYsMjEyLDkzLDIyMyw3LDE4MiwxMzJdLCJ2ZXIiOiIxMS44LjUwIn0=","protocolVersion":"2.0.0","status":"ok"}'
    const clientId = uuid()
    clientManager.addClient({ ClientId: clientId, ClientSocket: null })
    VersionChecker.setCurrentVersion('3.0.0')

    let rpsError = null

    try {
      validator.parseClientMsg(msg, clientId)
    } catch (error) {
      rpsError = error
    }

    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual(
      'protocol version NOT supported: 2.0.0'
    )
  })

  test('should throw an exception `Error while Validating the client message` if the message is null during the validation', async () => {
    let rpsError = null
    try {
      const clientId = uuid()
      clientManager.addClient({ ClientId: clientId, ClientSocket: null })
      await validator.validateActivationMsg(null, clientId)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual(
      'Error while Validating the client message'
    )
  })

  test('should throw an exception `Missing password` if the message payload password is undefined during the validation', async () => {
    let rpsError = null
    try {
      const clientId = uuid()
      clientManager.addClient({ ClientId: clientId, ClientSocket: null })
      activationmsg.payload.password = undefined
      await validator.validateActivationMsg(activationmsg, clientId)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual(`Device ${activationmsg.payload.uuid} activation failed. Missing password.`)
  })

  test('should throw an exception `Specified AMT profile name does not match list of available AMT profiles.`', async () => {
    let rpsError = null
    try {
      const clientId = uuid()
      clientManager.addClient({ ClientId: clientId, ClientSocket: null })
      activationmsg.payload.profile = 'profile5'
      await validator.validateActivationMsg(activationmsg, clientId)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual(`Device ${activationmsg.payload.uuid} activation failed. Specified AMT profile name does not match list of available AMT profiles.`)
  })

  test('should update the payload with action if the profile exists', async () => {
    const msg = '{"apiKey":"key","appVersion":"1.0.0","message":"all\'s good!","method":"activation","payload":"eyJidWlsZCI6IjM0MjUiLCJjZXJ0SGFzaGVzIjpbImU3Njg1NjM0ZWZhY2Y2OWFjZTkzOWE2YjI1NWI3YjRmYWJlZjQyOTM1YjUwYTI2NWFjYjVjYjYwMjdlNDRlNzAiLCJlYjA0Y2Y1ZWIxZjM5YWZhNzYyZjJiYjEyMGYyOTZjYmE1MjBjMWI5N2RiMTU4OTU2NWI4MWNiOWExN2I3MjQ0IiwiYzM4NDZiZjI0YjllOTNjYTY0Mjc0YzBlYzY3YzFlY2M1ZTAyNGZmY2FjZDJkNzQwMTkzNTBlODFmZTU0NmFlNCIsImQ3YTdhMGZiNWQ3ZTI3MzFkNzcxZTk0ODRlYmNkZWY3MWQ1ZjBjM2UwYTI5NDg3ODJiYzgzZWUwZWE2OTllZjQiLCIxNDY1ZmEyMDUzOTdiODc2ZmFhNmYwYTk5NThlNTU5MGU0MGZjYzdmYWE0ZmI3YzJjODY3NzUyMWZiNWZiNjU4IiwiODNjZTNjMTIyOTY4OGE1OTNkNDg1ZjgxOTczYzBmOTE5NTQzMWVkYTM3Y2M1ZTM2NDMwZTc5YzdhODg4NjM4YiIsImE0YjZiMzk5NmZjMmYzMDZiM2ZkODY4MWJkNjM0MTNkOGM1MDA5Y2M0ZmEzMjljMmNjZjBlMmZhMWIxNDAzMDUiLCI5YWNmYWI3ZTQzYzhkODgwZDA2YjI2MmE5NGRlZWVlNGI0NjU5OTg5YzNkMGNhZjE5YmFmNjQwNWU0MWFiN2RmIiwiYTUzMTI1MTg4ZDIxMTBhYTk2NGIwMmM3YjdjNmRhMzIwMzE3MDg5NGU1ZmI3MWZmZmI2NjY3ZDVlNjgxMGEzNiIsIjE2YWY1N2E5ZjY3NmIwYWIxMjYwOTVhYTVlYmFkZWYyMmFiMzExMTlkNjQ0YWM5NWNkNGI5M2RiZjNmMjZhZWIiLCI5NjBhZGYwMDYzZTk2MzU2NzUwYzI5NjVkZDBhMDg2N2RhMGI5Y2JkNmU3NzcxNGFlYWZiMjM0OWFiMzkzZGEzIiwiNjhhZDUwOTA5YjA0MzYzYzYwNWVmMTM1ODFhOTM5ZmYyYzk2MzcyZTNmMTIzMjViMGE2ODYxZTFkNTlmNjYwMyIsIjZkYzQ3MTcyZTAxY2JjYjBiZjYyNTgwZDg5NWZlMmI4YWM5YWQ0Zjg3MzgwMWUwYzEwYjljODM3ZDIxZWIxNzciLCI3M2MxNzY0MzRmMWJjNmQ1YWRmNDViMGU3NmU3MjcyODdjOGRlNTc2MTZjMWU2ZTYxNDFhMmIyY2JjN2Q4ZTRjIiwiMjM5OTU2MTEyN2E1NzEyNWRlOGNlZmVhNjEwZGRmMmZhMDc4YjVjODA2N2Y0ZTgyODI5MGJmYjg2MGU4NGIzYyIsIjQ1MTQwYjMyNDdlYjljYzhjNWI0ZjBkN2I1MzA5MWY3MzI5MjA4OWU2ZTVhNjNlMjc0OWRkM2FjYTkxOThlZGEiLCI0M2RmNTc3NGIwM2U3ZmVmNWZlNDBkOTMxYTdiZWRmMWJiMmU2YjQyNzM4YzRlNmQzODQxMTAzZDNhYTdmMzM5IiwiMmNlMWNiMGJmOWQyZjllMTAyOTkzZmJlMjE1MTUyYzNiMmRkMGNhYmRlMWM2OGU1MzE5YjgzOTE1NGRiYjdmNSIsIjcwYTczZjdmMzc2YjYwMDc0MjQ4OTA0NTM0YjExNDgyZDViZjBlNjk4ZWNjNDk4ZGY1MjU3N2ViZjJlOTNiOWEiXSwiY2xpZW50IjoiUFBDIiwiY3VycmVudE1vZGUiOjAsImZxZG4iOiJ2cHJvZGVtby5jb20iLCJwYXNzd29yZCI6IktRR25IK041cUo4WUxxakVGSk1uR1NnY25GTE12MFRrIiwicHJvZmlsZSI6InByb2ZpbGUxIiwic2t1IjoiMTYzOTIiLCJ1c2VybmFtZSI6IiQkT3NBZG1pbiIsInV1aWQiOlsxNiwxNDksMTcyLDc1LDE2Niw0LDMzLDY3LDE4NiwyMjYsMjEyLDkzLDIyMyw3LDE4MiwxMzJdLCJ2ZXIiOiIxMS44LjUwIn0=","protocolVersion":"2.0.0","status":"ok"}'
    const clientId = uuid()
    clientManager.addClient({ ClientId: clientId, ClientSocket: null, action: ClientAction.ADMINCTLMODE })
    VersionChecker.setCurrentVersion('2.0.0')
    const clientMsg = validator.parseClientMsg(msg, clientId)

    try {
      await validator.validateActivationMsg(clientMsg, clientId)
    } catch {

    }
    const clientObj = clientManager.getClientObject(clientId)
    expect(clientObj.action).toEqual('acmactivate')
  })

  test('should throw an exception if the activition is null for a profile', async () => {
    let rpsError = null
    try {
      const clientId = uuid()
      clientManager.addClient({ ClientId: clientId, ClientSocket: null })
      activationmsg.payload.profile = 'profile4'
      await validator.validateActivationMsg(activationmsg, clientId)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual(`Device ${activationmsg.payload.uuid} activation failed. Failed to get activation mode for the profile :${activationmsg.payload.profile}`)
  })
})

describe('Activation message for admin control mode', () => {
  beforeEach(() => {
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
        profile: 'profile1'
      }
    }
  })

  test('should not throw an exception given all the information in the admin control activation message', async () => {
    const msg = '{"apiKey":"key","appVersion":"1.0.0","message":"all\'s good!","method":"activation","payload":"eyJidWlsZCI6IjM0MjUiLCJjZXJ0SGFzaGVzIjpbImU3Njg1NjM0ZWZhY2Y2OWFjZTkzOWE2YjI1NWI3YjRmYWJlZjQyOTM1YjUwYTI2NWFjYjVjYjYwMjdlNDRlNzAiLCJlYjA0Y2Y1ZWIxZjM5YWZhNzYyZjJiYjEyMGYyOTZjYmE1MjBjMWI5N2RiMTU4OTU2NWI4MWNiOWExN2I3MjQ0IiwiYzM4NDZiZjI0YjllOTNjYTY0Mjc0YzBlYzY3YzFlY2M1ZTAyNGZmY2FjZDJkNzQwMTkzNTBlODFmZTU0NmFlNCIsImQ3YTdhMGZiNWQ3ZTI3MzFkNzcxZTk0ODRlYmNkZWY3MWQ1ZjBjM2UwYTI5NDg3ODJiYzgzZWUwZWE2OTllZjQiLCIxNDY1ZmEyMDUzOTdiODc2ZmFhNmYwYTk5NThlNTU5MGU0MGZjYzdmYWE0ZmI3YzJjODY3NzUyMWZiNWZiNjU4IiwiODNjZTNjMTIyOTY4OGE1OTNkNDg1ZjgxOTczYzBmOTE5NTQzMWVkYTM3Y2M1ZTM2NDMwZTc5YzdhODg4NjM4YiIsImE0YjZiMzk5NmZjMmYzMDZiM2ZkODY4MWJkNjM0MTNkOGM1MDA5Y2M0ZmEzMjljMmNjZjBlMmZhMWIxNDAzMDUiLCI5YWNmYWI3ZTQzYzhkODgwZDA2YjI2MmE5NGRlZWVlNGI0NjU5OTg5YzNkMGNhZjE5YmFmNjQwNWU0MWFiN2RmIiwiYTUzMTI1MTg4ZDIxMTBhYTk2NGIwMmM3YjdjNmRhMzIwMzE3MDg5NGU1ZmI3MWZmZmI2NjY3ZDVlNjgxMGEzNiIsIjE2YWY1N2E5ZjY3NmIwYWIxMjYwOTVhYTVlYmFkZWYyMmFiMzExMTlkNjQ0YWM5NWNkNGI5M2RiZjNmMjZhZWIiLCI5NjBhZGYwMDYzZTk2MzU2NzUwYzI5NjVkZDBhMDg2N2RhMGI5Y2JkNmU3NzcxNGFlYWZiMjM0OWFiMzkzZGEzIiwiNjhhZDUwOTA5YjA0MzYzYzYwNWVmMTM1ODFhOTM5ZmYyYzk2MzcyZTNmMTIzMjViMGE2ODYxZTFkNTlmNjYwMyIsIjZkYzQ3MTcyZTAxY2JjYjBiZjYyNTgwZDg5NWZlMmI4YWM5YWQ0Zjg3MzgwMWUwYzEwYjljODM3ZDIxZWIxNzciLCI3M2MxNzY0MzRmMWJjNmQ1YWRmNDViMGU3NmU3MjcyODdjOGRlNTc2MTZjMWU2ZTYxNDFhMmIyY2JjN2Q4ZTRjIiwiMjM5OTU2MTEyN2E1NzEyNWRlOGNlZmVhNjEwZGRmMmZhMDc4YjVjODA2N2Y0ZTgyODI5MGJmYjg2MGU4NGIzYyIsIjQ1MTQwYjMyNDdlYjljYzhjNWI0ZjBkN2I1MzA5MWY3MzI5MjA4OWU2ZTVhNjNlMjc0OWRkM2FjYTkxOThlZGEiLCI0M2RmNTc3NGIwM2U3ZmVmNWZlNDBkOTMxYTdiZWRmMWJiMmU2YjQyNzM4YzRlNmQzODQxMTAzZDNhYTdmMzM5IiwiMmNlMWNiMGJmOWQyZjllMTAyOTkzZmJlMjE1MTUyYzNiMmRkMGNhYmRlMWM2OGU1MzE5YjgzOTE1NGRiYjdmNSIsIjcwYTczZjdmMzc2YjYwMDc0MjQ4OTA0NTM0YjExNDgyZDViZjBlNjk4ZWNjNDk4ZGY1MjU3N2ViZjJlOTNiOWEiXSwiY2xpZW50IjoiUFBDIiwiY3VycmVudE1vZGUiOjAsImZxZG4iOiJ2cHJvZGVtby5jb20iLCJwYXNzd29yZCI6IktRR25IK041cUo4WUxxakVGSk1uR1NnY25GTE12MFRrIiwicHJvZmlsZSI6InByb2ZpbGUxIiwic2t1IjoiMTYzOTIiLCJ1c2VybmFtZSI6IiQkT3NBZG1pbiIsInV1aWQiOlsxNiwxNDksMTcyLDc1LDE2Niw0LDMzLDY3LDE4NiwyMjYsMjEyLDkzLDIyMyw3LDE4MiwxMzJdLCJ2ZXIiOiIxMS44LjUwIn0=","protocolVersion":"2.0.0","status":"ok"}'
    const clientId = uuid()
    clientManager.addClient({ ClientId: clientId, ClientSocket: null })
    const clientMsg = validator.parseClientMsg(msg, clientId)

    try {
      await validator.validateActivationMsg(clientMsg, clientId)
    } catch {

    }
    const clientObj = clientManager.getClientObject(clientId)
    activationmsg.payload.digestRealm = undefined
    activationmsg.payload.fwNonce = undefined
    activationmsg.payload.modes = undefined
    activationmsg.payload.profile = {
      amtPassword: 'P@ssw0rd',
      activation: 'acmactivate',
      ciraConfigName: 'ciraconfig1',
      ciraConfigObject: {
        authMethod: 2,
        commonName: 'localhost',
        configName: 'ciraconfig1',
        mpsPort: 4433,
        mpsRootCertificate: 'rootcert',
        mpsServerAddress: 'localhost',
        password: 'P@ssw0rd',
        proxyDetails: '',
        serverAddressFormat: 201,
        username: 'admin'
      },
      configurationScript: null,
      generateRandomMEBxPassword: false,
      generateRandomPassword: false,
      mebxPassword: 'P@ssw0rd',
      profileName: 'profile1',
      mebxPasswordLength: 8,
      randomPasswordCharacters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890!@#$%^&*()',
      passwordLength: 8
    }
    expect(clientObj.ClientData).toEqual(activationmsg)
  })

  test('should throw an exception `Missing DNS Suffix` when payload does not contain DNS suffix and the activation is `acmactivate`', async () => {
    let rpsError = null
    try {
      const clientId = uuid()
      clientManager.addClient({ ClientId: clientId, ClientSocket: null })
      activationmsg.payload.fqdn = null
      await validator.validateActivationMsg(activationmsg, clientId)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual(
      `Device ${activationmsg.payload.uuid} activation failed. Missing DNS Suffix.`
    )
  })

  test('should throw an exception when DNS suffix does not exist in the list of available domain suffix and the activation is `acmactivate`', async () => {
    let rpsError = null
    try {
      const clientId = uuid()
      clientManager.addClient({ ClientId: clientId, ClientSocket: null })
      activationmsg.payload.fqdn = 'invalid.com'
      await validator.validateActivationMsg(activationmsg, clientId)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual(
      `Device ${activationmsg.payload.uuid} activation failed. Specified AMT domain suffix: ${activationmsg.payload.fqdn} does not match list of available AMT domain suffixes.`
    )
  })

  test('should throw an exception when certificate hashes are missing in payload and the activation is `acmactivate`', async () => {
    let rpsError = null
    try {
      const clientId = uuid()
      clientManager.addClient({ ClientId: clientId, ClientSocket: null })
      activationmsg.payload.certHashes = null
      await validator.validateActivationMsg(activationmsg, clientId)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual(
      `Device ${activationmsg.payload.uuid} activation failed. Missing certificate hashes from the device.`
    )
  })
})

describe('Digest Realm', () => {
  test('should return true when realm valid', async () => {
    const digestRealm = 'Digest:A4070000000000000000000000000000'
    const isDigestRealmValid: boolean = validator.isDigestRealmValid(digestRealm)
    expect(isDigestRealmValid).toBe(true)
  })

  test('should return false when realm is null or undefined', async () => {
    const isDigestRealmValid: boolean = validator.isDigestRealmValid(null)
    expect(isDigestRealmValid).toBe(false)
  })

  test('should return false when realm does not start with Digest', async () => {
    const digestRealm = 'Gist:4AF90000000000000000000000000000'
    const isDigestRealmValid: boolean = validator.isDigestRealmValid(digestRealm)
    expect(isDigestRealmValid).toBe(false)
  })

  test('should return false when realm length is not equal to 32', async () => {
    const digestRealm = 'Digest:4AF900000000000000000000000000000'
    const isDigestRealmValid: boolean = validator.isDigestRealmValid(digestRealm)
    expect(isDigestRealmValid).toBe(false)
  })

  test('should return false when realm is not a hexadecimal', async () => {
    const digestRealm = 'Digest:4AZ90000000000000000000000000000'
    const isDigestRealmValid: boolean = validator.isDigestRealmValid(digestRealm)
    expect(isDigestRealmValid).toBe(false)
  })
})

test('should throw an exception `Error while Validating the client message` if the message is null during the validation', async () => {
  let rpsError = null
  try {
    const clientId = uuid()
    clientManager.addClient({ ClientId: clientId, ClientSocket: null })
    await validator.validateDeactivationMsg(null, clientId)
  } catch (error) {
    rpsError = error
  }
  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toEqual(
    'Error while Validating the client message'
  )
})

test('should throw an exception `is in pre-provisioning mode` if current mode is 0', async () => {
  const deactivationmsg = {
    method: 'deactivation',
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
      profile: 'profile1'
    }
  }
  let rpsError = null

  try {
    const clientId = uuid()
    clientManager.addClient({ ClientId: clientId, ClientSocket: null })
    await validator.validateDeactivationMsg(deactivationmsg, clientId)
  } catch (error) {
    rpsError = error
  }
  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toContain(
    'is in pre-provisioning mode'
  )
})

test('should throw an exception `unknown mode', async () => {
  const deactivationmsg = {
    method: 'deactivation',
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
      currentMode: 3,
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
      profile: 'profile1'
    }
  }
  let rpsError = null

  try {
    const clientId = uuid()
    clientManager.addClient({ ClientId: clientId, ClientSocket: null })
    await validator.validateDeactivationMsg(deactivationmsg, clientId)
  } catch (error) {
    rpsError = error
  }
  expect(rpsError).toBeInstanceOf(RPSError)
  expect(rpsError.message).toContain(
    'deactivation failed. It is in unknown mode'
  )
})
