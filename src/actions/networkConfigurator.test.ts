/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { CIRAConfigurator } from './CIRAConfigurator'
import { NetworkConfigurator } from './NetworkConfigurator'
import { ClientManager } from '../ClientManager'
import { Configurator } from '../Configurator'
import Logger from '../Logger'
import { NodeForge } from '../NodeForge'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { Validator } from '../Validator'
import { WSManProcessor } from '../WSManProcessor'
import { v4 as uuid } from 'uuid'
import { AddWiFiSettingsResponse, AMTEthernetPortSettings, AMTEthernetPortSettingsResponse, AMTGeneralSettings, CIMWiFiPortResponse } from '../test/helper/AMTJSONResponses'
import { EnvReader } from '../utils/EnvReader'
import { config } from '../test/helper/Config'
import { ClientAction } from '../models/RCS.Config'
import { TLSConfigurator } from './TLSConfigurator'
import { CertManager } from '../CertManager'
EnvReader.GlobalEnvConfig = config
const nodeForge = new NodeForge()
const certManager = new CertManager(new Logger('CertManager'), nodeForge)
const configurator = new Configurator()
const clientManager = ClientManager.getInstance(new Logger('ClientManager'))
const responseMsg = new ClientResponseMsg(new Logger('ClientResponseMsg'), nodeForge)
const amtwsman = new WSManProcessor(new Logger('WSManProcessor'), clientManager, responseMsg)
const validator = new Validator(new Logger('Validator'), configurator, clientManager, nodeForge)
const tlsConfig = new TLSConfigurator(new Logger('CIRAConfig'), certManager, responseMsg, amtwsman, clientManager)
const ciraConfig = new CIRAConfigurator(new Logger('CIRAConfig'), configurator, responseMsg, amtwsman, clientManager, tlsConfig)
const networkConfigurator = new NetworkConfigurator(new Logger('NetworkConfig'), configurator, responseMsg, amtwsman, clientManager, validator, ciraConfig)
let clientId, activationmsg

beforeAll(() => {
  clientId = uuid()
  activationmsg = {
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
      profile: {
        profileName: 'acm',
        generateRandomPassword: false,
        activation: 'acmactivate',
        ciraConfigName: 'config1',
        generateRandomMEBxPassword: false,
        tags: ['acm'],
        dhcpEnabled: true,
        wifiConfigs: [
          {
            priority: 1,
            profileName: 'home'
          }
        ]
      },
      action: 'acmactivate'
    }
  }
  clientManager.addClient({
    ClientId: clientId,
    ClientSocket: null,
    ClientData: activationmsg,
    ciraconfig: {},
    network: {},
    status: {}
  })
})

describe('execute function', () => {
  test('should throw an error when the payload is null', async () => {
    // const clientObj = clientManager.getClientObject(clientId)
    // clientObj.uuid = activationmsg.payload.uuid
    // clientManager.setClientObject(clientObj)
    // const clientMsg = { payload: null }
    // const responseMsg = await networkConfigurator.execute(clientMsg, clientId)
    // expect(responseMsg.message).toEqual(`Device ${activationmsg.payload.uuid} activation failed. Missing/invalid WSMan response payload.`)
  })
})

describe('process AMT General Settings', () => {
  test('should send a request to get AMT ether net settings when network or shared FQDN is enabled', async () => {
    const spy = jest.spyOn(amtwsman, 'batchEnum')
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = activationmsg.payload.uuid
    clientManager.setClientObject(clientObj)
    const message = { payload: AMTGeneralSettings }
    await networkConfigurator.processGeneralSettings(message, clientId)
    expect(spy).toHaveBeenCalled()
  })
  test('should send a request to set general settings when the network is not enabled', async () => {
    jest.spyOn(amtwsman, 'put')
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = activationmsg.payload.uuid
    clientManager.setClientObject(clientObj)
    const networkDisabled = AMTGeneralSettings
    networkDisabled.AMT_GeneralSettings.response.AMTNetworkEnabled = 0
    const message = { payload: networkDisabled }
    await networkConfigurator.processGeneralSettings(message, clientId)
    await amtwsman.put(clientId, 'AMT_GeneralSettings', networkDisabled.AMT_GeneralSettings.response)
    expect(amtwsman.put).toHaveBeenCalledWith(clientId, 'AMT_GeneralSettings', networkDisabled.AMT_GeneralSettings.response)
  })
})

