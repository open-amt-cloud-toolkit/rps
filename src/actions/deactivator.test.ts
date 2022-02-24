/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Brian Osburn
 **********************************************************************/
import { v4 as uuid } from 'uuid'
import { Deactivator } from './Deactivator'
import Logger from '../Logger'
import { config } from '../test/helper/Config'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { EnvReader } from '../utils/EnvReader'
import { HttpZResponseModel, parse } from 'http-z'
import { HttpHandler } from '../HttpHandler'
import { Configurator } from '../Configurator'
import { devices } from '../WebSocketListener'

EnvReader.GlobalEnvConfig = config

const responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
const configurator = new Configurator()
const deactivate = new Deactivator(new Logger('Deactivator'), responseMsg, configurator)
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
  const digestChallenge = {
    realm: 'Digest:56ABC7BE224EF620C69EB88F01071DC8',
    nonce: 'fVNueyEAAAAAAAAAcO8WqJ8s+WdyFUIY',
    stale: 'false',
    qop: 'auth'
  }
  devices[clientId] = {
    ClientId: clientId,
    ClientSocket: null,
    ClientData: deactivatemsg,
    status: {},
    connectionParams: {
      guid: '4c4c4544-004b-4210-8033-b6c04f504633',
      port: 16992,
      digestChallenge: digestChallenge,
      username: 'admin',
      password: 'P@ssw0rd'
    },
    uuid: deactivatemsg.payload.uuid,
    messageId: 1
  }
})

describe('deactivate', () => {
  test('should return wsman message if the message status is 401', async () => {
    const response = 'HTTP/1.1 401 Unauthorized\r\nWWW-Authenticate: Digest realm="Digest:8FF80F01A086065136E90CD6A08EBDB1", nonce="5bOx4i4TAAAAAAAAJ0IH1EXYw408gnUk",stale="false",qop="auth"\r\nContent-Type: text/html\r\nServer: Intel(R) Active Management Technology 15.0.23.1706\r\nContent-Length: 693\r\nConnection: close\r\n\r\n<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" >\n<html><head><link rel=stylesheet href=/styles.css>\n<meta http-equiv="Content-Type" content="text/html; charset=utf-8">\n<title>Intel&reg; Active Management Technology</title></head>\n<body>\n<table class=header>\n<tr><td valign=top nowrap>\n<p class=top1>Intel<font class=r><sup>&reg;</sup></font> Active Management Technology\n<td valign="middle"><img src="logo.gif" align="right" alt="Intel">\n</table>\n<br />\n<h2 class=warn>Log on failed. Incorrect user name or password, or user account temporarily locked.</h2>\n\n<p>\n<form METHOD="GET" action="index.htm"><h2><input type=submit value="Try again">\n</h2></form>\n<p>\n\n</body>\n</html>\n'
    const message = parse(response) as HttpZResponseModel
    const clientMsg = { payload: message }
    const httpHandler = new HttpHandler()
    const deactivateMsg = await deactivate.execute(clientMsg, clientId, httpHandler)
    expect(deactivateMsg.method).toEqual('wsman')
  })
  test('should pass if return value of unprovision is zero', async () => {
    const configuratorSpy = jest.spyOn(deactivate.configurator.amtDeviceRepository, 'delete').mockImplementation(async () => true)
    const response = 'HTTP/1.1 200 OK\r\nDate: Thu, 27 Jan 2022 11:18:36 GMT\r\nServer: Intel(R) Active Management Technology 15.0.23.1706\r\nX-Frame-Options: DENY\r\nContent-Type: application/soap+xml; charset=UTF-8\r\nTransfer-Encoding: chunked\r\n\r\n0456\r\n<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>1</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService/UnprovisionResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-00000000010B</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService</c:ResourceURI></a:Header><a:Body><g:Unprovision_OUTPUT><g:ReturnValue>0</g:ReturnValue></g:Unprovision_OUTPUT></a:Body></a:Envelope>\r\n0\r\n\r\n'
    const message = parse(response) as HttpZResponseModel
    const clientMsg = { payload: message }
    const httpHandler = new HttpHandler()
    const deactivateMsg = await deactivate.execute(clientMsg, clientId, httpHandler)
    expect(configuratorSpy).toHaveBeenCalled()
    expect(deactivateMsg.message).toEqual('{"Status":"Deactivated"}')
  })
  test('should fail if status code is other than 401 and 200', async () => {
    const response = 'HTTP/1.1 400 OK\r\nDate: Thu, 27 Jan 2022 11:18:36 GMT\r\nServer: Intel(R) Active Management Technology 15.0.23.1706\r\nX-Frame-Options: DENY\r\nContent-Type: application/soap+xml; charset=UTF-8\r\nTransfer-Encoding: chunked\r\n\r\n0456\r\n<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>1</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService/UnprovisionResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-00000000010B</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService</c:ResourceURI></a:Header><a:Body><g:Unprovision_OUTPUT><g:ReturnValue>1</g:ReturnValue></g:Unprovision_OUTPUT></a:Body></a:Envelope>\r\n0\r\n\r\n'
    const message = parse(response) as HttpZResponseModel
    const clientMsg = { payload: message }
    const httpHandler = new HttpHandler()
    const deactivateMsg = await deactivate.execute(clientMsg, clientId, httpHandler)
    expect(deactivateMsg.message).toEqual(`{"Status":"Device ${deactivatemsg.payload.uuid} deactivation failed"}`)
  })
  test('should throw an error when the payload is null', async () => {
    const clientMsg = { payload: null }
    const deactivateMsg = await deactivate.execute(clientMsg, clientId)
    expect(deactivateMsg.message).toEqual(`{"Status":"Device ${deactivatemsg.payload.uuid} deactivate failed : Missing/invalid WSMan response payload."}`)
  })
})
