/*********************************************************************
 * Copyright (c) Intel Corporation 2019
 * SPDX-License-Identifier: Apache-2.0
 * Description:Configure Network settings on AMT device
 * Author : Madhavi Losetty
 **********************************************************************/

import { IExecutor } from '../interfaces/IExecutor'
import { ILogger } from '../interfaces/ILogger'
import { ClientAction, ClientMsg, ClientObject, FeaturesConfigFlow } from '../models/RCS.Config'
import { IConfigurator } from '../interfaces/IConfigurator'
import { ClientResponseMsg } from '../utils/ClientResponseMsg'
import { MqttProvider } from '../utils/MqttProvider'
import { RPSError } from '../utils/RPSError'
import { devices } from '../WebSocketListener'
import { AMT, CIM, Common, IPS } from '@open-amt-cloud-toolkit/wsman-messages'
import { HttpHandler } from '../HttpHandler'
import { parseBody } from '../utils/parseWSManResponseBody'

export class FeaturesConfigurator implements IExecutor {
  amt: AMT.Messages
  cim: CIM.Messages
  ips: IPS.Messages
  httpHandler: HttpHandler
  constructor (
    private readonly logger: ILogger,
    private readonly configurator: IConfigurator,
    private readonly responseMsg: ClientResponseMsg,
    private readonly nextClientAction: ClientAction,
    private readonly nextClientExecutor: IExecutor
  ) {
    this.amt = new AMT.Messages()
    this.cim = new CIM.Messages()
    this.ips = new IPS.Messages()
    this.httpHandler = new HttpHandler()
  }

  /** gather all the calls, classes, messages to request and set configs properly.
   * connect a device, put console logs, call the APIs, see how the messages are sent/received.
   * get messages from setAmtFeatures in mps and the api module messages.d.ts
   */

  /**
   * @description Sets the AMT Features as configured in the profile
   * @param {any} message valid client message
   * @param {string} clientId Id to keep track of connections
   * @returns {ClientMsg} message to sent to client
   */
  async execute (message: any, clientId: string): Promise<ClientMsg> {
    try {
      const clientObj: ClientObject = devices[clientId]
      const features: FeaturesConfigFlow = clientObj.features
      let nextClientMsg
      this.processWSManJsonResponse(message, clientObj)

      if (!features?.AMT_RedirectionService) {
        nextClientMsg = this.buildWSManResponseMsg(clientId, this.amt.RedirectionService(AMT.Methods.GET))
      } else if (!features?.IPS_OptInService) {
        nextClientMsg = this.buildWSManResponseMsg(clientId, this.ips.OptInService(IPS.Methods.GET))
      } else if (!features?.CIM_KVMRedirectionSAP) {
        nextClientMsg = this.buildWSManResponseMsg(clientId, this.ips.OptInService(IPS.Methods.GET))
      } else if (features.transitionFromGetToSet) {
        const nextXmlMsg = this.onTransitionFromGetToSet(features, clientObj.ClientData.payload.profile)
        // send back the first 'set configuration' message
        if (nextXmlMsg) {
          nextClientMsg = this.buildWSManResponseMsg(clientId, nextXmlMsg)
        } else {
          nextClientMsg = await this.enterNextClientState(clientId)
        }
      } else if (features.setKvmRedirectionSapXml) {
        nextClientMsg = this.buildWSManResponseMsg(clientId, features.setKvmRedirectionSapXml)
      } else if (features.putRedirectionServiceXml) {
        nextClientMsg = this.buildWSManResponseMsg(clientId, features.putRedirectionServiceXml)
      } else if (features.putIpsOptInServiceXml) {
        nextClientMsg = this.buildWSManResponseMsg(clientId, features.putIpsOptInServiceXml)
      } else {
        // flow is complete so enter the next executor
        nextClientMsg = await this.enterNextClientState(clientId)
      }
      return nextClientMsg
    } catch (error) {
      this.logger.error(`${clientId} : Failed to configure features settings : ${error}`)
      MqttProvider.publishEvent('fail', ['FeaturesConfigurator'], 'Failed', devices[clientId].uuid)
      if (error instanceof RPSError) {
        devices[clientId].status.Features = error.message
      } else {
        devices[clientId].status.Features = 'Failed'
      }
      return this.responseMsg.get(clientId, null, 'error', 'failed', JSON.stringify(devices[clientId].status))
    }
  }

