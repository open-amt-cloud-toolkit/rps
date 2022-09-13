/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import { v4 as uuid } from 'uuid'

import Logger from './Logger'
import { config } from './test/helper/Config'
import { Validator } from './Validator'
import { Configurator } from './Configurator'
import { DataProcessor } from './DataProcessor'
import { ClientResponseMsg } from './utils/ClientResponseMsg'
import { EnvReader } from './utils/EnvReader'
import { VersionChecker } from './VersionChecker'
import { devices } from './WebSocketListener'
import { parse, HttpZResponseModel } from 'http-z'
import { HttpHandler } from './HttpHandler'
import { parseBody } from './utils/parseWSManResponseBody'
import { Deactivation } from './stateMachines/deactivation'
import { Activation } from './stateMachines/activation'
import { ClientMethods } from './models/RCS.Config'

EnvReader.GlobalEnvConfig = config
const configurator = new Configurator()
const responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
const validator = new Validator(new Logger('Validator'), configurator)
const dataProcessor = new DataProcessor(new Logger('DataProcessor'), validator, responseMsg)
const httpHandler = new HttpHandler()
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

describe('handle AMT reponse', () => {
  let clientData
  beforeEach(() => {
    clientData = {
      method: 'deactivate',
      apiKey: 'key',
      appVersion: '1.0.0',
      protocolVersion: '4.0.0',
      status: 'ok',
      message: 'ok',
      fqdn: '',
      payload: {
        uuid: '4c4c4544-004b-4210-8033-b6c04f504633',
        username: '$$OsAdmin',
        password: 'P@ssw0rd',
        currentMode: 2,
        hostname: 'DESKTOP-9CC12U7',
        certHashes: ['c3846bf24b9e93ca64274c0ec67c1ecc5e024ffcacd2d74019350e81fe546ae4']
      }
    }
  })
  it('should reject on 401 response', async () => {
    expect.assertions(1)
    const clientMsg = {
      method: 'response',
      apiKey: 'key',
      appVersion: '1.0.0',
      protocolVersion: '4.0.0',
      status: 'ok',
      message: 'ok',
      fqdn: '',
      payload: 'HTTP/1.1 401 Unauthorized\r\nWWW-Authenticate: Digest realm="Digest:727734D63A1FC0423736E48DA554E462", nonce="B9AX94iAAAAAAAAAx6rrSfPHGUrx/3uA",stale="false",qop="auth"\r\nContent-Type: text/html\r\nServer: Intel(R) Active Management Technology 15.0.23.1706\r\nContent-Length: 693\r\nConnection: close\r\n\r\n<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" >\n<html><head><link rel=stylesheet href=/styles.css>\n<meta http-equiv="Content-Type" content="text/html; charset=utf-8">\n<title>Intel&reg; Active Management Technology</title></head>\n<body>\n<table class=header>\n<tr><td valign=top nowrap>\n<p class=top1>Intel<font class=r><sup>&reg;</sup></font> Active Management Technology\n<td valign="middle"><img src="logo.gif" align="right" alt="Intel">\n</table>\n<br />\n<h2 class=warn>Log on failed. Incorrect user name or password, or user account temporarily locked.</h2>\n\n<p>\n<form METHOD="GET" action="index.htm"><h2><input type=submit value="Try again">\n</h2></form>\n<p>\n\n</body>\n</html>\n'
    }
    const clientId = uuid()
    devices[clientId] = { ClientId: clientId, ClientSocket: null, ClientData: clientData, messageId: 0, connectionParams: connectionParams, unauthCount: 0 }
    const promise = new Promise<any>((resolve, reject) => {
      devices[clientId].resolve = resolve
      devices[clientId].reject = reject
    })
    devices[clientId].pendingPromise = promise
    VersionChecker.setCurrentVersion('4.0.0')
    const message = parse(clientMsg.payload) as HttpZResponseModel
    await dataProcessor.handleResponse(clientMsg, clientId)
    await expect(promise).rejects.toEqual(message)
  })
  it('should resolve on 200', async () => {
    const clientMsg = {
      method: 'response',
      apiKey: 'key',
      appVersion: '1.0.0',
      protocolVersion: '4.0.0',
      status: 'ok',
      message: 'ok',
      fqdn: '',
      payload: 'HTTP/1.1 200 OK\r\nDate: Mon, 31 Jan 2022 10:23:04 GMT\r\nServer: Intel(R) Active Management Technology 15.0.23.1706\r\nX-Frame-Options: DENY\r\nContent-Type: application/soap+xml; charset=UTF-8\r\nTransfer-Encoding: chunked\r\n\r\n0456\r\n<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>1</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService/UnprovisionResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-000000000029</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService</c:ResourceURI></a:Header><a:Body><g:Unprovision_OUTPUT><g:ReturnValue>0</g:ReturnValue></g:Unprovision_OUTPUT></a:Body></a:Envelope>\r\n0\r\n\r\n'
    }
    const clientId = uuid()

    devices[clientId] = { ClientId: clientId, ClientSocket: null, ClientData: clientData, messageId: 0, unauthCount: 0 }
    const promise = new Promise<any>((resolve, reject) => {
      devices[clientId].resolve = resolve
      devices[clientId].reject = reject
    })
    devices[clientId].pendingPromise = promise
    VersionChecker.setCurrentVersion('4.0.0')
    const message = parse(clientMsg.payload) as HttpZResponseModel
    const expected = httpHandler.parseXML(parseBody(message))
    await dataProcessor.handleResponse(clientMsg, clientId)
    await expect(promise).resolves.toEqual(expected)
  })
  it('should reject and parse on 400', async () => {
    const clientMsg = {
      method: 'response',
      apiKey: 'key',
      appVersion: '1.0.0',
      protocolVersion: '4.0.0',
      status: 'ok',
      message: 'ok',
      fqdn: '',
      payload: 'HTTP/1.1 400 OK\r\nDate: Thu, 27 Jan 2022 11:18:36 GMT\r\nServer: Intel(R) Active Management Technology 15.0.23.1706\r\nX-Frame-Options: DENY\r\nContent-Type: application/soap+xml; charset=UTF-8\r\nTransfer-Encoding: chunked\r\n\r\n0456\r\n<?xml version="1.0" encoding="UTF-8"?><a:Envelope xmlns:a="http://www.w3.org/2003/05/soap-envelope" xmlns:b="http://schemas.xmlsoap.org/ws/2004/08/addressing" xmlns:c="http://schemas.dmtf.org/wbem/wsman/1/wsman.xsd" xmlns:d="http://schemas.xmlsoap.org/ws/2005/02/trust" xmlns:e="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd" xmlns:f="http://schemas.dmtf.org/wbem/wsman/1/cimbinding.xsd" xmlns:g="http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><a:Header><b:To>http://schemas.xmlsoap.org/ws/2004/08/addressing/role/anonymous</b:To><b:RelatesTo>1</b:RelatesTo><b:Action a:mustUnderstand="true">http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService/UnprovisionResponse</b:Action><b:MessageID>uuid:00000000-8086-8086-8086-00000000010B</b:MessageID><c:ResourceURI>http://intel.com/wbem/wscim/1/amt-schema/1/AMT_SetupAndConfigurationService</c:ResourceURI></a:Header><a:Body><g:Unprovision_OUTPUT><g:ReturnValue>1</g:ReturnValue></g:Unprovision_OUTPUT></a:Body></a:Envelope>\r\n0\r\n\r\n'
    }
    const clientId = uuid()

    devices[clientId] = { ClientId: clientId, ClientSocket: null, ClientData: clientData, messageId: 0, unauthCount: 0 }
    const promise = new Promise<any>((resolve, reject) => {
      devices[clientId].resolve = resolve
      devices[clientId].reject = reject
    })
    devices[clientId].pendingPromise = promise
    VersionChecker.setCurrentVersion('4.0.0')
    const message = parse(clientMsg.payload) as HttpZResponseModel
    const expected = httpHandler.parseXML(parseBody(message))
    await dataProcessor.handleResponse(clientMsg, clientId)
    await expect(promise).rejects.toEqual(expected)
  })
})

