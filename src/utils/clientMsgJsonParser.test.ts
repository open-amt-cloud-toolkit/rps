/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { randomUUID } from 'node:crypto'
import { type ClientMsg } from '../models/RCS.Config.js'
import { devices } from '../devices.js'
import { ClientMsgJsonParser } from './ClientMsgJsonParser.js'
import { RPSError } from './RPSError.js'

const jsonParser = new ClientMsgJsonParser()

describe('Parse the message received from client', () => {
  test('When method is activation, it should decode payload and return the message ', () => {
    const msg = '{"apiKey":"key","appVersion":"1.2.0","message":"all\'s good!","method":"activation","payload":"eyJidWlsZCI6IjM0MjUiLCJjZXJ0SGFzaGVzIjpbImU3Njg1NjM0ZWZhY2Y2OWFjZTkzOWE2YjI1NWI3YjRmYWJlZjQyOTM1YjUwYTI2NWFjYjVjYjYwMjdlNDRlNzAiLCJlYjA0Y2Y1ZWIxZjM5YWZhNzYyZjJiYjEyMGYyOTZjYmE1MjBjMWI5N2RiMTU4OTU2NWI4MWNiOWExN2I3MjQ0IiwiYzM4NDZiZjI0YjllOTNjYTY0Mjc0YzBlYzY3YzFlY2M1ZTAyNGZmY2FjZDJkNzQwMTkzNTBlODFmZTU0NmFlNCIsImQ3YTdhMGZiNWQ3ZTI3MzFkNzcxZTk0ODRlYmNkZWY3MWQ1ZjBjM2UwYTI5NDg3ODJiYzgzZWUwZWE2OTllZjQiLCIxNDY1ZmEyMDUzOTdiODc2ZmFhNmYwYTk5NThlNTU5MGU0MGZjYzdmYWE0ZmI3YzJjODY3NzUyMWZiNWZiNjU4IiwiODNjZTNjMTIyOTY4OGE1OTNkNDg1ZjgxOTczYzBmOTE5NTQzMWVkYTM3Y2M1ZTM2NDMwZTc5YzdhODg4NjM4YiIsImE0YjZiMzk5NmZjMmYzMDZiM2ZkODY4MWJkNjM0MTNkOGM1MDA5Y2M0ZmEzMjljMmNjZjBlMmZhMWIxNDAzMDUiLCI5YWNmYWI3ZTQzYzhkODgwZDA2YjI2MmE5NGRlZWVlNGI0NjU5OTg5YzNkMGNhZjE5YmFmNjQwNWU0MWFiN2RmIiwiYTUzMTI1MTg4ZDIxMTBhYTk2NGIwMmM3YjdjNmRhMzIwMzE3MDg5NGU1ZmI3MWZmZmI2NjY3ZDVlNjgxMGEzNiIsIjE2YWY1N2E5ZjY3NmIwYWIxMjYwOTVhYTVlYmFkZWYyMmFiMzExMTlkNjQ0YWM5NWNkNGI5M2RiZjNmMjZhZWIiLCI5NjBhZGYwMDYzZTk2MzU2NzUwYzI5NjVkZDBhMDg2N2RhMGI5Y2JkNmU3NzcxNGFlYWZiMjM0OWFiMzkzZGEzIiwiNjhhZDUwOTA5YjA0MzYzYzYwNWVmMTM1ODFhOTM5ZmYyYzk2MzcyZTNmMTIzMjViMGE2ODYxZTFkNTlmNjYwMyIsIjZkYzQ3MTcyZTAxY2JjYjBiZjYyNTgwZDg5NWZlMmI4YWM5YWQ0Zjg3MzgwMWUwYzEwYjljODM3ZDIxZWIxNzciLCI3M2MxNzY0MzRmMWJjNmQ1YWRmNDViMGU3NmU3MjcyODdjOGRlNTc2MTZjMWU2ZTYxNDFhMmIyY2JjN2Q4ZTRjIiwiMjM5OTU2MTEyN2E1NzEyNWRlOGNlZmVhNjEwZGRmMmZhMDc4YjVjODA2N2Y0ZTgyODI5MGJmYjg2MGU4NGIzYyIsIjQ1MTQwYjMyNDdlYjljYzhjNWI0ZjBkN2I1MzA5MWY3MzI5MjA4OWU2ZTVhNjNlMjc0OWRkM2FjYTkxOThlZGEiLCI0M2RmNTc3NGIwM2U3ZmVmNWZlNDBkOTMxYTdiZWRmMWJiMmU2YjQyNzM4YzRlNmQzODQxMTAzZDNhYTdmMzM5IiwiMmNlMWNiMGJmOWQyZjllMTAyOTkzZmJlMjE1MTUyYzNiMmRkMGNhYmRlMWM2OGU1MzE5YjgzOTE1NGRiYjdmNSIsIjcwYTczZjdmMzc2YjYwMDc0MjQ4OTA0NTM0YjExNDgyZDViZjBlNjk4ZWNjNDk4ZGY1MjU3N2ViZjJlOTNiOWEiXSwiY2xpZW50IjoiUFBDIiwiY3VycmVudE1vZGUiOjAsImZxZG4iOiJ2cHJvZGVtby5jb20iLCJwYXNzd29yZCI6IktRR25IK041cUo4WUxxakVGSk1uR1NnY25GTE12MFRrIiwicHJvZmlsZSI6InByb2ZpbGUxIiwic2t1IjoiMTYzOTIiLCJ1c2VybmFtZSI6IiQkT3NBZG1pbiIsInV1aWQiOlsxNiwxNDksMTcyLDc1LDE2Niw0LDMzLDY3LDE4NiwyMjYsMjEyLDkzLDIyMyw3LDE4MiwxMzJdLCJ2ZXIiOiIxMS44LjUwIn0=","protocolVersion":"4.0.0","status":"ok"}'
    const activationmsg = {
      method: 'activation',
      apiKey: 'key',
      appVersion: '1.2.0',
      protocolVersion: '4.0.0',
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

    const clientId = randomUUID()
    devices[clientId] = { ClientId: clientId, ClientSocket: null as any, unauthCount: 0 } as any
    const clientMsg = jsonParser.parse(msg)
    expect(clientMsg).toEqual(activationmsg)
  })

  test('When method is activation, it does not contain the mandatory field ver ', () => {
    const msg: ClientMsg = {
      method: 'activation',
      apiKey: 'key',
      appVersion: '1.2.0',
      protocolVersion: '4.0.0',
      status: 'ok',
      message: "all's good!",
      payload: 'IHsKICAgICAgICAgICAgICAgICJidWlsZCI6ICIzNDI1IiwKICAgICAgICAgICAgICAgICJmcWRuIjogInZwcm9kZW1vLmNvbSIsCiAgICAgICAgICAgICAgICAicGFzc3dvcmQiOiAiS1FHbkgrTjVxSjhZTHFqRUZKTW5HU2djbkZMTXYwVGsiLAogICAgICAgICAgICAgICAgImN1cnJlbnRNb2RlIjogMCwKICAgICAgICAgICAgICAgICJjZXJ0SGFzaGVzIjogWwogICAgICAgICAgICAgICAgICAgICAgICAiZTc2ODU2MzRlZmFjZjY5YWNlOTM5YTZiMjU1YjdiNGZhYmVmNDI5MzViNTBhMjY1YWNiNWNiNjAyN2U0NGU3MCIsCiAgICAgICAgICAgICAgICAgICAgICAgICJlYjA0Y2Y1ZWIxZjM5YWZhNzYyZjJiYjEyMGYyOTZjYmE1MjBjMWI5N2RiMTU4OTU2NWI4MWNiOWExN2I3MjQ0IiwKICAgICAgICAgICAgICAgICAgICAgICAgImMzODQ2YmYyNGI5ZTkzY2E2NDI3NGMwZWM2N2MxZWNjNWUwMjRmZmNhY2QyZDc0MDE5MzUwZTgxZmU1NDZhZTQiLAogICAgICAgICAgICAgICAgICAgICAgICAiZDdhN2EwZmI1ZDdlMjczMWQ3NzFlOTQ4NGViY2RlZjcxZDVmMGMzZTBhMjk0ODc4MmJjODNlZTBlYTY5OWVmNCIsCiAgICAgICAgICAgICAgICAgICAgICAgICIxNDY1ZmEyMDUzOTdiODc2ZmFhNmYwYTk5NThlNTU5MGU0MGZjYzdmYWE0ZmI3YzJjODY3NzUyMWZiNWZiNjU4IiwKICAgICAgICAgICAgICAgICAgICAgICAgIjgzY2UzYzEyMjk2ODhhNTkzZDQ4NWY4MTk3M2MwZjkxOTU0MzFlZGEzN2NjNWUzNjQzMGU3OWM3YTg4ODYzOGIiLAogICAgICAgICAgICAgICAgICAgICAgICAiYTRiNmIzOTk2ZmMyZjMwNmIzZmQ4NjgxYmQ2MzQxM2Q4YzUwMDljYzRmYTMyOWMyY2NmMGUyZmExYjE0MDMwNSIsCiAgICAgICAgICAgICAgICAgICAgICAgICI5YWNmYWI3ZTQzYzhkODgwZDA2YjI2MmE5NGRlZWVlNGI0NjU5OTg5YzNkMGNhZjE5YmFmNjQwNWU0MWFiN2RmIiwKICAgICAgICAgICAgICAgICAgICAgICAgImE1MzEyNTE4OGQyMTEwYWE5NjRiMDJjN2I3YzZkYTMyMDMxNzA4OTRlNWZiNzFmZmZiNjY2N2Q1ZTY4MTBhMzYiLAogICAgICAgICAgICAgICAgICAgICAgICAiMTZhZjU3YTlmNjc2YjBhYjEyNjA5NWFhNWViYWRlZjIyYWIzMTExOWQ2NDRhYzk1Y2Q0YjkzZGJmM2YyNmFlYiIsCiAgICAgICAgICAgICAgICAgICAgICAgICI5NjBhZGYwMDYzZTk2MzU2NzUwYzI5NjVkZDBhMDg2N2RhMGI5Y2JkNmU3NzcxNGFlYWZiMjM0OWFiMzkzZGEzIiwKICAgICAgICAgICAgICAgICAgICAgICAgIjY4YWQ1MDkwOWIwNDM2M2M2MDVlZjEzNTgxYTkzOWZmMmM5NjM3MmUzZjEyMzI1YjBhNjg2MWUxZDU5ZjY2MDMiLAogICAgICAgICAgICAgICAgICAgICAgICAiNmRjNDcxNzJlMDFjYmNiMGJmNjI1ODBkODk1ZmUyYjhhYzlhZDRmODczODAxZTBjMTBiOWM4MzdkMjFlYjE3NyIsCiAgICAgICAgICAgICAgICAgICAgICAgICI3M2MxNzY0MzRmMWJjNmQ1YWRmNDViMGU3NmU3MjcyODdjOGRlNTc2MTZjMWU2ZTYxNDFhMmIyY2JjN2Q4ZTRjIiwKICAgICAgICAgICAgICAgICAgICAgICAgIjIzOTk1NjExMjdhNTcxMjVkZThjZWZlYTYxMGRkZjJmYTA3OGI1YzgwNjdmNGU4MjgyOTBiZmI4NjBlODRiM2MiLAogICAgICAgICAgICAgICAgICAgICAgICAiNDUxNDBiMzI0N2ViOWNjOGM1YjRmMGQ3YjUzMDkxZjczMjkyMDg5ZTZlNWE2M2UyNzQ5ZGQzYWNhOTE5OGVkYSIsCiAgICAgICAgICAgICAgICAgICAgICAgICI0M2RmNTc3NGIwM2U3ZmVmNWZlNDBkOTMxYTdiZWRmMWJiMmU2YjQyNzM4YzRlNmQzODQxMTAzZDNhYTdmMzM5IiwKICAgICAgICAgICAgICAgICAgICAgICAgIjJjZTFjYjBiZjlkMmY5ZTEwMjk5M2ZiZTIxNTE1MmMzYjJkZDBjYWJkZTFjNjhlNTMxOWI4MzkxNTRkYmI3ZjUiLAogICAgICAgICAgICAgICAgICAgICAgICAiNzBhNzNmN2YzNzZiNjAwNzQyNDg5MDQ1MzRiMTE0ODJkNWJmMGU2OThlY2M0OThkZjUyNTc3ZWJmMmU5M2I5YSIKICAgICAgICAgICAgICAgIF0sCiAgICAgICAgICAgICAgICAic2t1IjogIjE2MzkyIiwKICAgICAgICAgICAgICAgICJ1dWlkIjogIjRiYWM5NTEwLTA0YTYtNDMyMS1iYWUyLWQ0NWRkZjA3YjY4NCIsCiAgICAgICAgICAgICAgICAidXNlcm5hbWUiOiAiJCRPc0FkbWluIiwKICAgICAgICAgICAgICAgICJjbGllbnQiOiAiUFBDIiwKICAgICAgICAgICAgICAgICJwcm9maWxlIjogInByb2ZpbGUxIgogICAgICAgIH0=',
      tenantId: ''
    }
    let rpsError
    try {
      const clientId = randomUUID()
      devices[clientId] = { ClientId: clientId, ClientSocket: null as any, unauthCount: 0 } as any
      jsonParser.convertClientMsg(msg)
    } catch (error) {
      rpsError = error
    }
    expect(rpsError).toBeInstanceOf(RPSError)
    expect(rpsError.message).toEqual('Invalid payload from client')
  })

  test('When method is response, it should decode payload and return the message ', () => {
    const msg = '{"apiKey":"key","appVersion":"1.2.0","message":"all\'s good!","method":"response","payload":"SFRUUC8xLjEgNDAxIFVuYXV0aG9yaXplZA0KV1dXLUF1dGhlbnRpY2F0ZTogRGlnZXN0IHJlYWxtPSJEaWdlc3Q6QTQwNzAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAiLCBub25jZT0id2xiRUsxRXRBQUFBQUFBQVdXNWFVSEZwK21RUTFqNjMiLHN0YWxlPSJmYWxzZSIscW9wPSJhdXRoIg0KQ29udGVudC1UeXBlOiB0ZXh0L2h0bWwNClNlcnZlcjogSW50ZWwoUikgQWN0aXZlIE1hbmFnZW1lbnQgVGVjaG5vbG9neSAxMS44LjUwLjM0MjUNCkNvbnRlbnQtTGVuZ3RoOiA2OTANCkNvbm5lY3Rpb246IGNsb3NlDQoNCjwhRE9DVFlQRSBIVE1MIFBVQkxJQyAiLS8vVzNDLy9EVEQgSFRNTCA0LjAxIFRyYW5zaXRpb25hbC8vRU4iID4KPGh0bWw+PGhlYWQ+PGxpbmsgcmVsPXN0eWxlc2hlZXQgaHJlZj0vc3R5bGVzLmNzcz4KPG1ldGEgaHR0cC1lcXVpdj0iQ29udGVudC1UeXBlIiBjb250ZW50PSJ0ZXh0L2h0bWw7IGNoYXJzZXQ9dXRmLTgiPgo8dGl0bGU+SW50ZWwmcmVnOyBBY3RpdmUgTWFuYWdlbWVudCBUZWNobm9sb2d5PC90aXRsZT48L2hlYWQ+Cjxib2R5Pgo8dGFibGUgY2xhc3M9aGVhZGVyPgo8dHI+PHRkIHZhbGlnbj10b3Agbm93cmFwPgo8cCBjbGFzcz10b3AxPkludGVsPGZvbnQgY2xhc3M9cj48c3VwPiZyZWc7PC9zdXA+PC9mb250PiBBY3RpdmUgTWFuYWdlbWVudCBUZWNobm9sb2d5Cjx0ZCB2YWxpZ249InRvcCI+PGltZyBzcmM9ImxvZ28uZ2lmIiBhbGlnbj0icmlnaHQiIGFsdD0iSW50ZWwiPgo8L3RhYmxlPgo8YnIgLz4KPGgyIGNsYXNzPXdhcm4+TG9nIG9uIGZhaWxlZC4gSW5jb3JyZWN0IHVzZXIgbmFtZSBvciBwYXNzd29yZCwgb3IgdXNlciBhY2NvdW50IHRlbXBvcmFyaWx5IGxvY2tlZC48L2gyPgoKPHA+Cjxmb3JtIE1FVEhPRD0iR0VUIiBhY3Rpb249ImluZGV4Lmh0bSI+PGgyPjxpbnB1dCB0eXBlPXN1Ym1pdCB2YWx1ZT0iVHJ5IGFnYWluIj4KPC9oMj48L2Zvcm0+CjxwPgoKPC9ib2R5Pgo8L2h0bWw+Cg==","protocolVersion":"4.0.0","status":"ok"}'
    const activationmsg = {
      method: 'response',
      apiKey: 'key',
      appVersion: '1.2.0',
      protocolVersion: '4.0.0',
      status: 'ok',
      message: "all's good!",
      payload: 'HTTP/1.1 401 Unauthorized\r\nWWW-Authenticate: Digest realm="Digest:A4070000000000000000000000000000", nonce="wlbEK1EtAAAAAAAAWW5aUHFp+mQQ1j63",stale="false",qop="auth"\r\nContent-Type: text/html\r\nServer: Intel(R) Active Management Technology 11.8.50.3425\r\nContent-Length: 690\r\nConnection: close\r\n\r\n<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" >\n<html><head><link rel=stylesheet href=/styles.css>\n<meta http-equiv="Content-Type" content="text/html; charset=utf-8">\n<title>Intel&reg; Active Management Technology</title></head>\n<body>\n<table class=header>\n<tr><td valign=top nowrap>\n<p class=top1>Intel<font class=r><sup>&reg;</sup></font> Active Management Technology\n<td valign="top"><img src="logo.gif" align="right" alt="Intel">\n</table>\n<br />\n<h2 class=warn>Log on failed. Incorrect user name or password, or user account temporarily locked.</h2>\n\n<p>\n<form METHOD="GET" action="index.htm"><h2><input type=submit value="Try again">\n</h2></form>\n<p>\n\n</body>\n</html>\n'
    }

    const clientId = randomUUID()
    devices[clientId] = { ClientId: clientId, ClientSocket: null as any, unauthCount: 0 } as any
    const clientMsg = jsonParser.parse(msg)
    expect(clientMsg).toEqual(activationmsg)
  })

  test('When method is response, payload is null', () => {
    const msg = '{"apiKey":"","appVersion":"1.2.0","message":"","method":"heartbeat_response","payload":"","protocolVersion":"4.0.0","status":"success"}'
    const heartbeatResponse = {
      apiKey: '',
      appVersion: '1.2.0',
      message: '',
      method: 'heartbeat_response',
      payload: '',
      protocolVersion: '4.0.0',
      status: 'success'
    }

    const clientId = randomUUID()
    devices[clientId] = { ClientId: clientId, ClientSocket: null as any, unauthCount: 0 } as any
    const clientMsg = jsonParser.parse(msg)
    expect(clientMsg).toEqual(heartbeatResponse)
  })
  // afterEach(() => {
  //   clientManager.clients = []
  // })
})
