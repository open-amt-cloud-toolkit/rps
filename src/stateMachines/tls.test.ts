/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { interpret } from 'xstate'
import { HttpHandler } from '../HttpHandler'
import { devices } from '../WebSocketListener'
import { TLS, type TLSContext } from './tls'
import * as common from './common'
import * as forge from 'node-forge'
import { AMT } from '@open-amt-cloud-toolkit/wsman-messages'

describe('TLS State Machine', () => {
  let tls: TLS
  let config
  let context: TLSContext
  let currentStateIndex = 0
  let invokeWsmanCallSpy: jest.SpyInstance

  const clientId = '4c4c4544-004b-4210-8033-b6c04f504633'
  beforeEach(() => {
    currentStateIndex = 0
    devices[clientId] = {
      status: {},
      ClientSocket: { send: jest.fn() },
      tls: {}
    } as any
    context = {
      clientId,
      httpHandler: new HttpHandler(),
      message: null,
      xmlMessage: '',
      errorMessage: '',
      statusMessage: '',
      status: 'success',
      tlsSettingData: [],
      tlsCredentialContext: '',
      amtProfile: { tlsMode: 3, tlsCerts: { ISSUED_CERTIFICATE: { pem: '' } } } as any,
      unauthCount: 0,
      amt: new AMT.Messages()
    }
    tls = new TLS()
    invokeWsmanCallSpy = jest.spyOn(common, 'invokeWsmanCall').mockResolvedValue(null)

    config = {
      services: {
        'enumerate-public-key-certificate': Promise.resolve({}),
        'pull-public-key-certificate': Promise.resolve({ Envelope: { Body: { PullResponse: { Items: { AMT_TLSSettingData: {} } } } } }),
        'add-trusted-root-certificate': Promise.resolve({}),
        'generate-key-pair': Promise.resolve({}),
        'enumerate-public-private-key-pair': Promise.resolve({}),
        'pull-public-private-key-pair': Promise.resolve({ Envelope: { Body: { PullResponse: { Items: { AMT_PublicPrivateKeyPair: {} } } } } }),
        'add-certificate': Promise.resolve({}),
        'enumerate-tls-credential-context': Promise.resolve({}),
        'pull-tls-credential-context': Promise.resolve({}),
        'create-tls-credential-context': Promise.resolve({}),
        'time-machine': Promise.resolve({}),
        'error-machine': Promise.resolve({}),
        'enumerate-tls-data': Promise.resolve({}),
        'pull-tls-data': Promise.resolve({ Envelope: { Body: { PullResponse: { Items: { AMT_TLSSettingData: [{}, {}] } } } } }),
        'put-remote-tls-data': Promise.resolve({}),
        'put-local-tls-data': Promise.resolve({}),
        'commit-changes': Promise.resolve({})
      },
      actions: {
        'Send Message to Device': () => {}
      }
    }
  })
  jest.setTimeout(15000)
  it('should configure TLS', (done) => {
    const tlsStateMachine = tls.machine.withConfig(config).withContext(context)
    const flowStates = [
      'PROVISIONED',
      'ENUMERATE_PUBLIC_KEY_CERTIFICATE',
      'PULL_PUBLIC_KEY_CERTIFICATE',
      'ADD_TRUSTED_ROOT_CERTIFICATE',
      'GENERATE_KEY_PAIR',
      'ENUMERATE_PUBLIC_PRIVATE_KEY_PAIR',
      'PULL_PUBLIC_PRIVATE_KEY_PAIR',
      'ADD_CERTIFICATE',
      'CREATE_TLS_CREDENTIAL_CONTEXT',
      'SYNC_TIME',
      'ENUMERATE_TLS_DATA',
      'PULL_TLS_DATA',
      'PUT_REMOTE_TLS_DATA',
      'WAIT_A_BIT',
      'PUT_LOCAL_TLS_DATA',
      'COMMIT_CHANGES',
      'SUCCESS'
    ]

    const tlsService = interpret(tlsStateMachine).onTransition((state) => {
      console.log(state.value)
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    tlsService.start()
    tlsService.send({ type: 'CONFIGURE_TLS', clientId })
  })
  it('should addCertificate', async () => {
    context.message = { Envelope: { Body: { PullResponse: { Items: { AMT_PublicPrivateKeyPair: {} } } } } }
    await tls.addCertificate(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should generateKeyPair', async () => {
    await tls.generateKeyPair(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should addTrustedRootCertificate', async () => {
    devices[clientId].ClientData = { payload: { profile: { tlsCerts: { ROOT_CERTIFICATE: { certbin: '' } } } } }
    await tls.addTrustedRootCertificate(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should enumerateTLSCredentialContext', async () => {
    await tls.enumerateTLSCredentialContext(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should pullTLSCredentialContext', async () => {
    context.message = { Envelope: { Body: { EnumerateResponse: { EnumerationContext: '' } } } }
    await tls.pullTLSCredentialContext(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should createTLSCredentialContext', async () => {
    await tls.createTLSCredentialContext(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should enumeratePublicKeyCertificate', async () => {
    await tls.enumeratePublicKeyCertificate(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should pullPublicKeyCertificate', async () => {
    context.message = { Envelope: { Body: { EnumerateResponse: { EnumerationContext: '' } } } }
    await tls.pullPublicKeyCertificate(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should enumeratePublicPrivateKeyPair', async () => {
    await tls.enumeratePublicPrivateKeyPair(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should pullPublicPrivateKeyPair', async () => {
    context.message = { Envelope: { Body: { EnumerateResponse: { EnumerationContext: '' } } } }
    await tls.pullPublicPrivateKeyPair(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should updateConfigurationStatus', async () => {
    tls.updateConfigurationStatus(context)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should enumerateTlsData', async () => {
    await tls.enumerateTlsData(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should pullTLSData', async () => {
    context.message = { Envelope: { Body: { EnumerateResponse: { EnumerationContext: '' } } } }
    await tls.pullTLSData(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should putRemoteTLSData', async () => {
    context.tlsSettingData = [{}]
    jest.spyOn(forge.pki, 'certificateFromPem').mockReturnValue({ subject: { getField: () => ({}) } } as any)
    const tlsSettingDataSpy = jest.spyOn(context.amt.TLSSettingData, 'Put').mockReturnValue('')
    await tls.putRemoteTLSData(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
    expect(tlsSettingDataSpy).toHaveBeenCalled()
  })
  it('should putLocalTLSData', async () => {
    context.tlsSettingData = [{}, {}]
    jest.spyOn(forge.pki, 'certificateFromPem').mockReturnValue({ subject: { getField: () => ({}) } } as any)
    const tlsSettingDataSpy = jest.spyOn(context.amt.TLSSettingData, 'Put').mockReturnValue('')
    await tls.putLocalTLSData(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
    expect(tlsSettingDataSpy).toHaveBeenCalled()
  })
  it('should commitChanges', async () => {
    await tls.commitChanges(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
})
