/*********************************************************************
 * Copyright (c) Intel Corporation 2022
 * SPDX-License-Identifier: Apache-2.0
 **********************************************************************/

import { type EnterpriseAssistantMessage } from '../WSEnterpriseAssistantListener'
import { invokeEnterpriseAssistantCall } from './common'
import { devices } from '../WebSocketListener'

const initiateCertRequest = async (context: any, event: any): Promise<EnterpriseAssistantMessage> => {
  context.message = {
    action: 'satellite',
    subaction: '802.1x-ProFile-Request',
    satelliteFlags: 2,
    nodeid: context.clientId,
    domain: '',
    reqid: '',
    authProtocol: 0,
    osname: 'win11',
    devname: devices[context.clientId].hostname,
    icon: 1,
    cert: null,
    certid: null,
    ver: ''
  }
  return await invokeEnterpriseAssistantCall(context)
}

const sendEnterpriseAssistantKeyPairResponse = async (context: any, event: any): Promise<EnterpriseAssistantMessage> => {
  const clientObj = devices[context.clientId]
  const potentialArray = context.message.Envelope.Body.PullResponse.Items.AMT_PublicPrivateKeyPair
  if (Array.isArray(potentialArray)) {
    clientObj.tls.PublicPrivateKeyPair = potentialArray
  } else {
    clientObj.tls.PublicPrivateKeyPair = [potentialArray]
  }
  const PublicPrivateKeyPair = clientObj.tls.PublicPrivateKeyPair.filter(x => x.InstanceID === context.keyPairHandle)[0]
  const DERKey = PublicPrivateKeyPair?.DERKey

  context.message = {
    action: 'satellite',
    subaction: '802.1x-KeyPair-Response',
    satelliteFlags: 2,
    nodeid: context.clientId,
    domain: '',
    reqid: '',
    devname: devices[context.clientId].hostname,
    authProtocol: 0,
    osname: 'win11',
    icon: 1,
    DERKey,
    keyInstanceId: PublicPrivateKeyPair?.InstanceID,
    ver: ''
  }
  return await invokeEnterpriseAssistantCall(context)
}

const getCertFromEnterpriseAssistant = async (context: any, event: any): Promise<EnterpriseAssistantMessage> => {
  const signedCSR = context.message.Envelope?.Body?.GeneratePKCS10RequestEx_OUTPUT?.SignedCertificateRequest
  context.message = {
    action: 'satellite',
    subaction: '802.1x-CSR-Response',
    satelliteFlags: 2,
    nodeid: context.clientId,
    domain: '',
    reqid: '',
    authProtocol: 0,
    osname: 'win11',
    devname: devices[context.clientId].hostname,
    icon: 1,
    signedcsr: signedCSR,
    ver: ''
  }
  return await invokeEnterpriseAssistantCall(context)
}

export { initiateCertRequest, sendEnterpriseAssistantKeyPairResponse, getCertFromEnterpriseAssistant }
