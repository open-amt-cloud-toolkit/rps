/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Author: Madhavi Losetty
 **********************************************************************/
import { v4 as uuid } from 'uuid'

import Logger from './Logger'
import { config } from './test/helper/Config'
import { Validator } from './Validator'
import { NodeForge } from './NodeForge'
import { CertManager } from './CertManager'
import { Configurator } from './Configurator'
import { DataProcessor } from './DataProcessor'
import { SignatureHelper } from './utils/SignatureHelper'
import { ClientResponseMsg } from './utils/ClientResponseMsg'
import { EnvReader } from './utils/EnvReader'
import { VersionChecker } from './VersionChecker'
import { devices } from './WebSocketListener'
import { parse, HttpZResponseModel } from 'http-z'

// EnvReader.InitFromEnv(config);
EnvReader.GlobalEnvConfig = config
const nodeForge = new NodeForge()
const helper = new SignatureHelper(nodeForge)
const certManager = new CertManager(new Logger('CertManager'), nodeForge)
const configurator = new Configurator()
const responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'))
const validator = new Validator(new Logger('Validator'), configurator)
const dataProcessor = new DataProcessor(new Logger('DataProcessor'), helper, configurator, validator, certManager, responseMsg)
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

// describe('handle AMT reponse', () => {
//   it('should reject on 401 response', async () => {
//   })
// })

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
    await expect(devices[clientId].pendingPromise).rejects.toEqual(message)
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
    await dataProcessor.handleResponse(clientMsg, clientId)
    await expect(devices[clientId].pendingPromise).resolves.toEqual(message)
  })
})

describe('deactivate a device', () => {
  let clientMsg
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
  })
  it('should start deactivation service', async () => {
    const validatorSpy = jest.spyOn(dataProcessor.validator, 'validateDeactivationMsg').mockImplementation(async () => {})
    const setConnectionParamsSpy = jest.spyOn(dataProcessor, 'setConnectionParams').mockImplementation()
    const clientId = uuid()
    devices[clientId] = { ClientId: clientId, ClientSocket: null, messageId: 0, connectionParams: connectionParams, unauthCount: 0 }
    VersionChecker.setCurrentVersion('4.0.0')
    await dataProcessor.deactivateDevice(clientMsg, clientId)
    expect(validatorSpy).toHaveBeenCalled()
    expect(setConnectionParamsSpy).toHaveBeenCalled()
  })
})
