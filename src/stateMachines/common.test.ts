/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { HttpHandler } from '../HttpHandler'
import ClientResponseMsg from '../utils/ClientResponseMsg'
import { devices } from '../WebSocketListener'
import { invokeWsmanCall } from './common'

describe('Common', () => {
  const clientId = '4c4c4544-004b-4210-8033-b6c04f504633'
  let sendSpy
  let responseMessageSpy: jest.SpyInstance
  let wrapItSpy: jest.SpyInstance
  const context = {
    profile: null,
    amtDomain: null,
    message: '',
    clientId,
    xmlMessage: '',
    response: '',
    status: 'wsman',
    errorMessage: '',
    httpHandler: new HttpHandler()
  }
  beforeEach(() => {
    devices[clientId] = {
      ClientSocket: {
        send: jest.fn()
      }
    } as any

    wrapItSpy = jest.spyOn(context.httpHandler, 'wrapIt').mockReturnValue('abcdef')
    responseMessageSpy = jest.spyOn(ClientResponseMsg, 'get').mockReturnValue({} as any)
    sendSpy = jest.spyOn(devices[clientId].ClientSocket, 'send').mockReturnValue()
  })
  it('should send a WSMan message', async () => {
    void invokeWsmanCall(context)
    expect(wrapItSpy).toHaveBeenCalled()
    expect(responseMessageSpy).toHaveBeenCalled()
    expect(sendSpy).toHaveBeenCalled()
    expect(devices[clientId].pendingPromise).toBeDefined()
  })
})