describe('deactivate a device', () => {
  let clientMsg
  let deactivation
  beforeEach(() => {
    clientMsg = {
      method: 'deactivate',
      apiKey: 'key',
      appVersion: '1.0.0',
      protocolVersion: '4.0.0',
      status: 'ok',
      message: 'ok',
      fqdn: '',
      payload: {
        uuid: '4c4c4544-004b-4210-8033-b6c04f504633',
        username: '$$OsAdmin',
        password: 'P@ssw0rd',
        currentMode: 2,
        hostname: 'DESKTOP-9CC12U7',
        certHashes: ['c3846bf24b9e93ca64274c0ec67c1ecc5e024ffcacd2d74019350e81fe546ae4']
      }
    }
    deactivation = new Deactivation()
  })
  it('should start deactivation service', async () => {
    const validatorSpy = jest.spyOn(dataProcessor.validator, 'validateDeactivationMsg').mockImplementation(async () => {})
    const setConnectionParamsSpy = jest.spyOn(dataProcessor, 'setConnectionParams').mockImplementation()
    const deactivationStartSpy = jest.spyOn(deactivation.service, 'start').mockImplementation()
    const deactivationSendSpy = jest.spyOn(deactivation.service, 'send').mockImplementation()
    const clientId = uuid()
    devices[clientId] = { ClientId: clientId, ClientSocket: null, messageId: 0, connectionParams: connectionParams, unauthCount: 0 }
    VersionChecker.setCurrentVersion('4.0.0')
    await dataProcessor.deactivateDevice(clientMsg, clientId, deactivation)
    expect(validatorSpy).toHaveBeenCalled()
    expect(setConnectionParamsSpy).toHaveBeenCalled()
    expect(deactivationStartSpy).toHaveBeenCalled()
    expect(deactivationSendSpy).toHaveBeenCalled()
  })
})

describe('Activate a device', () => {
  let clientMsg
  let activation
  beforeEach(() => {
    clientMsg = {
      method: 'activate',
      apiKey: 'key',
      appVersion: '1.0.0',
      protocolVersion: '4.0.0',
      status: 'ok',
      message: 'ok',
      fqdn: '',
      payload: {
        uuid: '4c4c4544-004b-4210-8033-b6c04f504633',
        username: '$$OsAdmin',
        password: 'P@ssw0rd',
        currentMode: 2,
        hostname: 'DESKTOP-9CC12U7',
        certHashes: ['c3846bf24b9e93ca64274c0ec67c1ecc5e024ffcacd2d74019350e81fe546ae4']
      }
    }
    activation = new Activation()
  })
  it('should start activation service', async () => {
    const validatorSpy = jest.spyOn(dataProcessor.validator, 'validateActivationMsg').mockImplementation(async () => {})
    const setConnectionParamsSpy = jest.spyOn(dataProcessor, 'setConnectionParams').mockImplementation()
    const activationStartSpy = jest.spyOn(activation.service, 'start').mockImplementation()
    const activationSendSpy = jest.spyOn(activation.service, 'send').mockImplementation()
    const clientId = uuid()
    devices[clientId] = { ClientId: clientId, ClientSocket: null, messageId: 0, connectionParams: connectionParams, unauthCount: 0, activationStatus: {} }
    devices[clientId].activationStatus.activated = false
    VersionChecker.setCurrentVersion('4.0.0')
    await dataProcessor.activateDevice(clientMsg, clientId, activation)
    expect(validatorSpy).toHaveBeenCalled()
    expect(setConnectionParamsSpy).toHaveBeenCalled()
    expect(activationStartSpy).toHaveBeenCalled()
    expect(activationSendSpy).toHaveBeenCalled()
  })
})