describe('Parse the get and set of AMT Ethernet Port Settings response received from AMT', () => {
  test('Should send a put resquest if the dhcpEnabled true to update ethernet port settings', async () => {
    const spy = jest.spyOn(amtwsman, 'put')
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = activationmsg.payload.uuid
    clientManager.setClientObject(clientObj)
    const message = { payload: AMTEthernetPortSettings }
    await networkConfigurator.processEthernetPortSettings(message, clientId)
    // await amtwsman.put(clientId, 'AMT_EthernetPortSettings', AMTEthernetPortSettings.AMT_EthernetPortSettings.responses[0])
    expect(spy).toHaveBeenCalledWith(clientId, 'AMT_EthernetPortSettings', AMTEthernetPortSettings.AMT_EthernetPortSettings.responses[0])
  })
  test('should set action to CIRA Config when update to ethernet port settings fails', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = activationmsg.payload.uuid
    clientManager.setClientObject(clientObj)
    const ipSyncEnabledFalse = AMTEthernetPortSettingsResponse
    ipSyncEnabledFalse.Body.IpSyncEnabled = false
    const message = { payload: ipSyncEnabledFalse }
    await networkConfigurator.processEthernetPortSettings(message, clientId)
    expect(clientObj.status.Network).toBe('Failed.')
    expect(clientObj.action).toBe(ClientAction.CIRACONFIG)
    expect(clientObj.network.setEthernetPortSettings).toBe(true)
  })
  test('should set action to CIRA Config when update to ethernet port settings response SharedStaticIp is true', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = activationmsg.payload.uuid
    clientManager.setClientObject(clientObj)
    const sharedStaticIpTrue = AMTEthernetPortSettingsResponse
    sharedStaticIpTrue.Body.IpSyncEnabled = true
    sharedStaticIpTrue.Body.SharedStaticIp = true
    const message = { payload: sharedStaticIpTrue }
    await networkConfigurator.processEthernetPortSettings(message, clientId)
    expect(clientObj.status.Network).toBe('Ethernet Configured.')
    expect(clientObj.action).toBe(ClientAction.CIRACONFIG)
    expect(clientObj.network.setEthernetPortSettings).toBe(true)
  })
  test('should set action to CIRA Config when the IpSyncEnabled, DHCPEnabled is true and profile has no wifi configs', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = activationmsg.payload.uuid
    clientManager.setClientObject(clientObj)
    activationmsg.payload.profile.wificonfigs = []
    const message = { payload: AMTEthernetPortSettingsResponse }
    await networkConfigurator.processEthernetPortSettings(message, clientId)
    expect(clientObj.status.Network).toBe('Ethernet Configured.')
    expect(clientObj.action).toBe(ClientAction.CIRACONFIG)
    expect(clientObj.network.setEthernetPortSettings).toBe(true)
  })
  test('should set action to CIRA Config when IpSyncEnabled, DHCPEnabled is true and profile has wifi configs but no wifi capabilities', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = activationmsg.payload.uuid
    clientObj.network.ethernetSettingsWifiObj = null
    clientManager.setClientObject(clientObj)
    AMTEthernetPortSettingsResponse.Body.SharedStaticIp = false
    AMTEthernetPortSettingsResponse.Body.DHCPEnabled = true
    const message = { payload: AMTEthernetPortSettingsResponse }
    activationmsg.payload.profile.wificonfigs = [
      {
        priority: 1,
        profileName: 'home'
      }
    ]
    await networkConfigurator.processEthernetPortSettings(message, clientId)
    expect(clientObj.status.Network).toBe('Ethernet Configured. WiFi Failed.')
    expect(clientObj.action).toBe(ClientAction.CIRACONFIG)
    expect(clientObj.network.setEthernetPortSettings).toBe(true)
  })
})

describe('Parse the WiFi port response received from AMT', () => {
  test('setWiFiPortResponse flag should be true when EnabledState and RequestedState is 32769 ', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = activationmsg.payload.uuid
    clientManager.setClientObject(clientObj)
    const message = { payload: CIMWiFiPortResponse }
    await networkConfigurator.processWiFiPortResponse(message, clientId)
    expect(clientObj.network.setWiFiPortResponse).toBe(true)
  })
  test('should set action to CIRA Config when EnabledState or RequestedState is not 32769', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = activationmsg.payload.uuid
    clientManager.setClientObject(clientObj)
    const zeroEnabledState = CIMWiFiPortResponse
    zeroEnabledState.Body.EnabledState = 0
    const message = { payload: zeroEnabledState }
    await networkConfigurator.processWiFiPortResponse(message, clientId)
    expect(clientObj.status.Network).toBe('Ethernet Configured. WiFi Failed.')
    expect(clientObj.action).toBe(ClientAction.CIRACONFIG)
    expect(clientObj.network.setEthernetPortSettings).toBe(true)
  })
})

describe('Parse the WiFi Endpoint Settings response received from AMT', () => {
  test('should set action to CIRA Config when ReturnValue is not zero in response to add WiFi setttings', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = activationmsg.payload.uuid
    clientManager.setClientObject(clientObj)
    const returnValueZero = AddWiFiSettingsResponse
    returnValueZero.Body.ReturnValue = 2
    const message = { payload: returnValueZero }
    await networkConfigurator.processWiFiEndpointSettings(message, clientId)
    expect(clientObj.action).toBe(ClientAction.CIRACONFIG)
  })
  test('should set action to CIRA Config when ReturnValue is zero in response to add WiFi setttings and count is greater than or equal to profile wificonfigs', async () => {
    const clientObj = clientManager.getClientObject(clientId)
    clientObj.uuid = activationmsg.payload.uuid
    clientManager.setClientObject(clientObj)
    AddWiFiSettingsResponse.Body.ReturnValue = 0
    const message = { payload: AddWiFiSettingsResponse }
    await networkConfigurator.processWiFiEndpointSettings(message, clientId)
    expect(clientObj.status.Network).toBe('Ethernet Configured. WiFi Failed.')
    expect(clientObj.action).toBe(ClientAction.CIRACONFIG)
  })
})