  processWSManJsonResponse (message: any, clientObj: ClientObject): null {
    if (!message) { return null }
    const wsmanResponse = message.payload
    switch (wsmanResponse.statusCode) {
      case 200: {
        const xmlBody = parseBody(wsmanResponse)
        // pares WSMan xml response to json
        const response = this.httpHandler.parseXML(xmlBody)
        const action = response.Envelope.Header.Action._.split('/').pop()
        const method = response.Envelope.Header.ResourceURI.split('/').pop()
        this.logger.debug(method, action)
        if (method === 'AMT_RedirectionService' && action === 'GetResponse') {
          clientObj.features.AMT_RedirectionService = response.Envelope.Body.AMT_RedirectionService
          this.checkForTransitionFromGetToSet(clientObj.features)
        } else if (method === 'IPS_OptInService' && action === 'GetResponse') {
          clientObj.features.IPS_OptInService = response.Envelope.Body.IPS_OptInService
          this.checkForTransitionFromGetToSet(clientObj.features)
        } else if (method === 'CIM_KVMRedirectionSAP' && action === 'GetResponse') {
          clientObj.features.CIM_KVMRedirectionSAP = response.Envelope.Body.CIM_KVMRedirectionSAP
          this.checkForTransitionFromGetToSet(clientObj.features)
        } else if (method === 'AMT_RedirectionService' && action === 'RequestStateChangeResponse') {
          clientObj.features.setRedirectionServiceXml = null
        } else if (method === 'CIM_KVMRedirectionSAP' && action === 'RequestStateChangeResponse') {
          clientObj.features.setKvmRedirectionSapXml = null
        } else if (method === 'AMT_RedirectionService' && action === 'PutResponse') {
          clientObj.features.putRedirectionServiceXml = null
        } else if (method === 'IPS_OptInService' && action === 'PutResponse') {
          clientObj.features.putIpsOptInServiceXml = null
        } else {
          this.logger.warn(`processWSManJsonResponse unhandled response ${method}, ${action}`)
        }
        break
      }
      default: {
        throw new RPSError(`Request failed with status ${wsmanResponse.statusCode}`)
      }
    }
  }

  buildWSManResponseMsg (clientId: string, xmlRequestBody: string): ClientMsg {
    const data = this.httpHandler.wrapIt(xmlRequestBody, devices[clientId].connectionParams)
    return this.responseMsg.get(clientId, data, 'wsman', 'ok', 'alls good!')
  }

  // transitions control to the next action and executor
  async enterNextClientState (clientId: string): Promise<ClientMsg> {
    if (this.nextClientAction) {
      const clientObj: ClientObject = devices[clientId]
      clientObj.action = this.nextClientAction
    }
    if (this.nextClientExecutor) {
      return await this.nextClientExecutor.execute(null, clientId)
    } else {
      return null
    }
  }

  checkForTransitionFromGetToSet (features: FeaturesConfigFlow): void {
    if (features.AMT_RedirectionService && features.IPS_OptInService && features.CIM_KVMRedirectionSAP) {
      features.transitionFromGetToSet = true
    }
  }

