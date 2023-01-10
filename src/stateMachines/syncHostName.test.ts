/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { interpret } from 'xstate'
import { HttpHandler } from '../HttpHandler'
import { devices } from '../WebSocketListener'
import { SyncHostName } from './syncHostName'
import * as common from './common'

describe('Sync Host Name', () => {
  let synchostname: SyncHostName
  let context
  let currentStateIndex = 0
  let configuration
  let invokeWsmanCallSpy: jest.SpyInstance

  const clientId = '4c4c4544-004b-4210-8033-b6c04f504633'
  beforeEach(() => {
    currentStateIndex = 0
    devices[clientId] = {
      status: {},
      ClientSocket: { send: jest.fn() }
    } as any
    context = {
      clientId,
      httpHandler: new HttpHandler(),
      message: null,
      xmlMessage: '',
      errorMessage: '',
      statusMessage: '',
      status: 'success',
      generalSettings: {
        HostName: 'host1'
      },
      hostnameInfo: {
        DnsSuffixOS: 'abcd',
        hostname: 'myHost'
      }
    }

    configuration = {
      services: {
        'get-general-settings': Promise.resolve({
          Envelope: {
            Header: {},
            Body: { AMT_GeneralSettings: { HostName: 'testMachine' } }
          }
        }),
        'update-amt': Promise.resolve({ clientId }),
        'save-device-to-mps': Promise.resolve({ clientId }),
        'error-machine': Promise.resolve({ clientId })
      },
      actions: {
      }
    }
    currentStateIndex = 0
    synchostname = new SyncHostName()
    invokeWsmanCallSpy = jest.spyOn(common, 'invokeWsmanCall').mockResolvedValue(null)
  })

  it('should eventually reach "SUCCESS" state', (done) => {
    const mockSyncHostName = synchostname.machine.withConfig(configuration).withContext(context)
    const flowStates = [
      'SYNC_HOSTNAME',
      'GET_GENERAL_SETTINGS',
      'UPDATE_AMT',
      'SAVE_DEVICE_TO_MPS',
      'SUCCESS'
    ]
    const service = interpret(mockSyncHostName).onTransition((state) => {
      console.log(state.value)
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
        done()
      }
    })
    service.start()
    service.send({ type: 'SYNCHOSTNAME', clientId, data: null })
  })

  it('should eventually reach "SUCCESS" state', (done) => {
    const mockSyncHostName = synchostname.machine.withConfig(configuration).withContext(context)
    const flowStates = [
      'SYNC_HOSTNAME',
      'GET_GENERAL_SETTINGS',
      'SUCCESS'
    ]
    context.hostnameInfo.hostname = 'testMachine'
    const service = interpret(mockSyncHostName).onTransition((state) => {
      console.log(state.value)
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
        done()
      }
    })
    service.start()
    service.send({ type: 'SYNCHOSTNAME', clientId, data: null })
  })

  it('should send WSMan to get amt general settings', async () => {
    await synchostname.getGeneralSettings(context)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })

  it('compare host name', () => {
    const res = synchostname.compareHostName('hostname1', 'hostname1')
    expect(res).toEqual(true)
  })

  it('compare host name with difference', () => {
    const res = synchostname.compareHostName('hostname1', 'hostname2')
    expect(res).toEqual(false)
  })

  it('update MPS', async () => {
    const response = await synchostname.saveDeviceInfoToMPS(context, null)
    expect(response).toBe(false)
  })

  it('update AMT', async () => {
    await synchostname.updateAMT(context)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
})
