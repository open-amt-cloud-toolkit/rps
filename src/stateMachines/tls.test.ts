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
import { UNEXPECTED_PARSE_ERROR } from '../utils/constants'
import { wsmanAlreadyExistsAllChunks } from '../test/helper/AMTMessages'

describe('TLS State Machine', () => {
  let tls: TLS
  let config
  let context: TLSContext
  let currentStateIndex = 0
  let invokeWsmanCallSpy: jest.SpyInstance
  let invokeEnterpriseAssistantCallSpy: jest.SpyInstance
  const clientId = '4c4c4544-004b-4210-8033-b6c04f504633'
  beforeEach(() => {
    currentStateIndex = 0
    devices[clientId] = {
      status: {},
      hostname: 'WinDev2211Eval',
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
    invokeEnterpriseAssistantCallSpy = jest.spyOn(common, 'invokeEnterpriseAssistantCall').mockResolvedValue({} as any)

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
  afterEach(() => {
    jest.resetAllMocks()
    jest.useRealTimers()
  })
  it('should configure TLS', (done) => {
    jest.useFakeTimers()
    context.amtProfile = { tlsMode: 3, tlsSigningAuthoritys: 'SelfSigned' } as any
    // already existing error case is covered with this reject
    // eslint-disable-next-line prefer-promise-reject-errors
    config.services['create-tls-credential-context'] = Promise.reject({
      body: {
        text: wsmanAlreadyExistsAllChunks
      }
    })
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
      expect(state.matches(flowStates[currentStateIndex++])).toBe(true)
      if (state.matches('WAIT_A_BIT')) {
        jest.advanceTimersByTime(5000)
      } else if (state.matches('SUCCESS') && currentStateIndex === flowStates.length) {
        done()
      }
    })

    tlsService.start()
    tlsService.send({ type: 'CONFIGURE_TLS', clientId })
    jest.runAllTicks()
  })

  it('should retry', (done) => {
    context.amtProfile = { tlsMode: 3, tlsSigningAuthoritys: 'SelfSigned' } as any
    config.services['pull-public-key-certificate'] = Promise.reject(new UNEXPECTED_PARSE_ERROR())
    const tlsStateMachine = tls.machine.withConfig(config).withContext(context)
    const flowStates = [
      'PROVISIONED',
      'ENUMERATE_PUBLIC_KEY_CERTIFICATE',
      'PULL_PUBLIC_KEY_CERTIFICATE',
      'ENUMERATE_PUBLIC_KEY_CERTIFICATE',
      'PULL_PUBLIC_KEY_CERTIFICATE',
      'ENUMERATE_PUBLIC_KEY_CERTIFICATE',
      'PULL_PUBLIC_KEY_CERTIFICATE',
      'ENUMERATE_PUBLIC_KEY_CERTIFICATE',
      'PULL_PUBLIC_KEY_CERTIFICATE',
      'FAILED'
    ]

    const tlsService = interpret(tlsStateMachine).onTransition((state) => {
      const expected = flowStates[currentStateIndex++]
      expect(state.matches(expected)).toBe(true)
      if (state.matches('FAILED') || currentStateIndex === flowStates.length) {
        done()
      }
    })

    tlsService.start()
    tlsService.send({ type: 'CONFIGURE_TLS', clientId })
  })

  it('should initiateCertRequest', async () => {
    await tls.initiateCertRequest(context, null)

    expect(context.message).toEqual({
      action: 'satellite',
      subaction: '802.1x-ProFile-Request',
      satelliteFlags: 2,
      nodeid: context.clientId,
      domain: '',
      reqid: '',
      authProtocol: 0,
      osname: 'win11',
      devname: 'WinDev2211Eval',
      icon: 1,
      cert: null,
      certid: null,
      ver: ''
    })
    expect(invokeEnterpriseAssistantCallSpy).toHaveBeenCalledWith(context)
  })
  it('should sendEnterpriseAssistantKeyPairResponse', async () => {
    context.message = {
      Envelope: {
        Body: {
          PullResponse: {
            Items: {
              AMT_PublicPrivateKeyPair: [
                {
                  DERKey: 'DERKey'
                }
              ]
            }
          }
        }
      }
    }
    const expectedMessage = {
      action: 'satellite',
      subaction: '802.1x-KeyPair-Response',
      satelliteFlags: 2,
      nodeid: context.clientId,
      domain: '',
      reqid: '',
      devname: 'WinDev2211Eval',
      authProtocol: 0,
      osname: 'win11',
      icon: 1,
      DERKey: 'DERKey',
      keyInstanceId: 'Intel(r) AMT Key: Handle: 0',
      ver: ''
    }
    await tls.sendEnterpriseAssistantKeyPairResponse(context, null)
    expect(context.message).toEqual(expectedMessage)
    expect(invokeEnterpriseAssistantCallSpy).toHaveBeenCalledWith(context)
    expect(devices[context.clientId].tls.PublicPrivateKeyPair).toEqual([
      {
        DERKey: 'DERKey'
      }
    ])
  })
  it('should signCSR', async () => {
    context.message = {
      response: {
        keyInstanceId: 'ABC123',
        csr: 'null'
      }
    }

    const publicKeyManagementSpy = jest.spyOn(context.amt.PublicKeyManagementService, 'GeneratePKCS10RequestEx').mockReturnValue({} as any)

    await tls.signCSR(context, null)

    expect(publicKeyManagementSpy).toHaveBeenCalledWith({
      KeyPair: expect.stringContaining('ABC123'),
      SigningAlgorithm: 1,
      NullSignedCertificateRequest: context.message.response.csr
    })
  })
  it('should addCertificate', async () => {
    context.message = { Envelope: { Body: { PullResponse: { Items: { AMT_PublicPrivateKeyPair: {} } } } } }
    await tls.addCertificate(context, null)
    expect(invokeWsmanCallSpy).toHaveBeenCalled()
  })
  it('should getCertFromEnterpriseAssistant', async () => {
    context.message = {
      Envelope: {
        Body: {
          GeneratePKCS10RequestEx_OUTPUT: {
            SignedCertificateRequest: 'certificate'
          }
        }
      }
    }
    await tls.getCertFromEnterpriseAssistant(context, null)
    expect(context.message).toEqual({
      action: 'satellite',
      subaction: '802.1x-CSR-Response',
      satelliteFlags: 2,
      nodeid: context.clientId,
      domain: '',
      reqid: '',
      authProtocol: 0,
      osname: 'win11',
      devname: 'WinDev2211Eval',
      icon: 1,
      signedcsr: 'certificate',
      ver: ''
    })
    expect(invokeEnterpriseAssistantCallSpy).toHaveBeenCalledWith(context)
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
    const event: any = { data: { Envelope: { Body: { AddCertificate_OUTPUT: { CreatedCertificate: { ReferenceParameters: { SelectorSet: { Selector: { _: '' } } } } } } } } }
    await tls.createTLSCredentialContext(context, event)
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
  it('should updateConfigurationStatus when success', async () => {
    context.status = 'success'
    context.statusMessage = 'success status message'
    tls.updateConfigurationStatus(context)
    expect(devices[context.clientId].status.TLSConfiguration).toEqual('success status message')
    expect(invokeWsmanCallSpy).not.toHaveBeenCalled()
  })
  it('should updateConfigurationStatus when failure', async () => {
    context.status = 'error'
    context.errorMessage = 'error status message'
    tls.updateConfigurationStatus(context)
    expect(devices[context.clientId].status.TLSConfiguration).toEqual('error status message')
    expect(invokeWsmanCallSpy).not.toHaveBeenCalled()
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
