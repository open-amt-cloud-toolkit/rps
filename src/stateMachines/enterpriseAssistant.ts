/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type EnterpriseAssistantMessage } from '../WSEnterpriseAssistantListener.js'
import { invokeEnterpriseAssistantCall } from './common.js'
import { devices } from '../devices.js'

const initiateCertRequest = async ({ input }): Promise<EnterpriseAssistantMessage> => {
  input.message = {
    action: 'satellite',
    subaction: '802.1x-ProFile-Request',
    satelliteFlags: 2,
    nodeid: input.clientId,
    domain: '',
    reqid: '',
    authProtocol: input.authProtocol,
    osname: 'win11',
    devname: devices[input.clientId].hostname,
    icon: 1,
    cert: null,
    certid: null,
    ver: ''
  }
  return await invokeEnterpriseAssistantCall(input)
}

const sendEnterpriseAssistantKeyPairResponse = async ({ input }): Promise<EnterpriseAssistantMessage> => {
  const clientObj = devices[input.clientId]
  const potentialArray = input.message.Envelope.Body.PullResponse.Items.AMT_PublicPrivateKeyPair
  let PublicPrivateKeyPair: any
  let DERKey: any
  if (clientObj.tls) {
    if (Array.isArray(potentialArray)) {
      clientObj.tls.PublicPrivateKeyPair = potentialArray
    } else {
      clientObj.tls.PublicPrivateKeyPair = [potentialArray]
    }
    PublicPrivateKeyPair = clientObj.tls.PublicPrivateKeyPair.filter((x) => x.InstanceID === input.keyPairHandle)[0]
    DERKey = PublicPrivateKeyPair.DERKey
  }

  input.message = {
    action: 'satellite',
    subaction: '802.1x-KeyPair-Response',
    satelliteFlags: 2,
    nodeid: input.clientId,
    domain: '',
    reqid: '',
    devname: devices[input.clientId].hostname,
    authProtocol: 0,
    osname: 'win11',
    icon: 1,
    DERKey,
    keyInstanceId: PublicPrivateKeyPair?.InstanceID,
    ver: ''
  }
  return await invokeEnterpriseAssistantCall(input)
}

const getCertFromEnterpriseAssistant = async ({ input }): Promise<EnterpriseAssistantMessage> => {
  const signedCSR = input.message.Envelope?.Body?.GeneratePKCS10RequestEx_OUTPUT?.SignedCertificateRequest
  input.message = {
    action: 'satellite',
    subaction: '802.1x-CSR-Response',
    satelliteFlags: 2,
    nodeid: input.clientId,
    domain: '',
    reqid: '',
    authProtocol: 0,
    osname: 'win11',
    devname: devices[input.clientId].hostname,
    icon: 1,
    signedcsr: signedCSR,
    ver: ''
  }
  return await invokeEnterpriseAssistantCall(input)
}

export { initiateCertRequest, sendEnterpriseAssistantKeyPairResponse, getCertFromEnterpriseAssistant }