  onTransitionFromGetToSet (features: FeaturesConfigFlow, profile: any): string {
    // this step in the flow will figure out which (if any) configuration changes
    // need to be made on the client. The messages to send are put into the features flow.
    let isRedirectionChanged = false
    let redirectionListenerEnabled = features.AMT_RedirectionService.ListenerEnabled
    let solEnabled = (features.AMT_RedirectionService.EnabledState & Common.Models.AMT_REDIRECTION_SERVICE_ENABLE_STATE.Enabled) !== 0
    let iderEnabled = (features.AMT_RedirectionService.EnabledState & Common.Models.AMT_REDIRECTION_SERVICE_ENABLE_STATE.Other) !== 0
    let kvmEnabled = (
      (features.CIM_KVMRedirectionSAP.EnabledState === Common.Models.AMT_REDIRECTION_SERVICE_ENABLE_STATE.EnabledButOffline &&
        features.CIM_KVMRedirectionSAP.RequestedState === Common.Models.AMT_REDIRECTION_SERVICE_ENABLE_STATE.Enabled) ||
      features.CIM_KVMRedirectionSAP.EnabledState === Common.Models.AMT_REDIRECTION_SERVICE_ENABLE_STATE.Enabled ||
      features.CIM_KVMRedirectionSAP.EnabledState === Common.Models.AMT_REDIRECTION_SERVICE_ENABLE_STATE.EnabledButOffline)

    if (profile.solEnabled !== solEnabled) {
      solEnabled = profile.enableSOL
      isRedirectionChanged = true
    }

    if (profile.iderEnabled !== iderEnabled) {
      iderEnabled = profile.enableIDER
      isRedirectionChanged = true
    }

    if ((solEnabled || iderEnabled) && !redirectionListenerEnabled) {
      isRedirectionChanged = true
    }

    if (profile.kvmEnabled !== kvmEnabled) {
      kvmEnabled = profile.enableKVM
      isRedirectionChanged = true
    }

    if (isRedirectionChanged && (solEnabled || iderEnabled || kvmEnabled)) {
      redirectionListenerEnabled = true
    } else if (isRedirectionChanged && !solEnabled && !iderEnabled && !kvmEnabled) {
      redirectionListenerEnabled = false
    }

    let nextXmlMsg
    if (isRedirectionChanged) {
      // what is this magic numbers going on?
      features.AMT_RedirectionService.EnabledState = 32768 + ((iderEnabled ? 1 : 0) + (solEnabled ? 2 : 0))
      features.AMT_RedirectionService.ListenerEnabled = redirectionListenerEnabled
      // for SOL and IDER
      features.setRedirectionServiceXml = this.amt.RedirectionService(AMT.Methods.REQUEST_STATE_CHANGE, features.AMT_RedirectionService.EnabledState)
      // for KVM
      const requestedState = kvmEnabled ? Common.Models.AMT_REDIRECTION_SERVICE_ENABLE_STATE.Enabled : Common.Models.AMT_REDIRECTION_SERVICE_ENABLE_STATE.Disabled
      features.setKvmRedirectionSapXml = this.cim.KVMRedirectionSAP(CIM.Methods.REQUEST_STATE_CHANGE, requestedState)
      // and don't forget the put
      const redirectionResponse: AMT.Models.RedirectionResponse = {
        AMT_RedirectionService: features.AMT_RedirectionService
      }
      features.putRedirectionServiceXml = this.amt.RedirectionService(AMT.Methods.PUT, null, redirectionResponse)
      nextXmlMsg = features.setRedirectionServiceXml
    }

    const UserConsentOptions = {
      none: 0,
      kvm: 1,
      all: 4294967295
    }
    const key = profile.userConsent.toLowerCase()
    if (features.IPS_OptInService.OptInRequired !== UserConsentOptions[key]) {
      features.IPS_OptInService.OptInRequired = UserConsentOptions[key]
      features.putIpsOptInServiceXml = this.ips.OptInService(IPS.Methods.PUT, null, features.IPS_OptInService)
      if (!nextXmlMsg) {
        nextXmlMsg = features.putIpsOptInServiceXml
      }
    }
    // complete this state in the features flow
    features.transitionFromGetToSet = false
    return nextXmlMsg
  }
}