describe('Process data', () => {
  test('Should return an error with activation message and junk payload', async () => {
    const msg = '{"apiKey":"key","appVersion":"1.2.0","message":"all\'s good!","method":"activation","payload":"SFRUUC8xLjEgNDAxIFVuYXV0aG9yaXplZA0KV1dXLUF1dGhlbnRpY2F0ZTogRGlnZXN0IHJlYWxtPSJEaWdlc3Q6QTQwNzAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLCBub25jZT0id2xiRUsxRXRBQUFBQUFBQVdXNWFVSEZwK21RUTFqNjMiLHN0YWxlPSJmYWxzZSIscW9wPSJhdXRoIg0KQ29udGVudC1UeXBlOiB0ZXh0L2h0bWwNClNlcnZlcjogSW50ZWwoUikgQWN0aXZlIE1hbmFnZW1lbnQgVGVjaG5vbG9neSAxMS44LjUwLjM0MjUNCkNvbnRlbnQtTGVuZ3RoOiA2OTANCkNvbm5lY3Rpb246IGNsb3NlDQoNCjwhRE9DVFlQRSBIVE1MIFBVQkxJQyAiLS8vVzNDLy9EVEQgSFRNTCA0LjAxIFRyYW5zaXRpb25hbC8vRU4iID4KPGh0bWw+PGhlYWQ+PGxpbmsgcmVsPXN0eWxlc2hlZXQgaHJlZj0vc3R5bGVzLmNzcz4KPG1ldGEgaHR0cC1lcXVpdj0iQ29udGVudC1UeXBlIiBjb250ZW50PSJ0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLTgiPgo8dGl0bGU+SW50ZWwmcmVnOyBBY3RpdmUgTWFuYWdlbWVudCBUZWNobm9sb2d5PC90aXRsZT48L2hlYWQ+Cjxib2R5Pgo8dGFibGUgY2xhc3M9aGVhZGVyPgo8dHI+PHRkIHZhbGlnbj10b3Agbm93cmFwPgo8cCBjbGFzcz10b3AxPkludGVsPGZvbnQgY2xhc3M9cj48c3VwPiZyZWc7PC9zdXA+PC9mb250PiBBY3RpdmUgTWFuYWdlbWVudCBUZWNobm9sb2d5Cjx0ZCB2YWxpZ249InRvcCI+PGltZyBzcmM9ImxvZ28uZ2lmIiBhbGlnbj0icmlnaHQiIGFsdD0iSW50ZWwiPgo8L3RhYmxlPgo8YnIgLz4KPGgyIGNsYXNzPXdhcm4+TG9nIG9uIGZhaWxlZC4gSW5jb3JyZWN0IHVzZXIgbmFtZSBvciBwYXNzd29yZCwgb3IgdXNlciBhY2NvdW50IHRlbXBvcmFyaWx5IGxvY2tlZC48L2gyPgoKPHA+Cjxmb3JtIE1FVEhPRD0iR0VUIiBhY3Rpb249ImluZGV4Lmh0bSI","protocolVersion":"2.0.0","status":"ok"}'
    const clientId = uuid()
    devices[clientId] = { ClientId: clientId, ClientSocket: null, unauthCount: 0 }
    const clientMsg = await dataProcessor.processData(msg, clientId)
    expect(clientMsg.message).toContain('Error: Failed to parse client message payload.')
  })

  test('Should return an error with activation message and missing mandatory data in payload.', async () => {
    const clientMsg =
      '{"apiKey":"key","appVersion":"1.2.0","message":"all\'s good!","method":"activation","payload":"ewogICAgICAgICAgICAgICAgCiAgICAgICAgICAgICAgICAiYnVpbGQiOiAiMzQyNSIsCiAgICAgICAgICAgICAgICAiZnFkbiI6ICJ2cHJvZGVtby5jb20iLAogICAgICAgICAgICAgICAgInBhc3N3b3JkIjogIktRR25IK041cUo4WUxxakVGSk1uR1NnY25GTE12MFRrIiwKICAgICAgICAgICAgICAgICJjdXJyZW50TW9kZSI6IDAsCiAgICAgICAgICAgICAgICAiY2VydEhhc2hlcyI6IFsKICAgICAgICAgICAgICAgICAgICAgICAgImU3Njg1NjM0ZWZhY2Y2OWFjZTkzOWE2YjI1NWI3YjRmYWJlZjQyOTM1YjUwYTI2NWFjYjVjYjYwMjdlNDRlNzAiLAogICAgICAgICAgICAgICAgICAgICAgICAiZWIwNGNmNWViMWYzOWFmYTc2MmYyYmIxMjBmMjk2Y2JhNTIwYzFiOTdkYjE1ODk1NjViODFjYjlhMTdiNzI0NCIsCiAgICAgICAgICAgICAgICAgICAgICAgICJjMzg0NmJmMjRiOWU5M2NhNjQyNzRjMGVjNjdjMWVjYzVlMDI0ZmZjYWNkMmQ3NDAxOTM1MGU4MWZlNTQ2YWU0IiwKICAgICAgICAgICAgICAgICAgICAgICAgImQ3YTdhMGZiNWQ3ZTI3MzFkNzcxZTk0ODRlYmNkZWY3MWQ1ZjBjM2UwYTI5NDg3ODJiYzgzZWUwZWE2OTllZjQiLAogICAgICAgICAgICAgICAgICAgICAgICAiMTQ2NWZhMjA1Mzk3Yjg3NmZhYTZmMGE5OTU4ZTU1OTBlNDBmY2M3ZmFhNGZiN2MyYzg2Nzc1MjFmYjVmYjY1OCIsCiAgICAgICAgICAgICAgICAgICAgICAgICI4M2NlM2MxMjI5Njg4YTU5M2Q0ODVmODE5NzNjMGY5MTk1NDMxZWRhMzdjYzVlMzY0MzBlNzljN2E4ODg2MzhiIiwKICAgICAgICAgICAgICAgICAgICAgICAgImE0YjZiMzk5NmZjMmYzMDZiM2ZkODY4MWJkNjM0MTNkOGM1MDA5Y2M0ZmEzMjljMmNjZjBlMmZhMWIxNDAzMDUiLAogICAgICAgICAgICAgICAgICAgICAgICAiOWFjZmFiN2U0M2M4ZDg4MGQwNmIyNjJhOTRkZWVlZTRiNDY1OTk4OWMzZDBjYWYxOWJhZjY0MDVlNDFhYjdkZiIsCiAgICAgICAgICAgICAgICAgICAgICAgICJhNTMxMjUxODhkMjExMGFhOTY0YjAyYzdiN2M2ZGEzMjAzMTcwODk0ZTVmYjcxZmZmYjY2NjdkNWU2ODEwYTM2IiwKICAgICAgICAgICAgICAgICAgICAgICAgIjE2YWY1N2E5ZjY3NmIwYWIxMjYwOTVhYTVlYmFkZWYyMmFiMzExMTlkNjQ0YWM5NWNkNGI5M2RiZjNmMjZhZWIiLAogICAgICAgICAgICAgICAgICAgICAgICAiOTYwYWRmMDA2M2U5NjM1Njc1MGMyOTY1ZGQwYTA4NjdkYTBiOWNiZDZlNzc3MTRhZWFmYjIzNDlhYjM5M2RhMyIsCiAgICAgICAgICAgICAgICAgICAgICAgICI2OGFkNTA5MDliMDQzNjNjNjA1ZWYxMzU4MWE5MzlmZjJjOTYzNzJlM2YxMjMyNWIwYTY4NjFlMWQ1OWY2NjAzIiwKICAgICAgICAgICAgICAgICAgICAgICAgIjZkYzQ3MTcyZTAxY2JjYjBiZjYyNTgwZDg5NWZlMmI4YWM5YWQ0Zjg3MzgwMWUwYzEwYjljODM3ZDIxZWIxNzciLAogICAgICAgICAgICAgICAgICAgICAgICAiNzNjMTc2NDM0ZjFiYzZkNWFkZjQ1YjBlNzZlNzI3Mjg3YzhkZTU3NjE2YzFlNmU2MTQxYTJiMmNiYzdkOGU0YyIsCiAgICAgICAgICAgICAgICAgICAgICAgICIyMzk5NTYxMTI3YTU3MTI1ZGU4Y2VmZWE2MTBkZGYyZmEwNzhiNWM4MDY3ZjRlODI4MjkwYmZiODYwZTg0YjNjIiwKICAgICAgICAgICAgICAgICAgICAgICAgIjQ1MTQwYjMyNDdlYjljYzhjNWI0ZjBkN2I1MzA5MWY3MzI5MjA4OWU2ZTVhNjNlMjc0OWRkM2FjYTkxOThlZGEiLAogICAgICAgICAgICAgICAgICAgICAgICAiNDNkZjU3NzRiMDNlN2ZlZjVmZTQwZDkzMWE3YmVkZjFiYjJlNmI0MjczOGM0ZTZkMzg0MTEwM2QzYWE3ZjMzOSIsCiAgICAgICAgICAgICAgICAgICAgICAgICIyY2UxY2IwYmY5ZDJmOWUxMDI5OTNmYmUyMTUxNTJjM2IyZGQwY2FiZGUxYzY4ZTUzMTliODM5MTU0ZGJiN2Y1IiwKICAgICAgICAgICAgICAgICAgICAgICAgIjcwYTczZjdmMzc2YjYwMDc0MjQ4OTA0NTM0YjExNDgyZDViZjBlNjk4ZWNjNDk4ZGY1MjU3N2ViZjJlOTNiOWEiCiAgICAgICAgICAgICAgICBdLAogICAgICAgICAgICAgICAgInNrdSI6ICIxNjM5MiIsCiAgICAgICAgICAgICAgICAidXVpZCI6ICI0YmFjOTUxMC0wNGE2LTQzMjEtYmFlMi1kNDVkZGYwN2I2ODQiLAogICAgICAgICAgICAgICAgInVzZXJuYW1lIjogIiQkT3NBZG1pbiIsCiAgICAgICAgICAgICAgICAiY2xpZW50IjogIlBQQyIsCiAgICAgICAgICAgICAgICAicHJvZmlsZSI6ICJwcm9maWxlMSIKICAgICAgICB9","protocolVersion":"2.0.0","status":"ok"}'
    const clientId = uuid()
    devices[clientId] = { ClientId: clientId, ClientSocket: null, unauthCount: 0 }
    const responseMsg = await dataProcessor.processData(clientMsg, clientId)
    expect(responseMsg.message).toEqual('Error: Invalid payload from client')
  })

  it('should return an error when message method is invalid and has a activation payload', async () => {
    const clientMsg = '{"apiKey":"key","appVersion":"1.2.0","message":"all\'s good!","method":"unknown","payload":"eyJidWlsZCI6IjM0MjUiLCJjZXJ0SGFzaGVzIjpbImU3Njg1NjM0ZWZhY2Y2OWFjZTkzOWE2YjI1NWI3YjRmYWJlZjQyOTM1YjUwYTI2NWFjYjVjYjYwMjdlNDRlNzAiLCJlYjA0Y2Y1ZWIxZjM5YWZhNzYyZjJiYjEyMGYyOTZjYmE1MjBjMWI5N2RiMTU4OTU2NWI4MWNiOWExN2I3MjQ0IiwiYzM4NDZiZjI0YjllOTNjYTY0Mjc0YzBlYzY3YzFlY2M1ZTAyNGZmY2FjZDJkNzQwMTkzNTBlODFmZTU0NmFlNCIsImQ3YTdhMGZiNWQ3ZTI3MzFkNzcxZTk0ODRlYmNkZWY3MWQ1ZjBjM2UwYTI5NDg3ODJiYzgzZWUwZWE2OTllZjQiLCIxNDY1ZmEyMDUzOTdiODc2ZmFhNmYwYTk5NThlNTU5MGU0MGZjYzdmYWE0ZmI3YzJjODY3NzUyMWZiNWZiNjU4IiwiODNjZTNjMTIyOTY4OGE1OTNkNDg1ZjgxOTczYzBmOTE5NTQzMWVkYTM3Y2M1ZTM2NDMwZTc5YzdhODg4NjM4YiIsImE0YjZiMzk5NmZjMmYzMDZiM2ZkODY4MWJkNjM0MTNkOGM1MDA5Y2M0ZmEzMjljMmNjZjBlMmZhMWIxNDAzMDUiLCI5YWNmYWI3ZTQzYzhkODgwZDA2YjI2MmE5NGRlZWVlNGI0NjU5OTg5YzNkMGNhZjE5YmFmNjQwNWU0MWFiN2RmIiwiYTUzMTI1MTg4ZDIxMTBhYTk2NGIwMmM3YjdjNmRhMzIwMzE3MDg5NGU1ZmI3MWZmZmI2NjY3ZDVlNjgxMGEzNiIsIjE2YWY1N2E5ZjY3NmIwYWIxMjYwOTVhYTVlYmFkZWYyMmFiMzExMTlkNjQ0YWM5NWNkNGI5M2RiZjNmMjZhZWIiLCI5NjBhZGYwMDYzZTk2MzU2NzUwYzI5NjVkZDBhMDg2N2RhMGI5Y2JkNmU3NzcxNGFlYWZiMjM0OWFiMzkzZGEzIiwiNjhhZDUwOTA5YjA0MzYzYzYwNWVmMTM1ODFhOTM5ZmYyYzk2MzcyZTNmMTIzMjViMGE2ODYxZTFkNTlmNjYwMyIsIjZkYzQ3MTcyZTAxY2JjYjBiZjYyNTgwZDg5NWZlMmI4YWM5YWQ0Zjg3MzgwMWUwYzEwYjljODM3ZDIxZWIxNzciLCI3M2MxNzY0MzRmMWJjNmQ1YWRmNDViMGU3NmU3MjcyODdjOGRlNTc2MTZjMWU2ZTYxNDFhMmIyY2JjN2Q4ZTRjIiwiMjM5OTU2MTEyN2E1NzEyNWRlOGNlZmVhNjEwZGRmMmZhMDc4YjVjODA2N2Y0ZTgyODI5MGJmYjg2MGU4NGIzYyIsIjQ1MTQwYjMyNDdlYjljYzhjNWI0ZjBkN2I1MzA5MWY3MzI5MjA4OWU2ZTVhNjNlMjc0OWRkM2FjYTkxOThlZGEiLCI0M2RmNTc3NGIwM2U3ZmVmNWZlNDBkOTMxYTdiZWRmMWJiMmU2YjQyNzM4YzRlNmQzODQxMTAzZDNhYTdmMzM5IiwiMmNlMWNiMGJmOWQyZjllMTAyOTkzZmJlMjE1MTUyYzNiMmRkMGNhYmRlMWM2OGU1MzE5YjgzOTE1NGRiYjdmNSIsIjcwYTczZjdmMzc2YjYwMDc0MjQ4OTA0NTM0YjExNDgyZDViZjBlNjk4ZWNjNDk4ZGY1MjU3N2ViZjJlOTNiOWEiXSwiY2xpZW50IjoiUFBDIiwiY3VycmVudE1vZGUiOjAsImZxZG4iOiJ2cHJvZGVtby5jb20iLCJwYXNzd29yZCI6IktRR25IK041cUo4WUxxakVGSk1uR1NnY25GTE12MFRrIiwicHJvZmlsZSI6InByb2ZpbGUxIiwic2t1IjoiMTYzOTIiLCJ1c2VybmFtZSI6IiQkT3NBZG1pbiIsInV1aWQiOlsxNiwxNDksMTcyLDc1LDE2Niw0LDMzLDY3LDE4NiwyMjYsMjEyLDkzLDIyMyw3LDE4MiwxMzJdLCJ2ZXIiOiIxMS44LjUwIn0=","protocolVersion":"2.0.0","status":"ok"}'
    const clientId = uuid()
    devices[clientId] = { ClientId: clientId, ClientSocket: null, unauthCount: 0 }
    VersionChecker.setCurrentVersion('2.0.0')
    const responseMsg = await dataProcessor.processData(clientMsg, clientId)
    expect(responseMsg.message).toContain('Not a supported method received from AMT device')
  })

  it('process data to activate Device', async () => {
    const clientMsg = '{"apiKey":"key","appVersion":"1.2.0","message":"all\'s good!","method":"unknown","payload":"eyJidWlsZCI6IjM0MjUiLCJjZXJ0SGFzaGVzIjpbImU3Njg1NjM0ZWZhY2Y2OWFjZTkzOWE2YjI1NWI3YjRmYWJlZjQyOTM1YjUwYTI2NWFjYjVjYjYwMjdlNDRlNzAiLCJlYjA0Y2Y1ZWIxZjM5YWZhNzYyZjJiYjEyMGYyOTZjYmE1MjBjMWI5N2RiMTU4OTU2NWI4MWNiOWExN2I3MjQ0IiwiYzM4NDZiZjI0YjllOTNjYTY0Mjc0YzBlYzY3YzFlY2M1ZTAyNGZmY2FjZDJkNzQwMTkzNTBlODFmZTU0NmFlNCIsImQ3YTdhMGZiNWQ3ZTI3MzFkNzcxZTk0ODRlYmNkZWY3MWQ1ZjBjM2UwYTI5NDg3ODJiYzgzZWUwZWE2OTllZjQiLCIxNDY1ZmEyMDUzOTdiODc2ZmFhNmYwYTk5NThlNTU5MGU0MGZjYzdmYWE0ZmI3YzJjODY3NzUyMWZiNWZiNjU4IiwiODNjZTNjMTIyOTY4OGE1OTNkNDg1ZjgxOTczYzBmOTE5NTQzMWVkYTM3Y2M1ZTM2NDMwZTc5YzdhODg4NjM4YiIsImE0YjZiMzk5NmZjMmYzMDZiM2ZkODY4MWJkNjM0MTNkOGM1MDA5Y2M0ZmEzMjljMmNjZjBlMmZhMWIxNDAzMDUiLCI5YWNmYWI3ZTQzYzhkODgwZDA2YjI2MmE5NGRlZWVlNGI0NjU5OTg5YzNkMGNhZjE5YmFmNjQwNWU0MWFiN2RmIiwiYTUzMTI1MTg4ZDIxMTBhYTk2NGIwMmM3YjdjNmRhMzIwMzE3MDg5NGU1ZmI3MWZmZmI2NjY3ZDVlNjgxMGEzNiIsIjE2YWY1N2E5ZjY3NmIwYWIxMjYwOTVhYTVlYmFkZWYyMmFiMzExMTlkNjQ0YWM5NWNkNGI5M2RiZjNmMjZhZWIiLCI5NjBhZGYwMDYzZTk2MzU2NzUwYzI5NjVkZDBhMDg2N2RhMGI5Y2JkNmU3NzcxNGFlYWZiMjM0OWFiMzkzZGEzIiwiNjhhZDUwOTA5YjA0MzYzYzYwNWVmMTM1ODFhOTM5ZmYyYzk2MzcyZTNmMTIzMjViMGE2ODYxZTFkNTlmNjYwMyIsIjZkYzQ3MTcyZTAxY2JjYjBiZjYyNTgwZDg5NWZlMmI4YWM5YWQ0Zjg3MzgwMWUwYzEwYjljODM3ZDIxZWIxNzciLCI3M2MxNzY0MzRmMWJjNmQ1YWRmNDViMGU3NmU3MjcyODdjOGRlNTc2MTZjMWU2ZTYxNDFhMmIyY2JjN2Q4ZTRjIiwiMjM5OTU2MTEyN2E1NzEyNWRlOGNlZmVhNjEwZGRmMmZhMDc4YjVjODA2N2Y0ZTgyODI5MGJmYjg2MGU4NGIzYyIsIjQ1MTQwYjMyNDdlYjljYzhjNWI0ZjBkN2I1MzA5MWY3MzI5MjA4OWU2ZTVhNjNlMjc0OWRkM2FjYTkxOThlZGEiLCI0M2RmNTc3NGIwM2U3ZmVmNWZlNDBkOTMxYTdiZWRmMWJiMmU2YjQyNzM4YzRlNmQzODQxMTAzZDNhYTdmMzM5IiwiMmNlMWNiMGJmOWQyZjllMTAyOTkzZmJlMjE1MTUyYzNiMmRkMGNhYmRlMWM2OGU1MzE5YjgzOTE1NGRiYjdmNSIsIjcwYTczZjdmMzc2YjYwMDc0MjQ4OTA0NTM0YjExNDgyZDViZjBlNjk4ZWNjNDk4ZGY1MjU3N2ViZjJlOTNiOWEiXSwiY2xpZW50IjoiUFBDIiwiY3VycmVudE1vZGUiOjAsImZxZG4iOiJ2cHJvZGVtby5jb20iLCJwYXNzd29yZCI6IktRR25IK041cUo4WUxxakVGSk1uR1NnY25GTE12MFRrIiwicHJvZmlsZSI6InByb2ZpbGUxIiwic2t1IjoiMTYzOTIiLCJ1c2VybmFtZSI6IiQkT3NBZG1pbiIsInV1aWQiOlsxNiwxNDksMTcyLDc1LDE2Niw0LDMzLDY3LDE4NiwyMjYsMjEyLDkzLDIyMyw3LDE4MiwxMzJdLCJ2ZXIiOiIxMS44LjUwIn0=","protocolVersion":"2.0.0","status":"ok"}'
    const clientId = uuid()
    devices[clientId] = { ClientId: clientId, ClientSocket: null, unauthCount: 0 }
    VersionChecker.setCurrentVersion('2.0.0')
    const ret = {
      method: ClientMethods.ACTIVATION
    }
    const clientMethodsACTIVATION = jest.spyOn(dataProcessor.validator, 'parseClientMsg').mockReturnValue(ret)
    await dataProcessor.processData(clientMsg, clientId)
    expect(clientMethodsACTIVATION).toHaveBeenCalledTimes(1)
  })

  it('process data to deactivate Device', async () => {
    const clientMsg = '{"apiKey":"key","appVersion":"1.2.0","message":"all\'s good!","method":"unknown","payload":"eyJidWlsZCI6IjM0MjUiLCJjZXJ0SGFzaGVzIjpbImU3Njg1NjM0ZWZhY2Y2OWFjZTkzOWE2YjI1NWI3YjRmYWJlZjQyOTM1YjUwYTI2NWFjYjVjYjYwMjdlNDRlNzAiLCJlYjA0Y2Y1ZWIxZjM5YWZhNzYyZjJiYjEyMGYyOTZjYmE1MjBjMWI5N2RiMTU4OTU2NWI4MWNiOWExN2I3MjQ0IiwiYzM4NDZiZjI0YjllOTNjYTY0Mjc0YzBlYzY3YzFlY2M1ZTAyNGZmY2FjZDJkNzQwMTkzNTBlODFmZTU0NmFlNCIsImQ3YTdhMGZiNWQ3ZTI3MzFkNzcxZTk0ODRlYmNkZWY3MWQ1ZjBjM2UwYTI5NDg3ODJiYzgzZWUwZWE2OTllZjQiLCIxNDY1ZmEyMDUzOTdiODc2ZmFhNmYwYTk5NThlNTU5MGU0MGZjYzdmYWE0ZmI3YzJjODY3NzUyMWZiNWZiNjU4IiwiODNjZTNjMTIyOTY4OGE1OTNkNDg1ZjgxOTczYzBmOTE5NTQzMWVkYTM3Y2M1ZTM2NDMwZTc5YzdhODg4NjM4YiIsImE0YjZiMzk5NmZjMmYzMDZiM2ZkODY4MWJkNjM0MTNkOGM1MDA5Y2M0ZmEzMjljMmNjZjBlMmZhMWIxNDAzMDUiLCI5YWNmYWI3ZTQzYzhkODgwZDA2YjI2MmE5NGRlZWVlNGI0NjU5OTg5YzNkMGNhZjE5YmFmNjQwNWU0MWFiN2RmIiwiYTUzMTI1MTg4ZDIxMTBhYTk2NGIwMmM3YjdjNmRhMzIwMzE3MDg5NGU1ZmI3MWZmZmI2NjY3ZDVlNjgxMGEzNiIsIjE2YWY1N2E5ZjY3NmIwYWIxMjYwOTVhYTVlYmFkZWYyMmFiMzExMTlkNjQ0YWM5NWNkNGI5M2RiZjNmMjZhZWIiLCI5NjBhZGYwMDYzZTk2MzU2NzUwYzI5NjVkZDBhMDg2N2RhMGI5Y2JkNmU3NzcxNGFlYWZiMjM0OWFiMzkzZGEzIiwiNjhhZDUwOTA5YjA0MzYzYzYwNWVmMTM1ODFhOTM5ZmYyYzk2MzcyZTNmMTIzMjViMGE2ODYxZTFkNTlmNjYwMyIsIjZkYzQ3MTcyZTAxY2JjYjBiZjYyNTgwZDg5NWZlMmI4YWM5YWQ0Zjg3MzgwMWUwYzEwYjljODM3ZDIxZWIxNzciLCI3M2MxNzY0MzRmMWJjNmQ1YWRmNDViMGU3NmU3MjcyODdjOGRlNTc2MTZjMWU2ZTYxNDFhMmIyY2JjN2Q4ZTRjIiwiMjM5OTU2MTEyN2E1NzEyNWRlOGNlZmVhNjEwZGRmMmZhMDc4YjVjODA2N2Y0ZTgyODI5MGJmYjg2MGU4NGIzYyIsIjQ1MTQwYjMyNDdlYjljYzhjNWI0ZjBkN2I1MzA5MWY3MzI5MjA4OWU2ZTVhNjNlMjc0OWRkM2FjYTkxOThlZGEiLCI0M2RmNTc3NGIwM2U3ZmVmNWZlNDBkOTMxYTdiZWRmMWJiMmU2YjQyNzM4YzRlNmQzODQxMTAzZDNhYTdmMzM5IiwiMmNlMWNiMGJmOWQyZjllMTAyOTkzZmJlMjE1MTUyYzNiMmRkMGNhYmRlMWM2OGU1MzE5YjgzOTE1NGRiYjdmNSIsIjcwYTczZjdmMzc2YjYwMDc0MjQ4OTA0NTM0YjExNDgyZDViZjBlNjk4ZWNjNDk4ZGY1MjU3N2ViZjJlOTNiOWEiXSwiY2xpZW50IjoiUFBDIiwiY3VycmVudE1vZGUiOjAsImZxZG4iOiJ2cHJvZGVtby5jb20iLCJwYXNzd29yZCI6IktRR25IK041cUo4WUxxakVGSk1uR1NnY25GTE12MFRrIiwicHJvZmlsZSI6InByb2ZpbGUxIiwic2t1IjoiMTYzOTIiLCJ1c2VybmFtZSI6IiQkT3NBZG1pbiIsInV1aWQiOlsxNiwxNDksMTcyLDc1LDE2Niw0LDMzLDY3LDE4NiwyMjYsMjEyLDkzLDIyMyw3LDE4MiwxMzJdLCJ2ZXIiOiIxMS44LjUwIn0=","protocolVersion":"2.0.0","status":"ok"}'
    const clientId = uuid()
    devices[clientId] = { ClientId: clientId, ClientSocket: null, unauthCount: 0 }
    VersionChecker.setCurrentVersion('2.0.0')
    const ret = {
      method: ClientMethods.DEACTIVATION
    }
    const clientMethodsdeactivateDevice = jest.spyOn(dataProcessor.validator, 'parseClientMsg').mockReturnValue(ret)
    await dataProcessor.processData(clientMsg, clientId)
    expect(clientMethodsdeactivateDevice).toHaveBeenCalledTimes(2)
  })

  it('process data to handle Response', async () => {
    const clientMsg = '{"apiKey":"key","appVersion":"1.2.0","message":"all\'s good!","method":"unknown","payload":"eyJidWlsZCI6IjM0MjUiLCJjZXJ0SGFzaGVzIjpbImU3Njg1NjM0ZWZhY2Y2OWFjZTkzOWE2YjI1NWI3YjRmYWJlZjQyOTM1YjUwYTI2NWFjYjVjYjYwMjdlNDRlNzAiLCJlYjA0Y2Y1ZWIxZjM5YWZhNzYyZjJiYjEyMGYyOTZjYmE1MjBjMWI5N2RiMTU4OTU2NWI4MWNiOWExN2I3MjQ0IiwiYzM4NDZiZjI0YjllOTNjYTY0Mjc0YzBlYzY3YzFlY2M1ZTAyNGZmY2FjZDJkNzQwMTkzNTBlODFmZTU0NmFlNCIsImQ3YTdhMGZiNWQ3ZTI3MzFkNzcxZTk0ODRlYmNkZWY3MWQ1ZjBjM2UwYTI5NDg3ODJiYzgzZWUwZWE2OTllZjQiLCIxNDY1ZmEyMDUzOTdiODc2ZmFhNmYwYTk5NThlNTU5MGU0MGZjYzdmYWE0ZmI3YzJjODY3NzUyMWZiNWZiNjU4IiwiODNjZTNjMTIyOTY4OGE1OTNkNDg1ZjgxOTczYzBmOTE5NTQzMWVkYTM3Y2M1ZTM2NDMwZTc5YzdhODg4NjM4YiIsImE0YjZiMzk5NmZjMmYzMDZiM2ZkODY4MWJkNjM0MTNkOGM1MDA5Y2M0ZmEzMjljMmNjZjBlMmZhMWIxNDAzMDUiLCI5YWNmYWI3ZTQzYzhkODgwZDA2YjI2MmE5NGRlZWVlNGI0NjU5OTg5YzNkMGNhZjE5YmFmNjQwNWU0MWFiN2RmIiwiYTUzMTI1MTg4ZDIxMTBhYTk2NGIwMmM3YjdjNmRhMzIwMzE3MDg5NGU1ZmI3MWZmZmI2NjY3ZDVlNjgxMGEzNiIsIjE2YWY1N2E5ZjY3NmIwYWIxMjYwOTVhYTVlYmFkZWYyMmFiMzExMTlkNjQ0YWM5NWNkNGI5M2RiZjNmMjZhZWIiLCI5NjBhZGYwMDYzZTk2MzU2NzUwYzI5NjVkZDBhMDg2N2RhMGI5Y2JkNmU3NzcxNGFlYWZiMjM0OWFiMzkzZGEzIiwiNjhhZDUwOTA5YjA0MzYzYzYwNWVmMTM1ODFhOTM5ZmYyYzk2MzcyZTNmMTIzMjViMGE2ODYxZTFkNTlmNjYwMyIsIjZkYzQ3MTcyZTAxY2JjYjBiZjYyNTgwZDg5NWZlMmI4YWM5YWQ0Zjg3MzgwMWUwYzEwYjljODM3ZDIxZWIxNzciLCI3M2MxNzY0MzRmMWJjNmQ1YWRmNDViMGU3NmU3MjcyODdjOGRlNTc2MTZjMWU2ZTYxNDFhMmIyY2JjN2Q4ZTRjIiwiMjM5OTU2MTEyN2E1NzEyNWRlOGNlZmVhNjEwZGRmMmZhMDc4YjVjODA2N2Y0ZTgyODI5MGJmYjg2MGU4NGIzYyIsIjQ1MTQwYjMyNDdlYjljYzhjNWI0ZjBkN2I1MzA5MWY3MzI5MjA4OWU2ZTVhNjNlMjc0OWRkM2FjYTkxOThlZGEiLCI0M2RmNTc3NGIwM2U3ZmVmNWZlNDBkOTMxYTdiZWRmMWJiMmU2YjQyNzM4YzRlNmQzODQxMTAzZDNhYTdmMzM5IiwiMmNlMWNiMGJmOWQyZjllMTAyOTkzZmJlMjE1MTUyYzNiMmRkMGNhYmRlMWM2OGU1MzE5YjgzOTE1NGRiYjdmNSIsIjcwYTczZjdmMzc2YjYwMDc0MjQ4OTA0NTM0YjExNDgyZDViZjBlNjk4ZWNjNDk4ZGY1MjU3N2ViZjJlOTNiOWEiXSwiY2xpZW50IjoiUFBDIiwiY3VycmVudE1vZGUiOjAsImZxZG4iOiJ2cHJvZGVtby5jb20iLCJwYXNzd29yZCI6IktRR25IK041cUo4WUxxakVGSk1uR1NnY25GTE12MFRrIiwicHJvZmlsZSI6InByb2ZpbGUxIiwic2t1IjoiMTYzOTIiLCJ1c2VybmFtZSI6IiQkT3NBZG1pbiIsInV1aWQiOlsxNiwxNDksMTcyLDc1LDE2Niw0LDMzLDY3LDE4NiwyMjYsMjEyLDkzLDIyMyw3LDE4MiwxMzJdLCJ2ZXIiOiIxMS44LjUwIn0=","protocolVersion":"2.0.0","status":"ok"}'
    const clientId = uuid()
    devices[clientId] = { ClientId: clientId, ClientSocket: null, unauthCount: 0 }
    VersionChecker.setCurrentVersion('2.0.0')
    const ret = {
      method: ClientMethods.RESPONSE
    }
    const clientMethodshandleResponse = jest.spyOn(dataProcessor.validator, 'parseClientMsg').mockReturnValue(ret)
    await dataProcessor.processData(clientMsg, clientId)
    expect(clientMethodshandleResponse).toHaveBeenCalledTimes(3)
  })
})
